import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../env";
import * as schema from "./schema";

const pool = mysql.createPool(env.DATABASE_URL);
export const db = drizzle(pool, { schema, mode: "default" });
