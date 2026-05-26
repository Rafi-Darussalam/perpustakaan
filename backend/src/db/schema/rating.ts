import { mysqlTable, int, varchar, datetime, bigint } from "drizzle-orm/mysql-core";
import { user } from "./auth";
import { buku } from "./buku";

export const rating = mysqlTable("rating", {
    id: int("id").primaryKey().autoincrement(),
    nilai: int("nilai").notNull(),
    bukuId: bigint("buku_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => buku.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
});
