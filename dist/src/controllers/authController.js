"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = exports.googleSignIn = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const google_auth_library_1 = require("google-auth-library");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uploadPath = process.env.UPLOAD_PATH;
const secret = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'default';
const refreshSecret = (_b = process.env.JWT_REFRESH_SECRET) !== null && _b !== void 0 ? _b : 'default';
const expiresIn = (_c = process.env.JWT_EXPIRES_IN) !== null && _c !== void 0 ? _c : '1h';
const refreshExpiresIn = (_d = process.env.JWT_REFRESH_EXPIRES_IN) !== null && _d !== void 0 ? _d : '7d';
if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
}
if (!expiresIn) {
    throw new Error('Missing JWT_EXPIRES_IN environment variable');
}
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleSignIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Missing Google credential' });
        }
        // Verify the Google token
        const ticket = yield client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }
        const { email, picture, name } = payload;
        // Check if user exists in the database
        let user = yield userModel_1.User.findOne({ email });
        if (!user) {
            // Auto-register new user
            user = yield userModel_1.User.create({
                email,
                profileImage: picture,
                name,
                password: 'google-signin', // Placeholder password
            });
        }
        // Generate JWT token
        const accessToken = (0, exports.generateAccessToken)(user._id.toString());
        const refreshToken = (0, exports.generateRefreshToken)(user._id.toString());
        userModel_1.User.findByIdAndUpdate(user._id, { refreshToken });
        return res.status(200).json({ accessToken, refreshToken, user: {
                id: user._id,
                name: user.name,
                profileImage: user.profileImage,
                email: user.email
            } });
    }
    catch (error) {
        console.error('Google sign-in error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.googleSignIn = googleSignIn;
// רישום משתמש חדש
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, email, password } = req.body;
        const existingUser = yield userModel_1.User.findOne({
            $or: [{ email }]
        });
        if (existingUser) {
            return res.status(400).json({
                message: 'email already exists'
            });
        }
        // יצירת המשתמש הבסיסי
        const user = yield userModel_1.User.create({
            name,
            email,
            password
        });
        const userId = user._id.toString();
        const accessToken = (0, exports.generateAccessToken)(userId);
        const refreshToken = (0, exports.generateRefreshToken)(userId);
        // עדכון הrefresh token ותמונת הפרופיל במסד הנתונים בפעולה אחת
        yield userModel_1.User.findByIdAndUpdate(userId, Object.assign({ refreshToken }, (req.file && { profileImage: uploadPath + req.file.filename })));
        console.log((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename, "this is profileimg");
        res.status(201).json({
            user: Object.assign({ id: userId, name: user.name, email: user.email }, (req.file && { profileImage: uploadPath + req.file.filename })),
            accessToken,
            refreshToken
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error creating user', error });
    }
});
// התחברות
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield userModel_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const userId = user._id.toString();
        const accessToken = (0, exports.generateAccessToken)(userId);
        const refreshToken = (0, exports.generateRefreshToken)(userId);
        yield userModel_1.User.findByIdAndUpdate(userId, { refreshToken });
        res.status(200).json({
            user: {
                id: userId,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
            },
            accessToken,
            refreshToken
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});
// חידוש טוקן
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }
        const user = yield userModel_1.User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        try {
            jsonwebtoken_1.default.verify(refreshToken, refreshSecret);
        }
        catch (error) {
            yield userModel_1.User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        const userId = user._id.toString();
        const newAccessToken = (0, exports.generateAccessToken)(userId);
        const newRefreshToken = (0, exports.generateRefreshToken)(userId);
        yield userModel_1.User.findByIdAndUpdate(userId, { refreshToken: newRefreshToken });
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error refreshing token', error });
    }
});
// התנתקות
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        yield userModel_1.User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
        // בקובץ authController.ts או דומה
        try {
            // מניחים שהמשתמש כבר אומת ו-req.user מכיל את המידע על המשתמש הנוכחי
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            // עדכון המשתמש על ידי מחיקת הרפרש טוקן מהמסד נתונים
            const userM = yield userModel_1.User.findById(userId);
            if (!userM) {
                return res.status(404).json({ message: "User not found" });
            }
            // מחיקת הרפרש טוקן על ידי קביעתו לערך ריק
            userM.refreshToken = "";
            yield userM.save();
            // מוחזרת תשובה מוצלחת
            return res.status(200).json({ message: "Successfully logged out" });
        }
        catch (error) {
            console.error("Logout error:", error);
            return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: 'Successfully logged out' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging out', error });
    }
});
// שינוי סיסמה
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword, userId } = req.body;
        const user = yield userModel_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = yield user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        yield user.save();
        return res.status(200).json({ message: 'Password successfully updated' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error changing password', error });
    }
});
// Private methods
const generateAccessToken = (userId) => {
    var _a, _b;
    const secret = (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : 'default';
    const expiresIn = (_b = process.env.JWT_EXPIRES_IN) !== null && _b !== void 0 ? _b : '1h';
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: expiresIn });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    const random = Math.random().toString();
    return jsonwebtoken_1.default.sign({ userId: userId, random: random }, refreshSecret, { expiresIn: refreshExpiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
exports.default = { register, login, refreshToken, logout, changePassword, googleSignIn: exports.googleSignIn };
//# sourceMappingURL=authController.js.map