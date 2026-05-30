import { Request, Response } from "express";
import { db } from "../db";
import { user } from "../db/schema/auth";
import { eq, inArray, isNull, isNotNull, like, sql, or } from "drizzle-orm";
import { z } from "zod";

const QuerySchema = z.object({
    limit: z.coerce.number().default(10),
    offset: z.coerce.number().default(0),
    searchField: z.string().optional(),
    searchValue: z.string().optional(),
});

export const AdminUserController = {
    async getUserCount(_req: Request, res: Response) {
        try {
            // Count all non-deleted users
            const totalRes = await db.select({ count: sql<number>`count(*)` }).from(user).where(isNull(user.deletedAt));
            res.json({ success: true, count: Number(totalRes[0].count) });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },

    async listActiveUsers(req: Request, res: Response) {
        const query = QuerySchema.parse(req.query);
        
        let conditions = isNull(user.deletedAt);
        
        if (query.searchField === 'name' && query.searchValue) {
            conditions = sql`${conditions} AND ${user.name} LIKE ${"%" + query.searchValue + "%"}`;
        }

        const users = await db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        }).from(user).where(conditions).limit(query.limit).offset(query.offset);

        const totalRes = await db.select({ count: sql<number>`count(*)` }).from(user).where(conditions);

        res.json({ users, total: Number(totalRes[0].count) });
    },

    async listDeletedUsers(req: Request, res: Response) {
        const query = QuerySchema.parse(req.query);
        
        let conditions = isNotNull(user.deletedAt);
        
        if (query.searchField === 'name' && query.searchValue) {
            conditions = sql`${conditions} AND ${user.name} LIKE ${"%" + query.searchValue + "%"}`;
        }

        const users = await db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            deletedAt: user.deletedAt,
        }).from(user).where(conditions).limit(query.limit).offset(query.offset);

        const totalRes = await db.select({ count: sql<number>`count(*)` }).from(user).where(conditions);

        res.json({ users, total: Number(totalRes[0].count) });
    },

    async softDeleteUser(req: Request, res: Response) {
        const id = req.params.id as string;
        await db.update(user).set({ deletedAt: new Date() }).where(eq(user.id, id));
        res.json({ message: "User soft deleted" });
    },

    async bulkSoftDelete(req: Request, res: Response) {
        const ids = req.body.ids as string[];
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "Invalid ids array" });
        }
        await db.update(user).set({ deletedAt: new Date() }).where(inArray(user.id, ids));
        res.json({ message: "Users soft deleted" });
    },

    async restoreUser(req: Request, res: Response) {
        const id = req.params.id as string;
        await db.update(user).set({ deletedAt: null }).where(eq(user.id, id));
        res.json({ message: "User restored" });
    },

    async hardDeleteUser(req: Request, res: Response) {
        const id = req.params.id as string;
        await db.delete(user).where(eq(user.id, id));
        res.json({ message: "User hard deleted" });
    }
};
