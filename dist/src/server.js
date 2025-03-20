"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const authRoute_1 = __importDefault(require("./routes/authRoute"));
const postRoute_1 = __importDefault(require("./routes/postRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const commentRoute_1 = __importDefault(require("./routes/commentRoute"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app); // Create HTTP server to handle socket.io
// Middleware
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
// Static files for images
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../public/uploads')));
app.use(express_1.default.static(path_1.default.resolve(__dirname, '..', '../front')));
// Routes
app.use('/auth', authRoute_1.default);
app.use('/posts', postRoute_1.default);
app.use('/comments', commentRoute_1.default);
app.use('/users', userRoute_1.default);
app.use("*", (req, res) => {
    res.sendFile(path_1.default.resolve(__dirname, '..', '../front/index.html'));
});
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Web Dev 2025 REST API",
            version: "1.0.0",
            description: "REST server including authentication using JWT",
        },
        servers: [{ url: "http://localhost:3001", }, { url: process.env.DOMAIN_URL }],
    },
    apis: ["./src/routes/*.ts"],
};
const specs = (0, swagger_jsdoc_1.default)(options);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Connect to MongoDB
const db = mongoose_1.default.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));
const initApp = () => {
    return new Promise((resolve, reject) => {
        if (!process.env.MONGODB_URI) {
            reject("MONGODB_URI is not defined in .env file");
        }
        else {
            mongoose_1.default
                .connect(process.env.MONGODB_URI)
                .then(() => {
                resolve({ app, server });
            })
                .catch((error) => {
                reject(error);
            });
        }
    });
};
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
exports.default = initApp;
//# sourceMappingURL=server.js.map