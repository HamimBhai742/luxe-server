import { Router } from "express";
import { AddressController } from "./address.controller.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.get("/", auth, AddressController.getUserAddresses);
router.post("/", auth, AddressController.createAddress);
router.put("/:id", auth, AddressController.updateAddress);
router.delete("/:id", auth, AddressController.deleteAddress);
router.patch("/:id/default", auth, AddressController.setDefaultAddress);

export const AddressRoutes = router;
export default AddressRoutes;
