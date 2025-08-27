import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const magicLinks = pgTable("magic_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
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
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  submissions: many(submissions),
}));

export const magicLinksRelations = relations(magicLinks, ({ many }) => ({
  submissions: many(submissions),
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
});

export const insertMagicLinkSchema = createInsertSchema(magicLinks).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

// Types
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type MagicLink = typeof magicLinks.$inferSelect;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;

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
