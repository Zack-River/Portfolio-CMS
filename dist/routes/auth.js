"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../db"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Configure Nodemailer transporter
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// Login
router.post('/login', passport_1.default.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/admin/login',
    failureMessage: true,
}));
// Logout
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/admin/login');
    });
});
// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await db_1.default.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    // Generate a reset token valid for 1 hour
    const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.RESET_SECRET || 'fallback_secret', {
        expiresIn: '1h',
    });
    const resetLink = `http://localhost:4000/auth/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset - Portfolio CMS',
        html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
    };
    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Password reset link sent to your email.' });
    }
    catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending password reset email.' });
    }
});
// Setup Initial Admin user (helper route, secure or remove in production)
router.post('/setup', async (req, res) => {
    const { email, password, name } = req.body;
    const existing = await db_1.default.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(400).json({ message: 'Admin already exists' });
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await db_1.default.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        }
    });
    res.json({ message: 'Admin created', user: { id: user.id, email: user.email } });
});
exports.default = router;
