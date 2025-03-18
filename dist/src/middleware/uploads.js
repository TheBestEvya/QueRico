"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = 'public/uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// הגדרת אחסון הקבצים
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        try {
            const { name, email, text } = req.body;
            if (text) {
                cb(null, file.originalname);
            }
            else {
                // Sanitize name and email to prevent invalid filenames
                const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
                const sanitizedEmail = email.replace(/[^a-zA-Z0-9-_]/g, '');
                const fileName = `${sanitizedName}_${sanitizedEmail}_${path_1.default.extname(file.originalname)}`;
                cb(null, fileName);
            }
        }
        catch (error) {
            cb(error, '');
        }
    }
});
// פילטר קבצים
const fileFilter = (req, file, cb) => {
    if (!file) {
        return cb(null, false); // Skip Multer processing if there's no file
    }
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};
exports.uploadImage = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});
//# sourceMappingURL=uploads.js.map