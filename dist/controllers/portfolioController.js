"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortfolioData = void 0;
const db_1 = __importDefault(require("../db"));
const getPortfolioData = async (req, res) => {
    try {
        // If we have multi-tenancy, we would get tenantId from req.params
        // For now, let's just get the first user's data (single admin)
        const user = await db_1.default.user.findFirst();
        if (!user) {
            return res.status(404).json({ message: 'No portfolio data found.' });
        }
        const userId = user.id;
        // Fetch all related data
        const [settings, hero, skills, works, clients, services, projects, contacts] = await Promise.all([
            db_1.default.portfolioSettings.findUnique({ where: { userId } }),
            db_1.default.heroSection.findUnique({ where: { userId } }),
            db_1.default.skill.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.work.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.client.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.service.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.project.findMany({ where: { userId }, orderBy: { order: 'asc' } }),
            db_1.default.contact.findMany({ where: { userId } })
        ]);
        res.json({
            settings,
            hero,
            skills,
            works,
            clients,
            services,
            projects,
            contacts: contacts.length > 0 ? contacts[0] : null // Usually only 1 contact info
        });
    }
    catch (error) {
        console.error('Error fetching portfolio data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPortfolioData = getPortfolioData;
