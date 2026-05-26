import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/index";
import { buku } from "../db/schema/buku";
import { requireAdmin } from "../middleware/admin";
import { eq, like, and, sql, inArray } from "drizzle-orm";

const bukuRouter = Router();

bukuRouter.use(requireAdmin);

bukuRouter.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const { judul, penulis, kategori, status, ratingAverage, ratingCount } = req.body as {
            judul: string;
            penulis: string;
            kategori: string;
            status: string;
            ratingAverage?: number;
            ratingCount?: number;
        };

        const result = await db.insert(buku).values({
            judul,
            penulis,
            kategori,
            status: status || "tersedia",
            ratingAverage: ratingAverage ?? 0,
            ratingCount: ratingCount ?? 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({ success: true, insertId: result[0].insertId });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

bukuRouter.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const search = (req.query.search as string) || "";
        const status = (req.query.status as string) || "";
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const filters = [];
        if (search) filters.push(like(buku.judul, `%${search}%`));
        if (status) filters.push(eq(buku.status, status));

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        const data = await db.select().from(buku)
            .where(whereClause)
            .limit(limit)
            .offset(offset);

        const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(buku).where(whereClause);
        const count = Number(countResult.count);

        res.json({
            status: "success",
            data,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

bukuRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID" });
            return;
        }

        const data = await db.select().from(buku).where(eq(buku.id, id));
        if (data.length === 0) {
            res.status(404).json({ error: "Buku not found" });
            return;
        }

        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

bukuRouter.put("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID" });
            return;
        }

        const { judul, penulis, kategori, status, ratingAverage, ratingCount } = req.body as {
            judul: string;
            penulis: string;
            kategori: string;
            status: string;
            ratingAverage?: number;
            ratingCount?: number;
        };

        await db.update(buku).set({
            judul,
            penulis,
            kategori,
            status,
            ratingAverage,
            ratingCount,
            updatedAt: new Date()
        }).where(eq(buku.id, id));

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

bukuRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID" });
            return;
        }

        await db.delete(buku).where(eq(buku.id, id));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

bukuRouter.post("/delete-bulk", async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body as { ids: number[] };

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: "ID buku tidak valid atau kosong" });
            return;
        }

        await db.delete(buku).where(inArray(buku.id, ids));

        res.json({
            status: "success",
            message: `${ids.length} buku berhasil dihapus`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export { bukuRouter };
