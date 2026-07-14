import express from 'express';
import { upload } from '../middleware/upload';
import { processImageToWebp } from '../middleware/imageProcess';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Use authentication middleware for all content routes
router.use((req, res, next) => authenticateToken(req, res, next));

// Generic GET endpoints for now
router.get('/hero', async (req: any, res) => {
  try {
    const hero = await prisma.heroSection.findUnique({
      where: { userId: req.user.id }
    });
    res.json(hero);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Hero Section' });
  }
});

router.get('/projects', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId: req.user.id },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true, // Needed for the list view summary
          imageUrl: true,
          order: true,
          // Omitting gallery and tags to save bandwidth in list view
        }
      }),
      prisma.project.count({ where: { userId: req.user.id } })
    ]);
    
    res.json({
      data: projects,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Projects' });
  }
});

router.get('/services', async (req: any, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { userId: req.user.id },
      orderBy: { order: 'asc' }
    });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Services' });
  }
});

router.get('/skill-groups', async (req: any, res) => {
  try {
    const groups = await prisma.skillGroup.findMany({
      where: { userId: req.user.id },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { skills: true }
        }
      }
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Skill Groups' });
  }
});

router.get('/skills', async (req: any, res) => {
  try {
    const { groupId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const whereClause: any = { userId: req.user.id };
    if (groupId) {
      whereClause.skillGroupId = groupId;
    }
    
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where: whereClause,
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.skill.count({ where: whereClause })
    ]);
    
    res.json({
      data: skills,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Skills' });
  }
});

router.get('/works', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where: { userId: req.user.id },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.work.count({ where: { userId: req.user.id } })
    ]);
    res.json({
      data: works,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Works' });
  }
});

router.get('/clients', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { userId: req.user.id },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.client.count({ where: { userId: req.user.id } })
    ]);
    res.json({
      data: clients,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Clients' });
  }
});

// Generic DELETE endpoints
router.delete('/:model/:id', async (req: any, res) => {
  const { model, id } = req.params;
  
  try {
    let result;
    switch(model) {
      case 'projects':
        result = await prisma.project.delete({ where: { id, userId: req.user.id } });
        break;
      case 'services':
        result = await prisma.service.delete({ where: { id, userId: req.user.id } });
        break;
      case 'skills':
        result = await prisma.skill.delete({ where: { id, userId: req.user.id } });
        break;
      case 'skill-groups':
        result = await prisma.skillGroup.delete({ where: { id, userId: req.user.id } });
        break;
      case 'works':
        result = await prisma.work.delete({ where: { id, userId: req.user.id } });
        break;
      case 'clients':
        result = await prisma.client.delete({ where: { id, userId: req.user.id } });
        break;
      default:
        return res.status(400).json({ error: 'Invalid model type' });
    }
    res.json({ message: 'Deleted successfully', data: result });
  } catch (err) {
    console.error(`Failed to delete ${model}`, err);
    res.status(500).json({ error: `Failed to delete from ${model}` });
  }
});

router.get('/:model/:id', async (req: any, res) => {
  const { model, id } = req.params;
  
  try {
    let result;
    switch(model) {
      case 'projects':
        result = await prisma.project.findUnique({ where: { id, userId: req.user.id } });
        break;
      case 'services':
        result = await prisma.service.findUnique({ where: { id, userId: req.user.id } });
        break;
      case 'skills':
        result = await prisma.skill.findUnique({ where: { id, userId: req.user.id } });
        break;
      case 'skill-groups':
        result = await prisma.skillGroup.findUnique({ where: { id, userId: req.user.id } });
        break;
      case 'works':
        result = await prisma.work.findUnique({ where: { id, userId: req.user.id } });
        break;
      case 'clients':
        result = await prisma.client.findUnique({ where: { id, userId: req.user.id } });
        break;
      default:
        return res.status(400).json({ error: 'Invalid model type' });
    }
    
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) {
    console.error(`Failed to fetch ${model} by id`, err);
    res.status(500).json({ error: `Failed to fetch from ${model}` });
  }
});

router.put('/hero', async (req: any, res) => {
  try {
    const data = { ...req.body };
    delete data.userId;
    delete data.id;
    const hero = await prisma.heroSection.update({
      where: { userId: req.user.id },
      data
    });
    res.json({ message: 'Updated Hero Section successfully', data: hero });
  } catch (err) {
    console.error('Failed to update hero', err);
    res.status(500).json({ error: 'Failed to update Hero Section' });
  }
});

// Generic POST and PUT endpoints
const handleUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 20 },
]);

router.post('/:model', handleUpload, processImageToWebp, async (req: any, res) => {
  const { model } = req.params;
  const data = { ...req.body, userId: req.user.id };
  
  if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map((t: string) => t.trim());
  if (data.galleryUrls) data.gallery = data.galleryUrls;
  if (data.order) data.order = parseInt(data.order);
  if (data.isVisible !== undefined) data.isVisible = data.isVisible === 'true' || data.isVisible === true;

  
  delete data.galleryUrls;

  try {
    let result;
    switch(model) {
      case 'projects':
        result = await prisma.project.create({ data });
        break;
      case 'services':
        result = await prisma.service.create({ data });
        break;
      case 'skills':
        result = await prisma.skill.create({ data });
        break;
      case 'skill-groups':
        result = await prisma.skillGroup.create({ data });
        break;
      case 'works':
        result = await prisma.work.create({ data });
        break;
      case 'clients':
        result = await prisma.client.create({ data });
        break;
      default:
        return res.status(400).json({ error: 'Invalid model type' });
    }
    res.json({ message: 'Created successfully', data: result });
  } catch (err) {
    console.error(`Failed to create ${model}`, err);
    res.status(500).json({ error: `Failed to create in ${model}` });
  }
});

router.put('/:model/:id', handleUpload, processImageToWebp, async (req: any, res) => {
  const { model, id } = req.params;
  const data = { ...req.body };
  
  if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map((t: string) => t.trim());
  if (data.galleryUrls) data.gallery = data.galleryUrls;
  if (data.order) data.order = parseInt(data.order);
  if (data.isVisible !== undefined) data.isVisible = data.isVisible === 'true' || data.isVisible === true;
  
  delete data.galleryUrls;
  delete data.userId; // don't allow updating userId
  
  try {
    let result;
    switch(model) {
      case 'projects':
        result = await prisma.project.update({ where: { id, userId: req.user.id }, data });
        break;
      case 'services':
        result = await prisma.service.update({ where: { id, userId: req.user.id }, data });
        break;
      case 'skills':
        result = await prisma.skill.update({ where: { id, userId: req.user.id }, data });
        break;
      case 'skill-groups':
        result = await prisma.skillGroup.update({ where: { id, userId: req.user.id }, data });
        break;
      case 'works':
        result = await prisma.work.update({ where: { id, userId: req.user.id }, data });
        break;
      case 'clients':
        result = await prisma.client.update({ where: { id, userId: req.user.id }, data });
        break;
      default:
        return res.status(400).json({ error: 'Invalid model type' });
    }
    res.json({ message: 'Updated successfully', data: result });
  } catch (err) {
    console.error(`Failed to update ${model}`, err);
    res.status(500).json({ error: `Failed to update in ${model}` });
  }
});

export default router;
