"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
const socketIO_1 = require("../src/services/socketIO"); // Import socketService
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const port = Number(process.env.PORT); // Convert port to a number
(0, server_1.default)().then(({ app, server }) => {
    if (process.env.NODE_ENV !== "production") {
        (0, socketIO_1.initializeSocket)(server); // This will initialize the Socket.io functionality
        server.listen(port, () => {
            console.log(`QueRico app listening at http://localhost:${port}`);
        });
    }
    else {
        const prop = {
            key: fs_1.default.readFileSync("../client-key.pem"),
            cert: fs_1.default.readFileSync("../client-cert.pem")
        };
        const httpsServer = https_1.default.createServer(prop, app);
        (0, socketIO_1.initializeSocket)(httpsServer);
        httpsServer.listen(port, '0.0.0.0', () => {
            console.log(`QueRico app listening at https://localhost:${port}`);
        });
    }
});
//# sourceMappingURL=app.js.map