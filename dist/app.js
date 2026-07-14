"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_2 = require("./config/passport");
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
(0, passport_2.passportConfig)(passport_1.default);
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = require("./admin");
// Initialize AdminJS
(0, admin_1.setupAdmin)(app);
const api_1 = __importDefault(require("./routes/api"));
// Routes
app.use('/api', api_1.default);
app.use('/auth', auth_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
