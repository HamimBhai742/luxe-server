import { Router } from "express";
import { TransactionController } from "./transaction.controller.js";

const router = Router();

router.get("/", TransactionController.getAllTransactions);
router.post("/", TransactionController.createTransaction);

export const TransactionRoutes = router;
export default TransactionRoutes;
