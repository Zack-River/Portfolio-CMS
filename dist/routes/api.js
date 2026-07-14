"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolioController_1 = require("../controllers/portfolioController");
const router = (0, express_1.Router)();
// Public route for the frontend to consume
router.get('/portfolio', portfolioController_1.getPortfolioData);
exports.default = router;
