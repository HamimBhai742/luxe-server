import { Router } from "express";
import { FaqController } from "./faq.controller.js";
import { auth } from "../../middlewares/auth.js";
import type { Request, Response, NextFunction } from "express";

const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || (user.role !== "admin" && user.email !== "admin@gmail.com")) {
    res.status(403).json({ success: false, message: "Forbidden: Admin access only" });
    return;
  }
  next();
};

const router = Router();

router.get("/", FaqController.getAllFaqs);
router.get("/:id", FaqController.getSingleFaq);

router.post("/", auth, adminAuth, FaqController.createFaq);
router.put("/:id", auth, adminAuth, FaqController.updateFaq);
router.delete("/:id", auth, adminAuth, FaqController.deleteFaq);

export const FaqRoutes = router;
export default FaqRoutes;
