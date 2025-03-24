import { Request, Response } from 'express';
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const OpenAIURL = process.env.CHATBOT_URL || "https://api.openai.com/v1/chat/completions"

const getChatResponse = async (req: Request, res: Response):Promise<any> => {
  try {
    const { message, history, model, location } = req.body;
       // Define a system prompt to guide the AI
       const systemPrompt = {
        role: "system",
        content:
          "You are a friendly and engaging AI assistant that helps users discover what they feel like eating. If a user is unsure or doesn’t specify their preference, ask simple and intuitive questions to narrow down their cravings. Consider factors like cuisine type, dietary restrictions, meal time, and mood. if location was added, use the user's location to find his city, and recommend nearby restaurants that match their preferences. Ensure the experience is enjoyable and effortless while guiding them to the best restaurant options available near them.",
      };
      
      // Structure messages with history for a contextual conversation
    const messages = [
      systemPrompt,
      ...(history || []), // Preserve past messages for contextual responses
      { role: "user", content:  (location)? `The user is in lng -${location.lng} lat -${location.lat}\n` + message: message }, // Current user input
    ];
    const response = await axios.post(
      OpenAIURL,
      {
        model: model,
        messages: messages,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error fetching chat response', error });
  }
};


export default { getChatResponse };