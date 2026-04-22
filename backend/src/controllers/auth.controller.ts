// @ts-nocheck
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { generateAIDataForExam } from '../services/aiService';
import { computeSubjectPriority, buildWeeklySchedule } from '../services/studyPlanEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, name, age, city, state, alreadyTaken, targetExam, howFound, subjectLevels } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'E-mail, nome e senha são obrigatórios.' });
    }

    // 1. Check existing user
    const existingUser = await (prisma as any).user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    const user = await (prisma as any).user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        age: age ? (typeof age === 'string' ? parseInt(age) : age) : null,
        city: city || null,
        state: state || null,
        alreadyTaken: Boolean(alreadyTaken),
        targetExam: targetExam || null,
        howFound: howFound || null,
        subjectLevels: subjectLevels || {}
      }
    });

    // 4. (OPTIMISTIC) Try generate plan but don't crash if it fails
    try {
      const planExamName = targetExam || 'Plano Personalizado';
      const aiData = await generateAIDataForExam(planExamName);
      
      let examId = '';
      const existingExam = await (prisma as any).exam.findFirst({
        where: { name: planExamName }
      });

      if (existingExam) {
        examId = existingExam.id;
      } else {
        const newExam = await (prisma as any).exam.create({
          data: {
            name: planExamName,
            organization: 'Diversas',
            area: 'Geral',
            level: 'Superior',
            status: 'Previsto',
            subjects: aiData.subjects as any
          }
        });
        examId = newExam.id;
      }

      const examSubjectsList = aiData.subjects.map((s: string) => ({
        subject: s,
        questionCount: 10,
        topics: []
      }));

      const priorities = computeSubjectPriority((subjectLevels as any) || {}, examSubjectsList);
      const weeklySchedule = buildWeeklySchedule(priorities, null, 2);

      await (prisma as any).studyPlan.create({
        data: {
          userId: user.id,
          examId,
          contentBlocks: priorities.map(p => ({ ...p, status: 'todo', hoursSpent: 0 })) as any,
          weeklySchedule: weeklySchedule as any,
          status: 'ACTIVE',
          progress: 0
        }
      });

    } catch (planError: any) {
      console.warn('[REGISTRATION] Plan generation failed (non-fatal):', planError.message);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.status(201).json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email },
      message: 'Conta criada com sucesso!'
    });

  } catch (error: any) {
    console.error('[REGISTRATION] FATAL:', error);
    return res.status(500).json({ message: 'Erro interno ao criar conta.', error: error.message });
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    const user = await (prisma as any).user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

export const getProfile = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, age: true, city: true, state: true,
        targetExam: true, xp: true, level: true, rankingPoints: true,
        alreadyTaken: true, subjectLevels: true, createdAt: true
      }
    });

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};
