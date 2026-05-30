import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../db/index";
import { peminjaman } from "../db/schema/peminjaman";
import { buku } from "../db/schema/buku";
import { user } from "../db/schema/auth";
import { requireAdmin } from "../middleware/admin";
import { eq, and, sql, desc, or, like } from "drizzle-orm";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

const peminjamanRouter = Router();

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

// CREATE BORROW REQUEST (USER)
peminjamanRouter.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { bukuId, tanggalPinjam, tanggalKembali, currentUser } = req.body;

        if (!bukuId || !tanggalPinjam || !tanggalKembali) {
            res.status(400).json({ error: "Buku ID, tanggal pinjam, dan tanggal kembali wajib diisi" });
            return;
        }

        // Check if book exists and is available
        const existBuku = await db.select().from(buku).where(eq(buku.id, Number(bukuId)));
        if (existBuku.length === 0) {
            res.status(404).json({ error: "Buku tidak ditemukan" });
            return;
        }

        if (existBuku[0].status.toLowerCase() !== "tersedia") {
            res.status(400).json({ error: "Buku sedang tidak tersedia untuk dipinjam" });
            return;
        }

        // Generate unique token
        const token = `PJM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        await db.insert(peminjaman).values({
            bukuId: Number(bukuId),
            userId: currentUser.id,
            token,
            status: "pending",
            tanggalPinjam: new Date(tanggalPinjam),
            tanggalKembali: new Date(tanggalKembali),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: "Permintaan peminjaman berhasil dikirim",
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET OWN BORROWS (USER)
peminjamanRouter.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentUser } = req.body;

        const results = await db.select({
            id: peminjaman.id,
            token: peminjaman.token,
            status: peminjaman.status,
            tanggalPinjam: peminjaman.tanggalPinjam,
            tanggalKembali: peminjaman.tanggalKembali,
            createdAt: peminjaman.createdAt,
            buku: {
                id: buku.id,
                judul: buku.judul,
                penulis: buku.penulis,
                gambar: buku.gambar
            }
        })
        .from(peminjaman)
        .innerJoin(buku, eq(peminjaman.bukuId, buku.id))
        .where(eq(peminjaman.userId, currentUser.id))
        .orderBy(desc(peminjaman.createdAt));

        res.json({ success: true, data: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// CANCEL OWN BORROW REQUEST (USER)
peminjamanRouter.put("/:id/cancel", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        const { currentUser } = req.body;

        if (isNaN(id)) {
            res.status(400).json({ error: "ID tidak valid" });
            return;
        }

        const existPjm = await db.select().from(peminjaman).where(
            and(
                eq(peminjaman.id, id),
                eq(peminjaman.userId, currentUser.id)
            )
        );

        if (existPjm.length === 0) {
            res.status(404).json({ error: "Peminjaman tidak ditemukan atau Anda tidak memiliki akses" });
            return;
        }

        if (existPjm[0].status !== "pending") {
            res.status(400).json({ error: "Hanya peminjaman dengan status menunggu yang dapat dibatalkan" });
            return;
        }

        await db.update(peminjaman).set({
            status: "dibatalkan",
            updatedAt: new Date()
        }).where(eq(peminjaman.id, id));

        res.json({ success: true, message: "Peminjaman berhasil dibatalkan" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE SINGLE BORROW (USER - only dibatalkan / dikembalikan / ditolak)
peminjamanRouter.delete("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        const { currentUser } = req.body;

        if (isNaN(id)) {
            res.status(400).json({ error: "ID tidak valid" });
            return;
        }

        const existPjm = await db.select().from(peminjaman).where(
            and(
                eq(peminjaman.id, id),
                eq(peminjaman.userId, currentUser.id)
            )
        );

        if (existPjm.length === 0) {
            res.status(404).json({ error: "Peminjaman tidak ditemukan atau Anda tidak memiliki akses" });
            return;
        }

        const allowedStatuses = ["dibatalkan", "dikembalikan", "ditolak"];
        if (!allowedStatuses.includes(existPjm[0].status)) {
            res.status(400).json({ error: "Hanya peminjaman dengan status dibatalkan, dikembalikan, atau ditolak yang dapat dihapus" });
            return;
        }

        await db.delete(peminjaman).where(eq(peminjaman.id, id));
        res.json({ success: true, message: "Peminjaman berhasil dihapus" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// BULK DELETE BORROWS (USER)
peminjamanRouter.delete("/bulk", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids, currentUser } = req.body as { ids: number[]; currentUser: any };

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: "IDs harus berupa array yang tidak kosong" });
            return;
        }

        // Only delete ones belonging to user AND with allowed status
        const allowedStatuses = ["dibatalkan", "dikembalikan", "ditolak"];
        const existPjms = await db.select().from(peminjaman).where(
            and(
                eq(peminjaman.userId, currentUser.id),
                or(
                    eq(peminjaman.status, "dibatalkan"),
                    eq(peminjaman.status, "dikembalikan"),
                    eq(peminjaman.status, "ditolak")
                )
            )
        );

        const deletableIds = existPjms
            .filter(p => ids.includes(p.id) && allowedStatuses.includes(p.status))
            .map(p => p.id);

        if (deletableIds.length === 0) {
            res.status(400).json({ error: "Tidak ada data yang dapat dihapus" });
            return;
        }

        for (const id of deletableIds) {
            await db.delete(peminjaman).where(eq(peminjaman.id, id));
        }

        res.json({ success: true, message: `${deletableIds.length} peminjaman berhasil dihapus` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET ALL BORROWS (ADMIN)
peminjamanRouter.get("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const search = (req.query.search as string) || "";
        const status = (req.query.status as string) || "";
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const filters = [];
        if (status) {
            filters.push(eq(peminjaman.status, status));
        }

        if (search) {
            filters.push(
                or(
                    like(buku.judul, `%${search}%`),
                    like(user.name, `%${search}%`),
                    like(peminjaman.token, `%${search}%`)
                )
            );
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        const results = await db.select({
            id: peminjaman.id,
            token: peminjaman.token,
            status: peminjaman.status,
            tanggalPinjam: peminjaman.tanggalPinjam,
            tanggalKembali: peminjaman.tanggalKembali,
            createdAt: peminjaman.createdAt,
            buku: {
                id: buku.id,
                judul: buku.judul,
                penulis: buku.penulis,
                gambar: buku.gambar
            },
            anggota: {
                id: user.id,
                nama: user.name,
                email: user.email
            }
        })
        .from(peminjaman)
        .innerJoin(buku, eq(peminjaman.bukuId, buku.id))
        .innerJoin(user, eq(peminjaman.userId, user.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(peminjaman.createdAt));

        // Get count
        const countQuery = await db.select({ count: sql<number>`count(*)` })
            .from(peminjaman)
            .innerJoin(buku, eq(peminjaman.bukuId, buku.id))
            .innerJoin(user, eq(peminjaman.userId, user.id))
            .where(whereClause);
        
        const count = Number(countQuery[0]?.count ?? 0);

        res.json({
            status: "success",
            data: results,
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

// UPDATE BORROW STATUS (ADMIN - ACCEPT/REJECT)
peminjamanRouter.put("/:id/status", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        const { status } = req.body as { status: string };

        if (isNaN(id) || !["disetujui", "ditolak", "dikembalikan"].includes(status)) {
            res.status(400).json({ error: "ID tidak valid atau status tidak didukung" });
            return;
        }

        const existPjm = await db.select().from(peminjaman).where(eq(peminjaman.id, id));
        if (existPjm.length === 0) {
            res.status(404).json({ error: "Peminjaman tidak ditemukan" });
            return;
        }

        const currentPjm = existPjm[0];

        // Update peminjaman status
        await db.update(peminjaman).set({
            status,
            updatedAt: new Date()
        }).where(eq(peminjaman.id, id));

        // If approved, update book status to "dipinjam"
        if (status === "disetujui") {
            await db.update(buku).set({
                status: "dipinjam",
                updatedAt: new Date()
            }).where(eq(buku.id, currentPjm.bukuId));
        } else if (status === "dikembalikan" || status === "ditolak") {
            // If returned or rejected, restore book status to "tersedia"
            await db.update(buku).set({
                status: "tersedia",
                updatedAt: new Date()
            }).where(eq(buku.id, currentPjm.bukuId));
        }

        res.json({ success: true, message: `Status peminjaman diperbarui menjadi ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET BORROW OVERDUE & STATS
peminjamanRouter.get("/stats", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
    try {
        const totalPjm = await db.select({ count: sql<number>`count(*)` }).from(peminjaman);
        const pendingPjm = await db.select({ count: sql<number>`count(*)` }).from(peminjaman).where(eq(peminjaman.status, "pending"));
        const approvedPjm = await db.select({ count: sql<number>`count(*)` }).from(peminjaman).where(eq(peminjaman.status, "disetujui"));
        
        // Simple logic to count overdue: disetujui and tanggalKembali < now
        const overduePjm = await db.select({ count: sql<number>`count(*)` })
            .from(peminjaman)
            .where(
                and(
                    eq(peminjaman.status, "disetujui"),
                    sql`${peminjaman.tanggalKembali} < ${new Date()}`
                )
            );

        res.json({
            success: true,
            total: Number(totalPjm[0]?.count ?? 0),
            pending: Number(pendingPjm[0]?.count ?? 0),
            approved: Number(approvedPjm[0]?.count ?? 0),
            totalDipinjam: Number(approvedPjm[0]?.count ?? 0), // maps with frontend Home Card stats
            totalTerlambat: Number(overduePjm[0]?.count ?? 0)  // maps with frontend Home Card stats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET GLOBAL OVERDUE LIST FOR ALERTS
peminjamanRouter.get("/overdue", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
    try {
        const results = await db.select({
            id: peminjaman.id,
            buku: { judul: buku.judul },
            anggota: { nama: user.name }
        })
        .from(peminjaman)
        .innerJoin(buku, eq(peminjaman.bukuId, buku.id))
        .innerJoin(user, eq(peminjaman.userId, user.id))
        .where(
            and(
                eq(peminjaman.status, "disetujui"),
                sql`${peminjaman.tanggalKembali} < ${new Date()}`
            )
        );

        res.json({ success: true, data: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET USER'S OWN OVERDUE BORROWS
peminjamanRouter.get("/my-overdue", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentUser } = req.body;

        const results = await db.select({
            id: peminjaman.id,
            token: peminjaman.token,
            tanggalKembali: peminjaman.tanggalKembali,
            buku: { judul: buku.judul, penulis: buku.penulis }
        })
        .from(peminjaman)
        .innerJoin(buku, eq(peminjaman.bukuId, buku.id))
        .where(
            and(
                eq(peminjaman.userId, currentUser.id),
                eq(peminjaman.status, "disetujui"),
                sql`${peminjaman.tanggalKembali} < ${new Date()}`
            )
        );

        res.json({ success: true, data: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET CHART DATA (ADMIN)
peminjamanRouter.get("/chart", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        
        // Build map with last 'days' dates initialized to 0
        const map = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            // Format YYYY-MM-DD local time to match database
            const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            map.set(localDate, 0);
        }

        const minDateStr = Array.from(map.keys()).sort()[0];

        // Fetch peminjaman from minDateStr onwards
        const allPjm = await db.select({
            tanggalPinjam: peminjaman.tanggalPinjam
        })
        .from(peminjaman)
        .where(sql`${peminjaman.tanggalPinjam} >= ${minDateStr}`);

        for (const p of allPjm) {
            let dateStr = "";
            if (p.tanggalPinjam instanceof Date) {
                dateStr = new Date(p.tanggalPinjam.getTime() - (p.tanggalPinjam.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            } else {
                dateStr = String(p.tanggalPinjam).split('T')[0];
            }

            if (map.has(dateStr)) {
                map.set(dateStr, map.get(dateStr)! + 1);
            }
        }

        const data = Array.from(map.entries())
            .map(([date, count]) => ({ date, peminjaman: count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE SINGLE BORROW (ADMIN)
peminjamanRouter.delete("/admin/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "ID tidak valid" });
            return;
        }

        const existPjm = await db.select().from(peminjaman).where(eq(peminjaman.id, id));
        if (existPjm.length === 0) {
            res.status(404).json({ error: "Peminjaman tidak ditemukan" });
            return;
        }

        const allowedStatuses = ["dikembalikan", "ditolak", "dibatalkan"];
        if (!allowedStatuses.includes(existPjm[0].status)) {
            res.status(400).json({ error: "Hanya peminjaman dengan status dikembalikan, dibatalkan, atau ditolak yang dapat dihapus" });
            return;
        }

        await db.delete(peminjaman).where(eq(peminjaman.id, id));
        res.json({ success: true, message: "Peminjaman berhasil dihapus" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// BULK DELETE BORROWS (ADMIN)
peminjamanRouter.post("/admin/bulk-delete", requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body as { ids: number[] };
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: "IDs harus berupa array yang tidak kosong" });
            return;
        }

        const existPjms = await db.select().from(peminjaman).where(
            or(
                eq(peminjaman.status, "dikembalikan"),
                eq(peminjaman.status, "ditolak"),
                eq(peminjaman.status, "dibatalkan")
            )
        );

        const deletableIds = existPjms
            .filter(p => ids.includes(p.id))
            .map(p => p.id);

        if (deletableIds.length === 0) {
            res.status(400).json({ error: "Tidak ada data yang dapat dihapus (pastikan status dikembalikan/ditolak)" });
            return;
        }

        for (const id of deletableIds) {
            await db.delete(peminjaman).where(eq(peminjaman.id, id));
        }

        res.json({ success: true, message: `${deletableIds.length} peminjaman berhasil dihapus` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET CHART DATA FOR CURRENT USER
peminjamanRouter.get("/my-chart", requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentUser } = req.body;
        const days = parseInt(req.query.days as string) || 30;

        // Build map with last 'days' dates initialized to 0
        const map = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            map.set(localDate, 0);
        }

        const minDateStr = Array.from(map.keys()).sort()[0];

        const allPjm = await db.select({
            tanggalPinjam: peminjaman.tanggalPinjam
        })
        .from(peminjaman)
        .where(
            and(
                eq(peminjaman.userId, currentUser.id),
                sql`${peminjaman.tanggalPinjam} >= ${minDateStr}`
            )
        );

        for (const p of allPjm) {
            let dateStr = "";
            if (p.tanggalPinjam instanceof Date) {
                dateStr = new Date(p.tanggalPinjam.getTime() - (p.tanggalPinjam.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            } else {
                dateStr = String(p.tanggalPinjam).split('T')[0];
            }
            if (map.has(dateStr)) {
                map.set(dateStr, map.get(dateStr)! + 1);
            }
        }

        const data = Array.from(map.entries())
            .map(([date, count]) => ({ date, peminjaman: count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export { peminjamanRouter };
