import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  json,
  index,
  boolean,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const fileTypeEnum = pgEnum("fileType", ["pdf", "docx", "txt", "md", "other"]);
export const sourceEnum = pgEnum("source", ["upload", "paste", "template", "sample"]);
export const statusEnum = pgEnum("status", ["active", "closed"]);
export const priorityEnum = pgEnum("priority", ["High", "Medium", "Low"]);
export const roleChatEnum = pgEnum("chat_role", ["user", "assistant"]);

/**
 * User table — synced from Firebase Auth on first API call.
 * The `id` column stores the Firebase UID (text PK).
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignInAt: timestamp("lastSignInAt").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * A contract stored in the user's secure vault.
 */
export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 512 }).notNull(),
    /** Extracted plain text of the contract (multi-page safe). */
    content: text("content").notNull(),
    /** Detected source file format. */
    fileType: fileTypeEnum("fileType")
      .default("other")
      .notNull(),
    /** How the document entered the vault. */
    source: sourceEnum("source")
      .default("paste")
      .notNull(),
    /** Size of the original uploaded binary in bytes (0 for pasted text). */
    fileSizeBytes: integer("fileSizeBytes").default(0).notNull(),
    /** Page count reported by the extraction engine (PDF only). */
    pageCount: integer("pageCount"),
    /** Object-storage key of the original uploaded file (null when not persisted). */
    storageKey: varchar("storageKey", { length: 512 }),
    /** 0-100 safety score from the latest analysis (null = not analyzed yet) */
    score: integer("score"),
    riskLevel: varchar("riskLevel", { length: 32 }),
    /** Full structured analysis report (AnalysisReport JSON) of the latest run. */
    report: json("report"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("documents_user_idx").on(table.userId),
  }),
);

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Immutable history of AI risk-analysis runs.
 */
export const analyses = pgTable(
  "analyses",
  {
    id: serial("id").primaryKey(),
    documentId: integer("documentId")
      .notNull()
      .references(() => documents.id),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    /** LLM model id that produced this report. */
    model: varchar("model", { length: 255 }),
    score: integer("score").notNull(),
    riskLevel: varchar("riskLevel", { length: 32 }).notNull(),
    /** Full structured AnalysisReport JSON. */
    report: json("report").notNull(),
    /** Number of risks flagged in this run (denormalized for cheap listings). */
    riskCount: integer("riskCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index("analyses_document_idx").on(table.documentId),
    userIdx: index("analyses_user_idx").on(table.userId),
  }),
);

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Active contract workspace session per user.
 */
export const contractSessions = pgTable(
  "contract_sessions",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    /** Document currently open in the analyzer (null = ad-hoc pasted text). */
    documentId: integer("documentId").references(
      () => documents.id,
    ),
    /** Title snapshot, kept even if the document is later deleted. */
    title: varchar("title", { length: 512 }).notNull(),
    /** Last active workspace view (dashboard/analyzer/vault/chat/...). */
    activeView: varchar("activeView", { length: 32 }).default("analyzer").notNull(),
    status: statusEnum("status").default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userStatusIdx: index("contract_sessions_user_status_idx").on(table.userId, table.status),
  }),
);

export type ContractSession = typeof contractSessions.$inferSelect;
export type InsertContractSession = typeof contractSessions.$inferInsert;

/**
 * Attorney handoff escalations raised from the analyzer.
 */
export const escalations = pgTable(
  "escalations",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    documentId: integer("documentId").references(
      () => documents.id,
    ),
    contractName: varchar("contractName", { length: 512 }).notNull(),
    reason: text("reason").notNull(),
    priority: priorityEnum("priority").default("Medium").notNull(),
    status: varchar("status", { length: 128 }).default("Awaiting attorney").notNull(),
    /** Static attorney-directory id (see src/constants.ts VETTED_ATTORNEYS). */
    attorneyId: varchar("attorneyId", { length: 64 }),
    attorneyName: varchar("attorneyName", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("escalations_user_idx").on(table.userId),
  }),
);

export type Escalation = typeof escalations.$inferSelect;
export type InsertEscalation = typeof escalations.$inferInsert;

/** Persistent LegalLens AI chat history, per user. */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
    role: roleChatEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("chat_messages_user_idx").on(table.userId),
  }),
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
