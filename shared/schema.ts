import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Anonymous session tracking (privacy-first)
export const anonymousSessions = pgTable("anonymous_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anonymousToken: text("anonymous_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  topic: text("topic").notNull(),
  confusion: text("confusion").notNull(),
  difficultyLevel: text("difficulty_level").notNull(), // 'slightly', 'very', 'completely'
  magicLinkId: varchar("magic_link_id").references(() => magicLinks.id),
  anonymousSessionId: varchar("anonymous_session_id").references(() => anonymousSessions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const magicLinks = pgTable("magic_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

// Daily class sessions with expiring links
export const classSessions = pgTable("class_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  sessionDate: timestamp("session_date").notNull(), // Date of the class
  accessToken: text("access_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(), // End of day expiration
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submissionsRelations = relations(submissions, ({ one }) => ({
  course: one(courses, {
    fields: [submissions.courseId],
    references: [courses.id],
  }),
  magicLink: one(magicLinks, {
    fields: [submissions.magicLinkId],
    references: [magicLinks.id],
  }),
  anonymousSession: one(anonymousSessions, {
    fields: [submissions.anonymousSessionId],
    references: [anonymousSessions.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  submissions: many(submissions),
  classSessions: many(classSessions),
}));

export const magicLinksRelations = relations(magicLinks, ({ many }) => ({
  submissions: many(submissions),
}));

export const anonymousSessionsRelations = relations(anonymousSessions, ({ many }) => ({
  submissions: many(submissions),
}));

export const classSessionsRelations = relations(classSessions, ({ one }) => ({
  course: one(courses, {
    fields: [classSessions.courseId],
    references: [courses.id],
  }),
}));

// Insert schemas
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
}).extend({
  difficultyLevel: z.enum(['slightly', 'very', 'completely']),
}).partial({
  anonymousSessionId: true,
});

export const insertMagicLinkSchema = createInsertSchema(magicLinks).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export const insertAnonymousSessionSchema = createInsertSchema(anonymousSessions).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export const insertClassSessionSchema = createInsertSchema(classSessions).omit({
  id: true,
  createdAt: true,
  accessToken: true,
});

// Types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type MagicLink = typeof magicLinks.$inferSelect;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;
export type AnonymousSession = typeof anonymousSessions.$inferSelect;
export type InsertAnonymousSession = z.infer<typeof insertAnonymousSessionSchema>;
export type ClassSession = typeof classSessions.$inferSelect;
export type InsertClassSession = z.infer<typeof insertClassSessionSchema>;

// Extended types for frontend
export type SubmissionWithCourse = Submission & {
  course: Course;
  magicLink?: MagicLink;
};

export type ConfusionPattern = {
  topic: string;
  course: string;
  count: number;
  difficultyDistribution: Record<string, number>;
};
