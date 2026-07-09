import { Router } from "express";
import { UserController } from "./user.controller.js";
import { auth } from "../../middlewares/auth.js";

const router = Router();

router.post("/", UserController.createUser);
router.get("/", UserController.getAllUsers);

router.get("/profile", auth, UserController.getMyProfile);
router.put("/profile", auth, UserController.updateMyProfile);
router.post("/change-password", auth, UserController.changeMyPassword);

router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);

export const UserRoutes = router;
export default UserRoutes;
