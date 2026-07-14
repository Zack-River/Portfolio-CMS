"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const db_1 = __importDefault(require("../db"));
const auditLog = (action) => {
    return async (req, res, next) => {
        // Execute the route handler
        next();
        // After response is sent, log the action
        res.on('finish', async () => {
            // Only log if the request was successful or we explicitly want to log failures
            if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
                try {
                    const user = req.user;
                    await db_1.default.auditHistory.create({
                        data: {
                            userId: user.id,
                            action: action,
                            details: {
                                method: req.method,
                                url: req.originalUrl,
                                body: req.method !== 'GET' ? req.body : undefined,
                            },
                            ipAddress: req.ip,
                        }
                    });
                }
                catch (err) {
                    console.error('Failed to save audit log', err);
                }
            }
        });
    };
};
exports.auditLog = auditLog;
