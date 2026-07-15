"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../db"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    jsonwebtoken_1.default.verify(token, process.env.SESSION_SECRET || 'fallback_secret', async (err, decoded) => {
        if (err)
            return res.status(403).json({ message: 'Forbidden' });
        // Find user to attach to request
        const user = await db_1.default.user.findUnique({ where: { id: decoded.id } });
        if (!user)
            return res.status(403).json({ message: 'User not found' });
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
