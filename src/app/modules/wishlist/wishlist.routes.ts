import { Router } from "express";
import { WishlistController } from "./wishlist.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.get("/", auth, WishlistController.getWishlist);
router.post("/", auth, WishlistController.addWishlistItem);
router.delete("/:productId", auth, WishlistController.removeWishlistItem);

export const WishlistRoutes = router;
export default WishlistRoutes;
