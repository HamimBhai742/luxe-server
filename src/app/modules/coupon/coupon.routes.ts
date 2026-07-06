import { Router } from "express";
import { CouponController } from "./coupon.controller.js";

const router = Router();

router.post("/", CouponController.createCoupon);
router.get("/", CouponController.getAllCoupons);
router.put("/:id", CouponController.updateCoupon);
router.delete("/:id", CouponController.deleteCoupon);

export const CouponRoutes = router;
export default CouponRoutes;
