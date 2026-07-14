"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passportConfig = void 0;
const passport_local_1 = require("passport-local");
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passportConfig = (passport) => {
    passport.use(new passport_local_1.Strategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await db_1.default.user.findUnique({ where: { email } });
            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }
            const isMatch = await bcrypt_1.default.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await db_1.default.user.findUnique({ where: { id } });
            done(null, user);
        }
        catch (err) {
            done(err, null);
        }
    });
};
exports.passportConfig = passportConfig;
