"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db_1.default.user.findUnique({ where: { email } });
    if (user && await bcryptjs_1.default.compare(password, user.password)) {
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SESSION_SECRET || 'fallback_secret', { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});
// Protect all routes below this middleware
router.use(auth_middleware_1.authenticateToken);
// Generic GET for user models (PortfolioSettings, HeroSection, etc.)
router.get('/:model', async (req, res) => {
    const modelName = req.params.model;
    const userId = req.user.id;
    try {
        const data = await db_1.default[modelName].findMany({ where: { userId } });
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: 'Invalid model or fetch error' });
    }
});
// Generic POST for models
router.post('/:model', async (req, res) => {
    const modelName = req.params.model;
    const userId = req.user.id;
    try {
        const data = await db_1.default[modelName].create({
            data: { ...req.body, userId }
        });
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: 'Create error', details: error });
    }
});
// Generic PUT (update) for models
router.put('/:model/:id', async (req, res) => {
    const { model, id } = req.params;
    const userId = req.user.id;
    try {
        // Basic authorization check could be added here
        const data = await db_1.default[model].update({
            where: { id },
            data: req.body
        });
        res.json(data);
    }
    catch (error) {
        res.status(400).json({ error: 'Update error', details: error });
    }
});
// Generic DELETE for models
router.delete('/:model/:id', async (req, res) => {
    const { model, id } = req.params;
    try {
        await db_1.default[model].delete({
            where: { id }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: 'Delete error', details: error });
    }
});
// Single items (HeroSection, PortfolioSettings) might need an upsert route
router.put('/single/:model', async (req, res) => {
    const modelName = req.params.model;
    const userId = req.user.id;
    try {
        const existing = await db_1.default[modelName].findUnique({ where: { userId } });
        if (existing) {
            const data = await db_1.default[modelName].update({
                where: { userId },
                data: req.body
            });
            res.json(data);
        }
        else {
            const data = await db_1.default[modelName].create({
                data: { ...req.body, userId }
            });
            res.json(data);
        }
    }
    catch (error) {
        res.status(400).json({ error: 'Update error', details: error });
    }
});
exports.default = router;
