import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id }, process.env.SESSION_SECRET || 'fallback_secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Protect all routes below this middleware
router.use(authenticateToken);

// Generic GET for user models (PortfolioSettings, HeroSection, etc.)
router.get('/:model', async (req: AuthRequest, res) => {
  const modelName = req.params.model as string;
  const userId = req.user.id;
  try {
    const data = await (prisma as any)[modelName].findMany({ where: { userId } });
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: 'Invalid model or fetch error' });
  }
});

// Generic POST for models
router.post('/:model', async (req: AuthRequest, res) => {
  const modelName = req.params.model as string;
  const userId = req.user.id;
  try {
    const data = await (prisma as any)[modelName].create({
      data: { ...req.body, userId }
    });
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: 'Create error', details: error });
  }
});

// Generic PUT (update) for models
router.put('/:model/:id', async (req: AuthRequest, res) => {
  const { model, id } = req.params as { model: string; id: string };
  const userId = req.user.id;
  try {
    // Basic authorization check could be added here
    const data = await (prisma as any)[model].update({
      where: { id },
      data: req.body
    });
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: 'Update error', details: error });
  }
});

// Generic DELETE for models
router.delete('/:model/:id', async (req: AuthRequest, res) => {
  const { model, id } = req.params as { model: string; id: string };
  try {
    await (prisma as any)[model].delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Delete error', details: error });
  }
});

// Single items (HeroSection, PortfolioSettings) might need an upsert route
router.put('/single/:model', async (req: AuthRequest, res) => {
  const modelName = req.params.model as string;
  const userId = req.user.id;
  try {
    const existing = await (prisma as any)[modelName].findUnique({ where: { userId } });
    if (existing) {
      const data = await (prisma as any)[modelName].update({
        where: { userId },
        data: req.body
      });
      res.json(data);
    } else {
      const data = await (prisma as any)[modelName].create({
        data: { ...req.body, userId }
      });
      res.json(data);
    }
  } catch (error) {
    res.status(400).json({ error: 'Update error', details: error });
  }
});

export default router;
