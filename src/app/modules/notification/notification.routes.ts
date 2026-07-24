import { Router } from "express";
import { NotificationController } from "./notification.controller.js";

const router = Router();

router.get("/", NotificationController.getAllNotifications);
router.patch("/mark-read", NotificationController.markAllAsRead);
router.patch("/:id/mark-read", NotificationController.markSingleAsRead);
router.delete("/clear-all", NotificationController.clearAllNotifications);
router.delete("/:id", NotificationController.deleteNotification);

export const NotificationRoutes = router;
export default NotificationRoutes;
