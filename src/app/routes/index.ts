import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";
import { ProductRoutes } from "../modules/product/product.routes.js";
import { UploadRoutes } from "../modules/upload/upload.routes.js";
import { CategoryRoutes } from "../modules/category/category.routes.js";
import { UserRoutes } from "../modules/user/user.routes.js";

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
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});
