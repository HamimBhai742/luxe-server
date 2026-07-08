import { Router } from "express";
import { SupportController } from "./support.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.get("/", auth, SupportController.getTickets);
router.post("/", auth, SupportController.createTicket);
router.get("/all", auth, SupportController.getAllTickets);
router.patch("/:id/status", auth, SupportController.updateTicketStatus);

export const SupportRoutes = router;
export default SupportRoutes;
