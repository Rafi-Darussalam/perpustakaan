import type { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session || session.user.role !== "admin") {
            res.status(403).json({ error: "Forbidden: Admin access required" });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
