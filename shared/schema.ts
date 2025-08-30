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

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  sessionId: varchar("session_id").notNull().references(() => classSessions.id),
  topic: text("topic").notNull(),
  confusion: text("confusion").notNull(),
  difficultyLevel: text("difficulty_level").notNull(), // 'slightly', 'very', 'completely'
  ipAddressHash: varchar("ip_address_hash").notNull(), // Hashed IP for rate limiting
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

// Rate limiting for anonymous submissions
export const submissionRateLimits = pgTable("submission_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => classSessions.id),
  ipAddress: varchar("ip_address").notNull(), // Hashed for privacy
  submissionCount: integer("submission_count").notNull().default(0),
  lastSubmissionAt: timestamp("last_submission_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rate_limit_session_ip").on(table.sessionId, table.ipAddress),
]);

export const submissionsRelations = relations(submissions, ({ one }) => ({
  course: one(courses, {
    fields: [submissions.courseId],
    references: [courses.id],
  }),
  session: one(classSessions, {
    fields: [submissions.sessionId],
    references: [classSessions.id],
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

export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  course: one(courses, {
    fields: [classSessions.courseId],
    references: [courses.id],
  }),
  submissions: many(submissions),
  rateLimits: many(submissionRateLimits),
}));

export const submissionRateLimitsRelations = relations(submissionRateLimits, ({ one }) => ({
  session: one(classSessions, {
    fields: [submissionRateLimits.sessionId],
    references: [classSessions.id],
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
  ipAddressHash: true, // Generated on server
}).extend({
  difficultyLevel: z.enum(['slightly', 'very', 'completely']),
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

export const insertSubmissionRateLimitSchema = createInsertSchema(submissionRateLimits).omit({
  id: true,
  createdAt: true,
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
export type SubmissionRateLimit = typeof submissionRateLimits.$inferSelect;
export type InsertSubmissionRateLimit = z.infer<typeof insertSubmissionRateLimitSchema>;

// User Stories for feature management
export const userStories = pgTable("user_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  submittedBy: text("submitted_by"), // Optional name
  impact: integer("impact").notNull(), // 1-10 scale
  confidence: integer("confidence").notNull(), // 1-10 scale  
  ease: integer("ease").notNull(), // 1-10 scale
  status: text("status").notNull().default('submitted'), // submitted, in_review, accepted, in_progress, on_hold, done
  sessionToken: text("session_token").notNull(), // Track who submitted
  mergedIntoId: varchar("merged_into_id"), // For tracking merges
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userStoryUpvotes = pgTable("user_story_upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userStoryId: varchar("user_story_id").notNull().references(() => userStories.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull(), // Track unique votes
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_upvotes_story").on(table.userStoryId),
  index("idx_upvotes_session").on(table.sessionToken),
]);

// Relations for user stories
export const userStoriesRelations = relations(userStories, ({ many, one }) => ({
  upvotes: many(userStoryUpvotes),
  mergedInto: one(userStories, {
    fields: [userStories.mergedIntoId],
    references: [userStories.id],
  }),
}));

export const userStoryUpvotesRelations = relations(userStoryUpvotes, ({ one }) => ({
  userStory: one(userStories, {
    fields: [userStoryUpvotes.userStoryId],
    references: [userStories.id],
  }),
}));

// Insert schemas for user stories
export const insertUserStorySchema = createInsertSchema(userStories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  mergedIntoId: true,
  sessionToken: true, // Handled by backend from headers
}).extend({
  impact: z.number().min(1).max(10),
  confidence: z.number().min(1).max(10),
  ease: z.number().min(1).max(10),
  status: z.enum(['submitted', 'in_review', 'accepted', 'in_progress', 'on_hold', 'done']).optional(),
});

export const insertUserStoryUpvoteSchema = createInsertSchema(userStoryUpvotes).omit({
  id: true,
  createdAt: true,
});

// Types for user stories
export type UserStory = typeof userStories.$inferSelect;
export type InsertUserStory = z.infer<typeof insertUserStorySchema>;
export type UserStoryUpvote = typeof userStoryUpvotes.$inferSelect;
export type InsertUserStoryUpvote = z.infer<typeof insertUserStoryUpvoteSchema>;

// Extended types for frontend
export type UserStoryWithStats = UserStory & {
  upvoteCount: number;
  hasUpvoted: boolean;
  iceScore: number; // Sum of impact + confidence + ease
};

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

// User types for authentication
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
