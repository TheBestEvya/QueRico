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
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const OpenAIURL = process.env.CHATBOT_URL || "https://api.openai.com/v1/chat/completions";
const getChatResponse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message, history, model, location } = req.body;
        // Define a system prompt to guide the AI
        const systemPrompt = {
            role: "system",
            content: "You are a friendly and engaging AI assistant that helps users discover what they feel like eating. If a user is unsure or doesn’t specify their preference, ask simple and intuitive questions to narrow down their cravings. Consider factors like cuisine type, dietary restrictions, meal time, and mood. if location was added, use the user's location to find his city, and recommend nearby restaurants that match their preferences. Ensure the experience is enjoyable and effortless while guiding them to the best restaurant options available near them.",
        };
        // Structure messages with history for a contextual conversation
        const messages = [
            systemPrompt,
            ...(history || []), // Preserve past messages for contextual responses
            { role: "user", content: (location) ? `The user is in lng ${location.lng} lat ${location.lat} ` + message : message }, // Current user input
        ];
        console.log(messages);
        const response = yield axios_1.default.post(OpenAIURL, {
            model: model,
            messages: messages,
            temperature: 0.7,
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
                "Content-Type": "application/json",
            },
        });
        res.status(200).json(response.data);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching chat response', error });
    }
});
exports.default = { getChatResponse };
//# sourceMappingURL=AIController.js.map