import { Router } from "express";
import { PaymentController } from "./payment.controller.js";

const router = Router();

router.post("/create-payment-intent", PaymentController.createPaymentIntent);

export const PaymentRoutes = router;
export default PaymentRoutes;
