"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveContactMessage = exports.getPortfolioData = exports.getPortfolioProjects = exports.getPortfolioWorksClients = exports.getPortfolioServices = exports.getPortfolioSkills = exports.getPortfolioFrame = void 0;
const db_1 = __importDefault(require("../db"));
const getPortfolioFrame = async (req, res) => {
    try {
        const user = await db_1.default.user.findFirst();
        if (!user)
            return res.status(404).json({ message: 'No portfolio data found.' });
        const [settings, hero, contacts, navItems] = await Promise.all([
            db_1.default.portfolioSettings.findUnique({ where: { userId: user.id } }),
            db_1.default.heroSection.findUnique({ where: { userId: user.id } }),
            db_1.default.contact.findMany({ where: { userId: user.id } }),
            db_1.default.navItem.findMany({ where: { userId: user.id, isVisible: true }, orderBy: { order: 'asc' } })
        ]);
        res.json({ settings, hero, contacts: contacts.length > 0 ? contacts[0] : null, navItems });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPortfolioFrame = getPortfolioFrame;
const getPortfolioSkills = async (req, res) => {
    try {
        const user = await db_1.default.user.findFirst();
        if (!user)
            return res.status(404).json({ message: 'No portfolio data found.' });
        const skillGroups = await db_1.default.skillGroup.findMany({
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
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPortfolioSkills = getPortfolioSkills;
const getPortfolioServices = async (req, res) => {
    try {
        const user = await db_1.default.user.findFirst();
        if (!user)
            return res.status(404).json({ message: 'No portfolio data found.' });
        const services = await db_1.default.service.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } });
        res.json({ services });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPortfolioServices = getPortfolioServices;
const getPortfolioWorksClients = async (req, res) => {
    try {
        const user = await db_1.default.user.findFirst();
        if (!user)
            return res.status(404).json({ message: 'No portfolio data found.' });
        const [works, clients] = await Promise.all([
            db_1.default.work.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } }),
            db_1.default.client.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } }),
        ]);
        res.json({ works, clients });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPortfolioWorksClients = getPortfolioWorksClients;
const getPortfolioProjects = async (req, res) => {
    try {
        const user = await db_1.default.user.findFirst();
        if (!user)
            return res.status(404).json({ message: 'No portfolio data found.' });
        const projects = await db_1.default.project.findMany({ where: { userId: user.id }, orderBy: { order: 'asc' } });
        res.json({ projects });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPortfolioProjects = getPortfolioProjects;
// Keep old monolithic fetch for backwards compatibility in case anything breaks
const getPortfolioData = async (req, res) => {
    try {
        const user = await db_1.default.user.findFirst();
        if (!user)
            return res.status(404).json({ message: 'No portfolio data found.' });
        const userId = user.id;
        const [settings, hero, skillGroups, works, clients, services, projects, contacts, navItems] = await Promise.all([
            db_1.default.portfolioSettings.findUnique({ where: { userId } }),
            db_1.default.heroSection.findUnique({ where: { userId } }),
            db_1.default.skillGroup.findMany({
                where: { userId, isVisible: true },
                orderBy: { order: 'asc' },
                include: {
                    skills: {
                        where: { isVisible: true },
                        orderBy: { order: 'asc' }
                    }
                }
            }),
            db_1.default.work.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.client.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.service.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.project.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.contact.findMany({ where: { userId } }),
            db_1.default.navItem.findMany({ where: { userId, isVisible: true }, orderBy: { order: 'asc' } })
        ]);
        res.json({
            settings,
            hero,
            skillGroups,
            works,
            clients,
            services,
            projects,
            contacts: contacts.length > 0 ? contacts[0] : null,
            navItems
        });
    }
    catch (error) {
        console.error('Error fetching portfolio data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPortfolioData = getPortfolioData;
const saveContactMessage = async (req, res) => {
    try {
        const user = await db_1.default.user.findFirst();
        if (!user)
            return res.status(404).json({ message: 'No portfolio data found.' });
        const { name, email, service, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const newMessage = await db_1.default.message.create({
            data: {
                userId: user.id,
                name,
                email,
                service,
                message
            }
        });
        res.json({ success: true, message: 'Message saved successfully', data: newMessage });
    }
    catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.saveContactMessage = saveContactMessage;
