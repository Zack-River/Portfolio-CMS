import { Request, Response } from 'express';
import prisma from '../db';

export const getPortfolioFrame = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ message: 'No portfolio data found.' });
    
    const [settings, hero, contacts] = await Promise.all([
      prisma.portfolioSettings.findUnique({ where: { userId: user.id } }),
      prisma.heroSection.findUnique({ where: { userId: user.id } }),
      prisma.contact.findMany({ where: { userId: user.id } })
    ]);
    
    res.json({ settings, hero, contacts: contacts.length > 0 ? contacts[0] : null });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPortfolioSkills = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ message: 'No portfolio data found.' });
    
    const skillGroups = await prisma.skillGroup.findMany({ 
      where: { userId: user.id, isVisible: true }, 
      orderBy: { order: 'asc' },
      include: {
        skills: {
          where: { isVisible: true },
          orderBy: { order: 'asc' }
        }
      }
    });
    res.json({ skillGroups });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPortfolioServices = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ message: 'No portfolio data found.' });
    
    const services = await prisma.service.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } });
    res.json({ services });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPortfolioWorksClients = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ message: 'No portfolio data found.' });
    
    const [works, clients] = await Promise.all([
      prisma.work.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } }),
      prisma.client.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } }),
    ]);
    res.json({ works, clients });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPortfolioProjects = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ message: 'No portfolio data found.' });
    
    const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } });
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Keep old monolithic fetch for backwards compatibility in case anything breaks
export const getPortfolioData = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ message: 'No portfolio data found.' });

    const userId = user.id;

    const [settings, hero, skillGroups, works, clients, services, projects, contacts] = await Promise.all([
      prisma.portfolioSettings.findUnique({ where: { userId } }),
      prisma.heroSection.findUnique({ where: { userId } }),
      prisma.skillGroup.findMany({ 
        where: { userId, isVisible: true }, 
        orderBy: { order: 'asc' },
        include: {
          skills: {
            where: { isVisible: true },
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.work.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
      prisma.client.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
      prisma.service.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
      prisma.project.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
      prisma.contact.findMany({ where: { userId } })
    ]);

    res.json({
      settings,
      hero,
      skillGroups,
      works,
      clients,
      services,
      projects,
      contacts: contacts.length > 0 ? contacts[0] : null
    });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
