import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { UnauthorizedError } from "../lib/errors";

export const UserController = {
    async getProfile(req: Request, res: Response) {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            throw new UnauthorizedError("Not authenticated");
        }

        return res.json({ user: session.user });
    },
};
