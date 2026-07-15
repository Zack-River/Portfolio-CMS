"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://zack-river.vercel.app'
];
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
// Import routes
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const api_1 = __importDefault(require("./routes/api"));
const content_routes_1 = __importDefault(require("./routes/content.routes"));
// Routes
app.use('/api/admin', admin_routes_1.default);
app.use('/api/admin/content', content_routes_1.default);
app.use('/api', api_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
