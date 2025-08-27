import { 
  courses, 
  submissions, 
  magicLinks,
  anonymousSessions,
  type Course, 
  type InsertCourse,
  type Submission,
  type InsertSubmission,
  type MagicLink,
  type InsertMagicLink,
  type AnonymousSession,
  type InsertAnonymousSession,
  type SubmissionWithCourse,
  type ConfusionPattern
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
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByMagicLink(magicLinkId: string): Promise<SubmissionWithCourse[]>;

  // Magic Links
  getMagicLink(token: string): Promise<MagicLink | undefined>;
  createMagicLink(magicLink: InsertMagicLink): Promise<MagicLink>;
  updateMagicLinkLastUsed(id: string): Promise<void>;

  // Anonymous Sessions (privacy-first)
  getAnonymousSession(token: string): Promise<AnonymousSession | undefined>;
  createAnonymousSession(session: InsertAnonymousSession): Promise<AnonymousSession>;
  updateAnonymousSessionLastUsed(id: string): Promise<void>;

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
        magicLinkId: submissions.magicLinkId,
        anonymousSessionId: submissions.anonymousSessionId,
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
        magicLinkId: submissions.magicLinkId,
        anonymousSessionId: submissions.anonymousSessionId,
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

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getSubmissionsByMagicLink(magicLinkId: string): Promise<SubmissionWithCourse[]> {
    const results = await db
      .select({
        id: submissions.id,
        courseId: submissions.courseId,
        topic: submissions.topic,
        confusion: submissions.confusion,
        difficultyLevel: submissions.difficultyLevel,
        magicLinkId: submissions.magicLinkId,
        anonymousSessionId: submissions.anonymousSessionId,
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
      .where(eq(submissions.magicLinkId, magicLinkId))
      .orderBy(desc(submissions.createdAt));

    return results.map(r => ({
      ...r,
      course: r.course!,
    }));
  }

  async getMagicLink(token: string): Promise<MagicLink | undefined> {
    const [magicLink] = await db.select().from(magicLinks).where(eq(magicLinks.token, token));
    return magicLink || undefined;
  }

  async createMagicLink(insertMagicLink: InsertMagicLink): Promise<MagicLink> {
    const [magicLink] = await db
      .insert(magicLinks)
      .values({
        ...insertMagicLink,
        token: randomUUID(),
      })
      .returning();
    return magicLink;
  }

  async updateMagicLinkLastUsed(id: string): Promise<void> {
    await db
      .update(magicLinks)
      .set({ lastUsedAt: new Date() })
      .where(eq(magicLinks.id, id));
  }

  async getAnonymousSession(token: string): Promise<AnonymousSession | undefined> {
    const [session] = await db.select().from(anonymousSessions).where(eq(anonymousSessions.anonymousToken, token));
    return session || undefined;
  }

  async createAnonymousSession(insertSession: InsertAnonymousSession): Promise<AnonymousSession> {
    const [session] = await db
      .insert(anonymousSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateAnonymousSessionLastUsed(id: string): Promise<void> {
    await db
      .update(anonymousSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(anonymousSessions.id, id));
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
}

export const storage = new DatabaseStorage();
