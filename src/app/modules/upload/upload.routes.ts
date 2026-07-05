import { Router } from "express";
import { UploadController } from "./upload.controller.js";

const router = Router();

router.post("/image", UploadController.uploadImage);

export const UploadRoutes = router;
export default UploadRoutes;
