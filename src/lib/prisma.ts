import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL variable is not defined");
}

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let prisma: PrismaClient;

if (!globalForPrisma.prisma) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

  try {
    const cleanedUrl = databaseUrl.split("?")[0];
    const match = cleanedUrl.match(/:\/\/([^:]+)(?::([^@]+))?@([^:\/]+)(?::(\d+))?\/([^\s]+)/);
    if (match) {
      const host = match[3];
      const port = match[4] || "5432";
      const database = match[5];
      console.log(`[PRISMA DB CONNECTION] Connected to Host: "${host}", Port: "${port}", Database: "${database}"`);
    } else {
      // Fallback parser using URL class
      const parsed = new URL(databaseUrl);
      console.log(`[PRISMA DB CONNECTION] Connected to Host: "${parsed.hostname}", Port: "${parsed.port || "5432"}", Database: "${parsed.pathname.replace(/^\//, "")}"`);
    }
  } catch (err: any) {
    console.log(`[PRISMA DB CONNECTION] Initialized client (Error parsing URL logs: ${err.message})`);
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} else {
  prisma = globalForPrisma.prisma;
}

export { prisma };
