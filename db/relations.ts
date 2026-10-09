import { relations } from "drizzle-orm";
import {
  users,
  documents,
  analyses,
  contractSessions,
  escalations,
  chatMessages,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  analyses: many(analyses),
  contractSessions: many(contractSessions),
  escalations: many(escalations),
  chatMessages: many(chatMessages),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  owner: one(users, { fields: [documents.userId], references: [users.id] }),
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  document: one(documents, { fields: [analyses.documentId], references: [documents.id] }),
  owner: one(users, { fields: [analyses.userId], references: [users.id] }),
}));

export const contractSessionsRelations = relations(contractSessions, ({ one }) => ({
  owner: one(users, { fields: [contractSessions.userId], references: [users.id] }),
  document: one(documents, {
    fields: [contractSessions.documentId],
    references: [documents.id],
  }),
}));

export const escalationsRelations = relations(escalations, ({ one }) => ({
  owner: one(users, { fields: [escalations.userId], references: [users.id] }),
  document: one(documents, { fields: [escalations.documentId], references: [documents.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  owner: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));
