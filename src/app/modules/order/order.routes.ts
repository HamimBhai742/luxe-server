import { Router } from "express";
import { OrderController } from "./order.controller.js";

const router = Router();

router.post("/", OrderController.createOrder);
router.get("/", OrderController.getAllOrders);
router.get("/:id/invoice/download", OrderController.downloadInvoice);
router.put("/:id", OrderController.updateOrder);
router.delete("/:id", OrderController.deleteOrder);

export const OrderRoutes = router;
export default OrderRoutes;
