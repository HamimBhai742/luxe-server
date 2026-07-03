import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";

export const router = Router();

const routes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});
