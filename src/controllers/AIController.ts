import { Request, Response } from 'express';
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const OpenAIURL = process.env.CHATBOT_URL || "https://api.openai.com/v1/chat/completions"
const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

//TODO :: finish and test the axios request
const getChatResponse = async (req: Request, res: Response):Promise<any> => {
  try {


    const { msg } = req.body;
    if(req.file){
    // const base64Image = await getBase64(req.file);
    }

    const response = await axios.post(OpenAIURL, { msg , headers: {
        Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
        "Content-Type": "application/json",
    },} );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat response', error });
  }
};

export default { getChatResponse };