import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/verify-account", AuthController.verifyAccount);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/reset-password", AuthController.resetPassword);

export const AuthRoutes = router;
export default AuthRoutes;
