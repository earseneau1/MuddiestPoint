import { 
  courses, 
  submissions, 
  magicLinks,
  anonymousSessions,
  classSessions,
  submissionRateLimits,
  userStories,
  userStoryUpvotes,
  users,
  type Course, 
  type InsertCourse,
  type Submission,
  type InsertSubmission,
  type MagicLink,
  type InsertMagicLink,
  type AnonymousSession,
  type InsertAnonymousSession,
  type ClassSession,
  type InsertClassSession,
  type SubmissionWithCourse,
  type ConfusionPattern,
  type UserStory,
  type InsertUserStory,
  type UserStoryUpvote,
  type InsertUserStoryUpvote,
  type UserStoryWithStats,
  type User,
  type UpsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Submissions
  getSubmissions(courseId?: string, limit?: number): Promise<SubmissionWithCourse[]>;
  getSubmission(id: string): Promise<SubmissionWithCourse | undefined>;
  createSubmission(submission: InsertSubmission, ipAddressHash: string): Promise<Submission>;
  // Rate Limiting for Anonymous Submissions
  checkRateLimit(sessionId: string, ipAddressHash: string): Promise<{ allowed: boolean; reason?: string }>;
  updateRateLimit(sessionId: string, ipAddressHash: string): Promise<void>;
  hashIPAddress(ipAddress: string): Promise<string>;

  // Class Sessions (Daily Links)
  getClassSessions(courseId: string): Promise<ClassSession[]>;
  getActiveClassSession(courseId: string, date?: Date): Promise<ClassSession | undefined>;
  createClassSession(session: InsertClassSession): Promise<ClassSession>;
  deactivateExpiredSessions(): Promise<void>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;

  // User Stories
  getUserStories(sessionToken: string): Promise<UserStoryWithStats[]>;
  getUserStory(id: string, sessionToken: string): Promise<UserStoryWithStats | undefined>;
  createUserStory(story: InsertUserStory): Promise<UserStory>;
  updateUserStory(id: string, updates: Partial<InsertUserStory>): Promise<UserStory | undefined>;
  deleteUserStory(id: string): Promise<boolean>;
  
  // User Story Upvotes
  upvoteUserStory(storyId: string, sessionToken: string): Promise<boolean>;
  removeUpvote(storyId: string, sessionToken: string): Promise<boolean>;
  
  // User Story Merge
  mergeUserStories(keepId: string, mergeId: string): Promise<UserStory | undefined>;

  // Users (for authentication)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Analytics
  getSubmissionStats(): Promise<{
    totalSubmissions: number;
    activeCourses: number;
    recentSubmissions: number;
  }>;
  getConfusionPatterns(days?: number): Promise<ConfusionPattern[]>;
}

export class DatabaseStorage implements IStorage {
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.name);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async getSubmissions(courseId?: string, limit = 50): Promise<SubmissionWithCourse[]> {
    const baseQuery = db
      .select({
        id: submissions.id,
        courseId: submissions.courseId,
        topic: submissions.topic,
        confusion: submissions.confusion,
        difficultyLevel: submissions.difficultyLevel,
        sessionId: submissions.sessionId,
        ipAddressHash: submissions.ipAddressHash,
        createdAt: submissions.createdAt,
        course: {
          id: courses.id,
          name: courses.name,
          code: courses.code,
          createdAt: courses.createdAt,
        },
      })
      .from(submissions)
      .leftJoin(courses, eq(submissions.courseId, courses.id));

    const results = await (courseId 
      ? baseQuery.where(eq(submissions.courseId, courseId)).orderBy(desc(submissions.createdAt)).limit(limit)
      : baseQuery.orderBy(desc(submissions.createdAt)).limit(limit));
    return results.map(r => ({
      ...r,
      course: r.course!,
    }));
  }

  async getSubmission(id: string): Promise<SubmissionWithCourse | undefined> {
    const [result] = await db
      .select({
        id: submissions.id,
        courseId: submissions.courseId,
        topic: submissions.topic,
        confusion: submissions.confusion,
        difficultyLevel: submissions.difficultyLevel,
        sessionId: submissions.sessionId,
        ipAddressHash: submissions.ipAddressHash,
        createdAt: submissions.createdAt,
        course: {
          id: courses.id,
          name: courses.name,
          code: courses.code,
          createdAt: courses.createdAt,
        },
      })
      .from(submissions)
      .leftJoin(courses, eq(submissions.courseId, courses.id))
      .where(eq(submissions.id, id));

    return result ? { ...result, course: result.course! } : undefined;
  }

  async createSubmission(insertSubmission: InsertSubmission, ipAddressHash: string): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values({
        ...insertSubmission,
        ipAddressHash,
      })
      .returning();
    return submission;
  }

  // Rate limiting functions for anonymous submissions
  async checkRateLimit(sessionId: string, ipAddressHash: string): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Check existing rate limit record
    const [rateLimit] = await db
      .select()
      .from(submissionRateLimits)
      .where(
        and(
          eq(submissionRateLimits.sessionId, sessionId),
          eq(submissionRateLimits.ipAddress, ipAddressHash)
        )
      );

    if (!rateLimit) {
      // No previous submissions, allowed
      return { allowed: true };
    }

    // Check if max submissions (3) reached for this session
    if (rateLimit.submissionCount >= 3) {
      return { allowed: false, reason: "Maximum of 3 submissions allowed per session" };
    }

    // Check if last submission was within 15 minutes
    if (rateLimit.lastSubmissionAt > fifteenMinutesAgo) {
      const minutesRemaining = Math.ceil((rateLimit.lastSubmissionAt.getTime() + 15 * 60 * 1000 - now.getTime()) / 60000);
      return { allowed: false, reason: `Please wait ${minutesRemaining} more minutes before submitting again` };
    }

    return { allowed: true };
  }

  async updateRateLimit(sessionId: string, ipAddressHash: string): Promise<void> {
    const now = new Date();

    // Try to update existing record
    const result = await db
      .update(submissionRateLimits)
      .set({
        submissionCount: sql`${submissionRateLimits.submissionCount} + 1`,
        lastSubmissionAt: now,
      })
      .where(
        and(
          eq(submissionRateLimits.sessionId, sessionId),
          eq(submissionRateLimits.ipAddress, ipAddressHash)
        )
      );

    // If no record existed, create one
    if (result.rowCount === 0) {
      await db
        .insert(submissionRateLimits)
        .values({
          sessionId,
          ipAddress: ipAddressHash,
          submissionCount: 1,
          lastSubmissionAt: now,
        });
    }
  }


  // Helper function to hash IP addresses for privacy
  async hashIPAddress(ipAddress: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(ipAddress + process.env.SESSION_SECRET).digest('hex');
  }


  async getSubmissionStats(): Promise<{
    totalSubmissions: number;
    activeCourses: number;
    recentSubmissions: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalResult] = await db
      .select({ count: count() })
      .from(submissions);

    const [activeCoursesResult] = await db
      .select({ count: count(sql`DISTINCT ${submissions.courseId}`) })
      .from(submissions);

    const [recentResult] = await db
      .select({ count: count() })
      .from(submissions)
      .where(gte(submissions.createdAt, sevenDaysAgo));

    return {
      totalSubmissions: totalResult.count,
      activeCourses: activeCoursesResult.count,
      recentSubmissions: recentResult.count,
    };
  }

  async getConfusionPatterns(days = 7): Promise<ConfusionPattern[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const results = await db
      .select({
        topic: submissions.topic,
        courseName: courses.name,
        courseCode: courses.code,
        difficultyLevel: submissions.difficultyLevel,
        count: count(),
      })
      .from(submissions)
      .leftJoin(courses, eq(submissions.courseId, courses.id))
      .where(gte(submissions.createdAt, daysAgo))
      .groupBy(submissions.topic, courses.name, courses.code, submissions.difficultyLevel)
      .orderBy(desc(count()));

    // Group by topic and course, aggregate difficulty levels
    const patternMap = new Map<string, ConfusionPattern>();

    results.forEach(result => {
      const key = `${result.topic}-${result.courseCode}`;
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          topic: result.topic,
          course: `${result.courseName} (${result.courseCode})`,
          count: 0,
          difficultyDistribution: { slightly: 0, very: 0, completely: 0 },
        });
      }

      const pattern = patternMap.get(key)!;
      pattern.count += result.count;
      pattern.difficultyDistribution[result.difficultyLevel] = result.count;
    });

    return Array.from(patternMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Class Sessions (Daily Links) Implementation
  async getClassSessions(courseId: string): Promise<ClassSession[]> {
    return await db
      .select()
      .from(classSessions)
      .where(eq(classSessions.courseId, courseId))
      .orderBy(desc(classSessions.sessionDate));
  }

  async getActiveClassSession(courseId: string, date?: Date): Promise<ClassSession | undefined> {
    const now = date || new Date();
    const [session] = await db
      .select()
      .from(classSessions)
      .where(
        and(
          eq(classSessions.courseId, courseId),
          eq(classSessions.isActive, true),
          gte(classSessions.expiresAt, now)
        )
      )
      .orderBy(desc(classSessions.sessionDate))
      .limit(1);
    return session || undefined;
  }

  async createClassSession(insertSession: InsertClassSession): Promise<ClassSession> {
    // Generate unique access token
    const accessToken = randomUUID().replace(/-/g, '').substring(0, 12);
    
    // Set expiration to end of day if not provided
    const sessionDate = new Date(insertSession.sessionDate);
    const expiresAt = insertSession.expiresAt || new Date(sessionDate);
    expiresAt.setHours(23, 59, 59, 999); // End of day

    const [session] = await db
      .insert(classSessions)
      .values({
        ...insertSession,
        accessToken,
        expiresAt,
      })
      .returning();
    return session;
  }

  async deactivateExpiredSessions(): Promise<void> {
    const now = new Date();
    await db
      .update(classSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(classSessions.isActive, true),
          sql`${classSessions.expiresAt} < ${now}`
        )
      );
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse || undefined;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db
      .delete(courses)
      .where(eq(courses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Stories Implementation
  async getUserStories(sessionToken: string): Promise<UserStoryWithStats[]> {
    const stories = await db
      .select({
        id: userStories.id,
        title: userStories.title,
        description: userStories.description,
        submittedBy: userStories.submittedBy,
        impact: userStories.impact,
        confidence: userStories.confidence,
        ease: userStories.ease,
        status: userStories.status,
        sessionToken: userStories.sessionToken,
        mergedIntoId: userStories.mergedIntoId,
        createdAt: userStories.createdAt,
        updatedAt: userStories.updatedAt,
      })
      .from(userStories)
      .where(sql`${userStories.mergedIntoId} IS NULL`)
      .orderBy(desc(userStories.createdAt));

    // Get upvote counts and check if current session has upvoted
    const storiesWithStats = await Promise.all(
      stories.map(async (story) => {
        const upvotes = await db
          .select({ count: count() })
          .from(userStoryUpvotes)
          .where(eq(userStoryUpvotes.userStoryId, story.id));

        const hasUpvoted = await db
          .select({ count: count() })
          .from(userStoryUpvotes)
          .where(
            and(
              eq(userStoryUpvotes.userStoryId, story.id),
              eq(userStoryUpvotes.sessionToken, sessionToken)
            )
          );

        return {
          ...story,
          upvoteCount: upvotes[0].count,
          hasUpvoted: hasUpvoted[0].count > 0,
          iceScore: story.impact + story.confidence + story.ease,
        };
      })
    );

    return storiesWithStats;
  }

  async getUserStory(id: string, sessionToken: string): Promise<UserStoryWithStats | undefined> {
    const [story] = await db
      .select()
      .from(userStories)
      .where(eq(userStories.id, id));

    if (!story) return undefined;

    const upvotes = await db
      .select({ count: count() })
      .from(userStoryUpvotes)
      .where(eq(userStoryUpvotes.userStoryId, story.id));

    const hasUpvoted = await db
      .select({ count: count() })
      .from(userStoryUpvotes)
      .where(
        and(
          eq(userStoryUpvotes.userStoryId, story.id),
          eq(userStoryUpvotes.sessionToken, sessionToken)
        )
      );

    return {
      ...story,
      upvoteCount: upvotes[0].count,
      hasUpvoted: hasUpvoted[0].count > 0,
      iceScore: story.impact + story.confidence + story.ease,
    };
  }

  async createUserStory(insertStory: InsertUserStory): Promise<UserStory> {
    const [story] = await db
      .insert(userStories)
      .values(insertStory)
      .returning();
    return story;
  }

  async updateUserStory(id: string, updates: Partial<InsertUserStory>): Promise<UserStory | undefined> {
    const [updatedStory] = await db
      .update(userStories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userStories.id, id))
      .returning();
    return updatedStory || undefined;
  }

  async deleteUserStory(id: string): Promise<boolean> {
    const result = await db
      .delete(userStories)
      .where(eq(userStories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async upvoteUserStory(storyId: string, sessionToken: string): Promise<boolean> {
    try {
      // Check if already upvoted
      const existing = await db
        .select()
        .from(userStoryUpvotes)
        .where(
          and(
            eq(userStoryUpvotes.userStoryId, storyId),
            eq(userStoryUpvotes.sessionToken, sessionToken)
          )
        );

      if (existing.length > 0) {
        return false; // Already upvoted
      }

      await db
        .insert(userStoryUpvotes)
        .values({
          userStoryId: storyId,
          sessionToken,
        });
      return true;
    } catch (error) {
      console.error("Error upvoting user story:", error);
      return false;
    }
  }

  async removeUpvote(storyId: string, sessionToken: string): Promise<boolean> {
    const result = await db
      .delete(userStoryUpvotes)
      .where(
        and(
          eq(userStoryUpvotes.userStoryId, storyId),
          eq(userStoryUpvotes.sessionToken, sessionToken)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async mergeUserStories(keepId: string, mergeId: string): Promise<UserStory | undefined> {
    try {
      // Transfer all upvotes from mergeId to keepId (avoiding duplicates)
      const mergeUpvotes = await db
        .select()
        .from(userStoryUpvotes)
        .where(eq(userStoryUpvotes.userStoryId, mergeId));

      const keepUpvotes = await db
        .select()
        .from(userStoryUpvotes)
        .where(eq(userStoryUpvotes.userStoryId, keepId));

      const keepSessionTokens = new Set(keepUpvotes.map(u => u.sessionToken));
      
      // Add unique upvotes to the keep story
      for (const upvote of mergeUpvotes) {
        if (!keepSessionTokens.has(upvote.sessionToken)) {
          await db
            .insert(userStoryUpvotes)
            .values({
              userStoryId: keepId,
              sessionToken: upvote.sessionToken,
            });
        }
      }

      // Mark the merged story as merged into the keep story
      const [mergedStory] = await db
        .update(userStories)
        .set({
          mergedIntoId: keepId,
          updatedAt: new Date(),
        })
        .where(eq(userStories.id, mergeId))
        .returning();

      // Return the updated keep story
      const [keepStory] = await db
        .select()
        .from(userStories)
        .where(eq(userStories.id, keepId));

      return keepStory;
    } catch (error) {
      console.error("Error merging user stories:", error);
      return undefined;
    }
  }

  // User operations for authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
