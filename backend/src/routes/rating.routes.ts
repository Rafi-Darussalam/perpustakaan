import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/index";
import { rating } from "../db/schema/rating";
import { buku } from "../db/schema/buku";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

const ratingRouter = Router();

// Helper to check user auth
async function requireAuth(req: Request, res: Response, next: () => void) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });
        if (!session) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!req.body) req.body = {};
        req.body.currentUser = session.user;
        next();
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// CREATE / UPDATE RATING
ratingRouter.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { bukuId, nilai, currentUser } = req.body;

        if (!bukuId || typeof nilai !== 'number' || nilai < 1 || nilai > 5) {
            res.status(400).json({ error: "Buku ID dan nilai rating (1-5) wajib diisi" });
            return;
        }

        const bId = Number(bukuId);

        // Check if book exists
        const existBuku = await db.select().from(buku).where(eq(buku.id, bId));
        if (existBuku.length === 0) {
            res.status(404).json({ error: "Buku tidak ditemukan" });
            return;
        }

        // Check if user already rated this book
        const existingRating = await db.select().from(rating).where(
            and(
                eq(rating.bukuId, bId),
                eq(rating.userId, currentUser.id)
            )
        );

        if (existingRating.length > 0) {
            // Update existing rating
            await db.update(rating).set({
                nilai,
                updatedAt: new Date()
            }).where(eq(rating.id, existingRating[0].id));
        } else {
            // Create new rating
            await db.insert(rating).values({
                bukuId: bId,
                userId: currentUser.id,
                nilai,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Recalculate average and count
        const allRatings = await db.select({ nilai: rating.nilai }).from(rating).where(eq(rating.bukuId, bId));
        const ratingCount = allRatings.length;
        const totalNilai = allRatings.reduce((sum, r) => sum + r.nilai, 0);
        const ratingAverage = ratingCount > 0 ? totalNilai / ratingCount : 0;

        // Update book stats
        await db.update(buku).set({
            ratingAverage,
            ratingCount,
            updatedAt: new Date()
        }).where(eq(buku.id, bId));

        res.json({ success: true, message: "Rating berhasil disimpan" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET USER'S RATING FOR A BOOK
ratingRouter.get("/my-rating/:bukuId", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentUser } = req.body;
        const bukuId = Number(req.params.bukuId);

        if (isNaN(bukuId)) {
            res.status(400).json({ error: "Buku ID tidak valid" });
            return;
        }

        const existingRating = await db.select().from(rating).where(
            and(
                eq(rating.bukuId, bukuId),
                eq(rating.userId, currentUser.id)
            )
        );

        if (existingRating.length > 0) {
            res.json({ success: true, rating: existingRating[0].nilai });
        } else {
            res.json({ success: true, rating: null });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export { ratingRouter };
