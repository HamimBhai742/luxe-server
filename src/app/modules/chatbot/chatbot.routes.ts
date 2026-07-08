import { Router } from "express";
import { ChatbotController } from "./chatbot.controller.js";

const router = Router();

router.post("/chat", ChatbotController.handleChat);

export const ChatbotRoutes = router;
export default ChatbotRoutes;
