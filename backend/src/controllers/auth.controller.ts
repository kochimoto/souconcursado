import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { generateAIDataForExam } from '../services/aiService';
import { computeSubjectPriority, buildWeeklySchedule } from '../services/studyPlanEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: express.Request, res: express.Response) => {
  try {
    // DIAGNÓSTICO: Log do payload de entrada
    console.log('[DIAGNOSTIC] Register Request Body:', JSON.stringify({
      ...req.body,
      password: '[PROTECTED]'
    }));

    const { email, password, name, age, city, state, alreadyTaken, targetExam, howFound, subjectLevels } = req.body;

    if (!email || !password || !name) {
      console.warn('[DIAGNOSTIC] Missing mandatory fields');
      return res.status(400).json({ message: 'E-mail, nome e senha são obrigatórios.' });
    }

    // 1. Check existing user
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch (checkError: any) {
      console.error('[DIAGNOSTIC] prisma.user.findUnique failed:', checkError);
      throw new Error(`Erro ao verificar e-mail: ${checkError.message}`);
    }

    if (existingUser) {
      console.log('[DIAGNOSTIC] User already exists:', email);
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }

    // 2. Hash password
    console.log('[DIAGNOSTIC] Hashing password...');
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError: any) {
      console.error('[DIAGNOSTIC] bcrypt hash error:', hashError);
      throw new Error('Erro ao processar segurança da senha.');
    }

    // 3. Create User
    console.log('[DIAGNOSTIC] Creating user in DB with standardized fields...');
    let user;
    try {
      user = await prisma.user.create({
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
      console.log('[DIAGNOSTIC] User created successfully, ID:', user.id);
    } catch (dbError: any) {
      console.error('[DIAGNOSTIC] prisma.user.create FATAL ERROR:', dbError);
      return res.status(500).json({ 
        message: 'Erro técnico ao salvar sua conta no banco de dados.',
        error: dbError.message,
        code: dbError.code
      });
    }

    // 4. (DEFENSIVE) Generate Automatic Study Plan
    try {
      const planExamName = targetExam || 'Plano Personalizado';
      console.log('[DIAGNOSTIC] Starting Plan generation for:', planExamName);
      const aiData = await generateAIDataForExam(planExamName);
      
      let examId = '';
      const existingExam = await prisma.exam.findFirst({
        where: { name: planExamName }
      });

      if (existingExam) {
        examId = existingExam.id;
      } else {
        const newExam = await prisma.exam.create({
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

      const examSubjectsList = aiData.subjects.map(s => ({
        subject: s,
        questionCount: 10,
        topics: []
      }));

      const priorities = computeSubjectPriority((subjectLevels as any) || {}, examSubjectsList);
      const weeklySchedule = buildWeeklySchedule(priorities, null, 2);

      const contentBlocks = priorities.map(p => ({
        subject: p.subject,
        userLevel: p.userLevel,
        priority: p.priority,
        difficulty: p.difficulty,
        weeklyHours: p.weeklyHours,
        status: 'todo',
        hoursSpent: 0
      }));

      await prisma.studyPlan.create({
        data: {
          userId: user.id,
          examId,
          contentBlocks: contentBlocks as any,
          weeklySchedule: weeklySchedule as any,
          status: 'ACTIVE',
          progress: 0
        }
      });

      for (const card of aiData.initialFlashcards) {
        await prisma.flashcard.create({
          data: {
            userId: user.id,
            front: card.front,
            back: card.back,
            cardType: card.cardType
          }
        });
      }
      console.log('[DIAGNOSTIC] Study plan and flashcards generated.');

    } catch (planError: any) {
      console.error('[DIAGNOSTIC-NON-FATAL] Study Plan generation failed:', planError);
    }

    // 5. Generate Token and Respond
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    console.log('[DIAGNOSTIC] Registration successful, responding.');

    return res.status(201).json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email },
      message: 'Conta criada com sucesso!'
    });

  } catch (error: any) {
    console.error('[DIAGNOSTIC] REGISTRATION GLOBAL CATCH:', error);
    return res.status(500).json({ 
      message: 'Erro interno inesperado durante o registro.',
      error: error.message,
      stack: error.stack // EXPOSTO PARA DEPURAÇÃO
    });
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const getProfile = async (req: express.Request, res: express.Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        city: true,
        state: true,
        targetExam: true,
        xp: true,
        level: true,
        rankingPoints: true,
        alreadyTaken: true,
        subjectLevels: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};
