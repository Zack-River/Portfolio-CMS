import express from 'express';
import { upload } from '../middleware/upload';
import { processImageToWebp } from '../middleware/imageProcess';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const handleUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 20 },
]);

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
    const type = req.query.type; // 'WORK', 'EDUCATION', or undefined for all
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user.id };
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.work.count({ where })
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

router.get('/nav-items', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.navItem.findMany({
        where: { userId: req.user.id },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      prisma.navItem.count({ where: { userId: req.user.id } })
    ]);
    res.json({
      data: items,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch NavItems' });
  }
});

// Generic DELETE endpoints


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

router.put('/settings/about', handleUpload, processImageToWebp, async (req: any, res) => {
  try {
    const { aboutText } = req.body;
    const data: any = {};
    if (aboutText !== undefined) data.aboutText = aboutText;
    if (req.body.imageUrl) data.aboutImageUrl = req.body.imageUrl;

    const settings = await prisma.portfolioSettings.update({
      where: { userId: req.user.id },
      data
    });
    res.json({ message: 'Updated About successfully', data: settings });
  } catch (err) {
    console.error('Failed to update about settings', err);
    res.status(500).json({ error: 'Failed to update About' });
  }
});

router.get('/settings/layout', async (req: any, res) => {
  try {
    const settings = await prisma.portfolioSettings.findUnique({
      where: { userId: req.user.id },
      select: { homeLayout: true }
    });
    res.json({ homeLayout: settings?.homeLayout || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch home layout' });
  }
});

router.put('/settings/layout', async (req: any, res) => {
  try {
    const { homeLayout } = req.body;
    const settings = await prisma.portfolioSettings.update({
      where: { userId: req.user.id },
      data: { homeLayout }
    });
    res.json({ message: 'Layout updated successfully', homeLayout: settings.homeLayout });
  } catch (err) {
    console.error('Failed to update home layout', err);
    res.status(500).json({ error: 'Failed to update home layout' });
  }
});

router.get('/metrics', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const [projects, skills, categories, messages, unread] = await Promise.all([
      prisma.project.count({ where: { userId, isVisible: true } }),
      prisma.skill.count({ where: { userId } }),
      prisma.skillGroup.count({ where: { userId } }),
      prisma.message.count({ where: { userId } }),
      prisma.message.count({ where: { userId, isRead: false } }),
    ]);
    res.json({ projects, skills, categories, messages, unread });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.get('/messages', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { userId: req.user.id } })
    ]);
    res.json({
      data: messages,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Messages' });
  }
});

router.patch('/messages/:id/read', async (req: any, res) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true }
    });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Generic POST and PUT endpoints

router.post('/:model', handleUpload, processImageToWebp, async (req: any, res) => {
  const { model } = req.params;
  const data = { ...req.body, userId: req.user.id };
  
  if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map((t: string) => t.trim());
  if (data.highlights && typeof data.highlights === 'string') data.highlights = data.highlights.split(',').map((t: string) => t.trim());
  if (data.galleryUrls) data.gallery = data.galleryUrls;
  if (data.order) data.order = parseInt(data.order);
  if (data.rating) data.rating = parseInt(data.rating);
  if (data.isVisible !== undefined) data.isVisible = data.isVisible === 'true' || data.isVisible === true;
  if (data.featured !== undefined) data.featured = data.featured === 'true' || data.featured === true;
  if (data.colSpan) data.colSpan = parseInt(data.colSpan);
  if (data.rowSpan) data.rowSpan = parseInt(data.rowSpan);

  
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
      case 'nav-items':
        result = await prisma.navItem.create({ data });
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

// Bulk Layout update endpoint for Grid Builder
router.put('/projects/layout', async (req: any, res) => {
  const patches = req.body;
  if (!Array.isArray(patches)) {
    return res.status(400).json({ error: 'Expected array of patches' });
  }

  try {
    await prisma.$transaction(
      patches.map((p: any) =>
        prisma.project.update({
          where: { id: p.id, userId: req.user.id },
          data: { 
            order: p.order, 
            colSpan: p.colSpan, 
            rowSpan: p.rowSpan, 
            featured: p.featured,
            featuredOrder: p.featuredOrder,
            isVisible: p.isVisible
          },
        })
      )
    );
    res.json({ message: 'Layout saved successfully' });
  } catch (err) {
    console.error('Layout save failed', err);
    res.status(500).json({ error: 'Failed to save layout' });
  }
});

router.put('/:model/:id', handleUpload, processImageToWebp, async (req: any, res) => {
  const { model, id } = req.params;
  const data = { ...req.body };
  
  if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map((t: string) => t.trim());
  if (data.highlights && typeof data.highlights === 'string') data.highlights = data.highlights.split(',').map((t: string) => t.trim());
  if (data.galleryUrls) data.gallery = data.galleryUrls;
  if (data.order) data.order = parseInt(data.order);
  if (data.rating) data.rating = parseInt(data.rating);
  if (data.isVisible !== undefined) data.isVisible = data.isVisible === 'true' || data.isVisible === true;
  if (data.featured !== undefined) data.featured = data.featured === 'true' || data.featured === true;
  if (data.colSpan) data.colSpan = parseInt(data.colSpan);
  if (data.rowSpan) data.rowSpan = parseInt(data.rowSpan);
  
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
      case 'nav-items':
        result = await prisma.navItem.update({ where: { id, userId: req.user.id }, data });
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
      case 'nav-items':
        result = await prisma.navItem.delete({ where: { id, userId: req.user.id } });
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
      case 'nav-items':
        result = await prisma.navItem.findUnique({ where: { id, userId: req.user.id } });
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

export default router;
