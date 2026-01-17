import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, automationSessions, createdAccounts, automationLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createSession(userId: number, targetCount: number, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(automationSessions).values({
    userId,
    targetCount,
    completedCount: 0,
    failedCount: 0,
    password,
    status: "idle",
  });
  
  return result;
}

export async function getSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(automationSessions).where(eq(automationSessions.id, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSessionStatus(sessionId: number, status: "idle" | "running" | "paused" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(automationSessions).set({ status }).where(eq(automationSessions.id, sessionId));
}

export async function addLog(sessionId: number, message: string, level: "info" | "success" | "warning" | "error" = "info") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(automationLogs).values({ sessionId, message, level });
}

export async function addCreatedAccount(sessionId: number, email: string, password: string, firstName: string, lastName: string, status: "success" | "failed", errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(createdAccounts).values({ sessionId, email, password, firstName, lastName, status, errorMessage });
}

export async function getSessionLogs(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(automationLogs).where(eq(automationLogs.sessionId, sessionId));
}

export async function getSessionAccounts(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(createdAccounts).where(eq(createdAccounts.sessionId, sessionId));
}
