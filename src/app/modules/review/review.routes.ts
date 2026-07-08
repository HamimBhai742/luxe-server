import { Router } from "express";
import { ReviewController } from "./review.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

// Eligibility check can be called by logged-in users
router.get("/eligibility/:productId", auth, ReviewController.checkEligibility);

// Submit review can be called by logged-in users
router.post("/", auth, ReviewController.submitReview);

export const ReviewRoutes = router;
export default ReviewRoutes;
