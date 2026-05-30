import { Router } from "express";
import { AdminUserController } from "../controllers/admin.user.controller";
import { requireAdmin } from "../middleware/admin";
import { asyncHandler } from "../middleware/error-handler";

const router = Router();

router.use(asyncHandler(requireAdmin));

router.get("/count", asyncHandler(AdminUserController.getUserCount));
router.get("/", asyncHandler(AdminUserController.listActiveUsers));
router.get("/deleted", asyncHandler(AdminUserController.listDeletedUsers));
router.post("/:id/soft-delete", asyncHandler(AdminUserController.softDeleteUser));
router.post("/bulk-soft-delete", asyncHandler(AdminUserController.bulkSoftDelete));
router.post("/:id/restore", asyncHandler(AdminUserController.restoreUser));
router.delete("/:id/hard-delete", asyncHandler(AdminUserController.hardDeleteUser));

export default router;
