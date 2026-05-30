import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/index";
import { buku } from "../db/schema/buku";
import { requireAdmin } from "../middleware/admin";
import { eq, like, and, sql, inArray } from "drizzle-orm";
import path from "path";
import fs from "fs";

const bukuRouter = Router();

// Helper to decode base64 image and save to uploads folder
async function saveBase64Image(base64String: string): Promise<string | null> {
  if (!base64String) return null;
  // Remove data URL prefix if present
  let base64Data = base64String;
  let mimeType = 'image/png'; // default
  if (base64String.startsWith('data:image')) {
    const match = base64String.match(/^data:image\/([a-zA-Z]*);base64,/);
    if (match) {
      mimeType = `image/${match[1]}`;
      base64Data = base64String.replace(/^data:image\/[a-zA-Z]*;base64,/, '');
    }
  }
  // Decode base64
  const buffer = Buffer.from(base64Data, 'base64');
  // Generate unique filename
  const ext = mimeType.split('/')[1] || 'bin';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  // Ensure directory exists
  fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  // Write file
  fs.writeFileSync(filePath, buffer);
  // Return relative path for serving
  return `/uploads/${filename}`;
}

// Helper to delete file if exists
function deleteFileIfExists(relativePath: string | null) {
  if (!relativePath) return;
  const filePath = path.join(process.cwd(), "public", relativePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// CREATE
bukuRouter.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { judul, penulis, kategori, status, gambar, ratingAverage, ratingCount } = req.body as {
            judul: string;
            penulis: string;
            kategori: string;
            status?: string;
            gambar?: string; // base64 string or data URL
            ratingAverage?: number;
            ratingCount?: number;
        };

        let gambarPath: string | null = null;
        if (gambar) {
            gambarPath = await saveBase64Image(gambar);
        }

        const result = await db.insert(buku).values({
            judul,
            penulis,
            kategori,
            status: status || "tersedia",
            gambar: gambarPath,
            ratingAverage: ratingAverage ?? 0,
            ratingCount: ratingCount ?? 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({ success: true, insertId: result[0].insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET TOTAL COUNT
bukuRouter.get("/count", async (_req: Request, res: Response): Promise<void> => {
    try {
        const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(buku);
        res.json({ success: true, count: Number(countResult.count) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// READ ALL
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

// READ ONE
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

// UPDATE
bukuRouter.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID" });
            return;
        }

        const { judul, penulis, kategori, status, gambar, ratingAverage, ratingCount } = req.body as {
            judul: string;
            penulis: string;
            kategori: string;
            status?: string;
            gambar?: string; // base64 string or data URL
            ratingAverage?: number;
            ratingCount?: number;
        };

        // Get existing record to possibly delete old image
        const existing = await db.select().from(buku).where(eq(buku.id, id));
        let gambarPath: string | null = existing[0]?.gambar ?? null;
        if (gambar) {
            // New image provided, delete old one
            deleteFileIfExists(existing[0]?.gambar);
            gambarPath = await saveBase64Image(gambar);
        }
        // If gambar is not provided (undefined), keep existing
        // If gambar is explicitly null, we want to remove existing image
        if (gambar === null) {
            deleteFileIfExists(existing[0]?.gambar);
            gambarPath = null;
        }

        await db.update(buku).set({
            judul,
            penulis,
            kategori,
            status,
            gambar: gambarPath,
            ratingAverage,
            ratingCount,
            updatedAt: new Date()
        }).where(eq(buku.id, id));

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE
bukuRouter.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID" });
            return;
        }

        // Get record to delete associated file
        const existing = await db.select().from(buku).where(eq(buku.id, id));
        await db.delete(buku).where(eq(buku.id, id));

        // Delete file if exists
        if (existing[0]?.gambar) {
            deleteFileIfExists(existing[0]?.gambar);
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE BULK
bukuRouter.post("/delete-bulk", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body as { ids: number[] };

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: "ID buku tidak valid atau kosong" });
            return;
        }

        // Fetch records to delete files
        const records = await db.select().from(buku).where(inArray(buku.id, ids));
        await db.delete(buku).where(inArray(buku.id, ids));

        // Delete associated files
        for (const record of records) {
            if (record.gambar) {
                deleteFileIfExists(record.gambar);
            }
        }

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