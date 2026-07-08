import { Router } from "express";
import { SupportController } from "./support.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.get("/", auth, SupportController.getTickets);
router.post("/", auth, SupportController.createTicket);

export const SupportRoutes = router;
export default SupportRoutes;
