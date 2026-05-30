import { Router } from "express";

import userRoutes from "./user.routes";
import docsRoutes from "./docs.routes";
import { bukuRouter } from "./buku";
import { peminjamanRouter } from "./peminjaman";
import { ratingRouter } from "./rating.routes";

const rootRouter = Router();


import adminUserRoutes from "./admin.user.routes";

// User routes
rootRouter.use("/users", userRoutes);

// Admin User routes
rootRouter.use("/admin/users", adminUserRoutes);

// API docs
rootRouter.use("/docs", docsRoutes);

// Buku routes
rootRouter.use("/buku", bukuRouter);

// Peminjaman routes
rootRouter.use("/peminjaman", peminjamanRouter);

// Rating routes
rootRouter.use("/rating", ratingRouter);

export default rootRouter;
