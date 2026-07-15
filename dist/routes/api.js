"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolioController_1 = require("../controllers/portfolioController");
const router = (0, express_1.Router)();
// Public routes for the frontend to consume progressively
router.get('/portfolio/frame', portfolioController_1.getPortfolioFrame);
router.get('/portfolio/skills', portfolioController_1.getPortfolioSkills);
router.get('/portfolio/services', portfolioController_1.getPortfolioServices);
router.get('/portfolio/works-clients', portfolioController_1.getPortfolioWorksClients);
router.get('/portfolio/projects', portfolioController_1.getPortfolioProjects);
router.post('/portfolio/contact', portfolioController_1.saveContactMessage);
// Legacy monolithic route
router.get('/portfolio', portfolioController_1.getPortfolioData);
exports.default = router;
