import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { generateAIDataForExam } from '../services/aiService';
import { computeSubjectPriority, buildWeeklySchedule } from '../services/studyPlanEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: express.Request, res: express.Response) => {
  console.log('[DEBUG] Registration started for:', req.body.email);
  try {
    const { email, password, name, age, city, state, alreadyTaken, targetExam, howFound, subjectLevels } = req.body;

    // 1. Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('[DEBUG] User already exists:', email);
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }

    // 2. Hash password
    console.log('[DEBUG] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    console.log('[DEBUG] Creating user in DB...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        age: age ? parseInt(age) : null,
        city,
        state,
        alreadyTaken: Boolean(alreadyTaken),
        targetExam,
        howFound,
        subjectLevels: (subjectLevels as any) || {}
      }
    });
    console.log('[DEBUG] User created successfully, ID:', user.id);

    // 4. (NEW/DEFENSIVE) Generate Automatic Study Plan
    try {
      console.log('[DEBUG] Starting Automatic Study Plan generation for:', targetExam || 'Geral');
      const aiData = await generateAIDataForExam(targetExam || 'Concurso Geral');
      
      // Create or find Exam
      let examId = '';
      const existingExam = await prisma.exam.findFirst({
        where: { name: targetExam }
      });

      if (existingExam) {
        examId = existingExam.id;
      } else {
        const newExam = await prisma.exam.create({
          data: {
            name: targetExam || 'Plano Personalizado',
            organization: 'Diversas',
            area: 'Geral',
            level: 'Superior',
            status: 'Previsto',
            subjects: aiData.subjects as any
          }
        });
        examId = newExam.id;
      }

      // Compute priorities and schedule
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

      console.log('[DEBUG] Saving Study Plan to DB...');
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

      // Generate Initial Flashcards
      console.log('[DEBUG] Generating initial flashcards...');
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
      console.log('[DEBUG] Study plan and flashcards generated successfully.');

    } catch (planError: any) {
      // NON-BLOCKING ERROR: We don't crash registration if plan generation fails
      console.error('[CRITICAL-WARNING] Study Plan generation failed, but user was created:', planError);
    }

    // 5. Generate Token and Respond
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('[DEBUG] Registration complete, sending response.');

    res.status(201).json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email },
      message: 'Conta criada com sucesso!'
    });

  } catch (error: any) {
    console.error('[ERROR] REGISTRATION FATAL ERROR:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }

    res.status(500).json({ 
      message: 'Erro ao criar conta.',
      error: error.message,
      code: error.code
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
