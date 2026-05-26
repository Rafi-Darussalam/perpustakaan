import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/error-handler";

const router = Router();
router.get("/me", asyncHandler(UserController.getProfile));
export default router;
