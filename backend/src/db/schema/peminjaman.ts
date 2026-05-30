import { mysqlTable, varchar, datetime, serial, bigint } from "drizzle-orm/mysql-core";
import { user } from "./auth";
import { buku } from "./buku";

export const peminjaman = mysqlTable("peminjaman", {
    id: serial("id").primaryKey(),
    bukuId: bigint("buku_id", { mode: "number", unsigned: true }).notNull().references(() => buku.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 }).notNull().references(() => user.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    status: varchar("status", { length: 255 }).default("pending").notNull(),
    tanggalPinjam: datetime("tanggal_pinjam", { mode: "date" }).notNull(),
    tanggalKembali: datetime("tanggal_kembali", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});
