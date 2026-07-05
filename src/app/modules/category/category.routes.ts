import { Router } from "express";
import { CategoryController } from "./category.controller.js";

const router = Router();

router.post("/", CategoryController.createCategory);
router.get("/", CategoryController.getAllCategories);
router.put("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

export const CategoryRoutes = router;
export default CategoryRoutes;
