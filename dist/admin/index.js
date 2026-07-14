"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAdmin = void 0;
const adminjs_1 = __importDefault(require("adminjs"));
const express_1 = __importDefault(require("@adminjs/express"));
const prisma_1 = require("@adminjs/prisma");
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
adminjs_1.default.registerAdapter({
    Resource: prisma_1.Resource,
    Database: prisma_1.Database,
});
const setupAdmin = async (app) => {
    const admin = new adminjs_1.default({
        resources: [
            {
                resource: { model: (0, prisma_1.getModelByName)('PortfolioSettings'), client: db_1.default },
                options: { navigation: { name: 'Settings' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('HeroSection'), client: db_1.default },
                options: { navigation: { name: 'Content' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('Skill'), client: db_1.default },
                options: { navigation: { name: 'Content' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('Work'), client: db_1.default },
                options: { navigation: { name: 'Content' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('Client'), client: db_1.default },
                options: { navigation: { name: 'Content' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('Service'), client: db_1.default },
                options: { navigation: { name: 'Content' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('Project'), client: db_1.default },
                options: { navigation: { name: 'Content' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('Contact'), client: db_1.default },
                options: { navigation: { name: 'Content' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('User'), client: db_1.default },
                options: { navigation: { name: 'System' } }
            },
            {
                resource: { model: (0, prisma_1.getModelByName)('AuditHistory'), client: db_1.default },
                options: { navigation: { name: 'System' } }
            },
        ],
        rootPath: '/admin',
        branding: {
            companyName: 'Portfolio CMS',
            withMadeWithLove: false,
            logo: false, // You can put the portfolio logo here
            theme: {
                colors: {
                    primary100: '#1e1e1e', // Dark theme to match portfolio
                    primary80: '#2c2c2c',
                    primary60: '#3a3a3a',
                    primary40: '#484848',
                    primary20: '#565656',
                    bg: '#121212',
                    surface: '#1e1e1e',
                    text: '#ffffff',
                    white: '#ffffff',
                    error: '#ff5c5c',
                    success: '#4caf50',
                    warning: '#ff9800',
                },
            },
        },
    });
    const adminRouter = express_1.default.buildAuthenticatedRouter(admin, {
        authenticate: async (email, password) => {
            const user = await db_1.default.user.findUnique({ where: { email } });
            if (user) {
                const matched = await bcrypt_1.default.compare(password, user.password);
                if (matched) {
                    return user;
                }
            }
            return false;
        },
        cookiePassword: process.env.SESSION_SECRET || 'some-secret-password-used-to-secure-cookie',
    }, null, {
        secret: process.env.SESSION_SECRET || 'fallback_secret',
        resave: false,
        saveUninitialized: true,
    });
    app.use(admin.options.rootPath, adminRouter);
};
exports.setupAdmin = setupAdmin;
