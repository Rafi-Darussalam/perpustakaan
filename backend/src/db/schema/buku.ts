import { mysqlTable, varchar, float, int, datetime, serial, mediumtext } from "drizzle-orm/mysql-core";

export const buku = mysqlTable("buku", {
    id: serial("id").primaryKey(),
    judul: varchar("judul", { length: 255 }).notNull(),
    penulis: varchar("penulis", { length: 255 }).notNull(),
    kategori: varchar("kategori", { length: 255 }),
    status: varchar("status", { length: 255 }).notNull(),
    gambar: mediumtext("gambar"),
    ratingAverage: float("rating_average").default(0),
    ratingCount: int("rating_count").default(0),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});
