import { Router } from 'express';
import { 
  getPortfolioData,
  getPortfolioFrame,
  getPortfolioSkills,
  getPortfolioServices,
  getPortfolioWorksClients,
  getPortfolioProjects
} from '../controllers/portfolioController';

const router = Router();

// Public routes for the frontend to consume progressively
router.get('/portfolio/frame', getPortfolioFrame);
router.get('/portfolio/skills', getPortfolioSkills);
router.get('/portfolio/services', getPortfolioServices);
router.get('/portfolio/works-clients', getPortfolioWorksClients);
router.get('/portfolio/projects', getPortfolioProjects);

// Legacy monolithic route
router.get('/portfolio', getPortfolioData);

export default router;
