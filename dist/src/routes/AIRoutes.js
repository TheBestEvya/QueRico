"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const AIController_1 = __importDefault(require("../controllers/AIController"));
const router = express_1.default.Router();
router.use(auth_1.authenticateJwt);
router.post('/chatMsg', AIController_1.default.getChatResponse);
exports.default = router;
//# sourceMappingURL=AIRoutes.js.map