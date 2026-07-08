import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";
import { ProductRoutes } from "../modules/product/product.routes.js";
import { UploadRoutes } from "../modules/upload/upload.routes.js";
import { CategoryRoutes } from "../modules/category/category.routes.js";
import { UserRoutes } from "../modules/user/user.routes.js";
import { CouponRoutes } from "../modules/coupon/coupon.routes.js";
import { OrderRoutes } from "../modules/order/order.routes.js";
import { TransactionRoutes } from "../modules/transaction/transaction.routes.js";
import { WishlistRoutes } from "../modules/wishlist/wishlist.routes.js";
import { CartRoutes } from "../modules/cart/cart.routes.js";
import { PaymentRoutes } from "../modules/payment/payment.routes.js";
import { AddressRoutes } from "../modules/address/address.routes.js";
import { ReviewRoutes } from "../modules/review/review.routes.js";
import { ChatbotRoutes } from "../modules/chatbot/chatbot.routes.js";
import { SupportRoutes } from "../modules/support/support.routes.js";

export const router = Router();

const routes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/coupons",
    route: CouponRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/transactions",
    route: TransactionRoutes,
  },
  {
    path: "/wishlist",
    route: WishlistRoutes,
  },
  {
    path: "/cart",
    route: CartRoutes,
  },
  {
    path: "/payments",
    route: PaymentRoutes,
  },
  {
    path: "/addresses",
    route: AddressRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/chatbot",
    route: ChatbotRoutes,
  },
  {
    path: "/support",
    route: SupportRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});
