import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, admin } from "better-auth/plugins";
import { db } from "../db/index";
import { env } from "../env";

const authProvider: "pg" | "mysql" = env.DATABASE_URL.startsWith("mysql")
    ? "mysql"
    : "pg";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: authProvider,
    }),
    basePath: "/api/auth",
    emailAndPassword: { enabled: true },
    plugins: [openAPI(), admin()],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"]
});
