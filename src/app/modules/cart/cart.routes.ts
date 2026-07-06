import { Router } from "express";
import { CartController } from "./cart.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.get("/", auth, CartController.getCart);
router.post("/sync", auth, CartController.syncCart);
router.delete("/:productId", auth, CartController.removeCartItem);
router.delete("/", auth, CartController.clearCart);

export const CartRoutes = router;
export default CartRoutes;
