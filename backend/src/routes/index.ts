import { Router } from "express";

import userRoutes from "./user.routes";
import docsRoutes from "./docs.routes";
import { bukuRouter } from "./buku";

const rootRouter = Router();


// User routes
rootRouter.use("/users", userRoutes);


// API docs
rootRouter.use("/docs", docsRoutes);

// Buku routes
rootRouter.use("/buku", bukuRouter);

export default rootRouter;
