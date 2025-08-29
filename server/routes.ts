import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCourseSchema, insertSubmissionSchema, insertMagicLinkSchema, insertClassSessionSchema, insertUserStorySchema } from "@shared/schema";
import { generateFeedbackSuggestions, improveFeedbackText } from "./openai";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Courses
  app.get("/api/courses", async (req, res) => {
    try {
      const { code } = req.query;
      const courses = await storage.getCourses();
      
      // Filter by course code if provided
      if (code && typeof code === 'string') {
        const filteredCourses = courses.filter(course => 
          course.code.toLowerCase() === code.toLowerCase()
        );
        res.json(filteredCourses);
      } else {
        res.json(courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const data = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(data);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create course" });
      }
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, data);
      if (course) {
        res.json(course);
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update course" });
      }
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCourse(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Course not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Submissions
  app.get("/api/submissions", async (req, res) => {
    try {
      const courseId = req.query.courseId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const submissions = await storage.getSubmissions(courseId, limit);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const data = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(data);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create submission" });
      }
    }
  });

  // Magic Links
  app.post("/api/magic-links", async (req, res) => {
    try {
      const data = insertMagicLinkSchema.parse(req.body);
      const magicLink = await storage.createMagicLink(data);
      
      // In a real app, you would send an email with the magic link here
      // For now, we'll just return the token
      const magicUrl = `${req.protocol}://${req.get('host')}/track/${magicLink.token}`;
      
      res.status(201).json({ 
        id: magicLink.id,
        magicUrl,
        message: "Magic link created successfully" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create magic link" });
      }
    }
  });

  app.get("/api/magic-links/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const magicLink = await storage.getMagicLink(token);
      
      if (!magicLink) {
        res.status(404).json({ error: "Magic link not found" });
        return;
      }

      await storage.updateMagicLinkLastUsed(magicLink.id);
      const submissions = await storage.getSubmissionsByMagicLink(magicLink.id);
      
      res.json({
        magicLink,
        submissions,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch magic link data" });
    }
  });

  // Class Sessions (Daily Links)
  app.get("/api/courses/:courseId/sessions", async (req, res) => {
    try {
      const { courseId } = req.params;
      const sessions = await storage.getClassSessions(courseId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch class sessions" });
    }
  });

  app.get("/api/courses/:courseId/active-session", async (req, res) => {
    try {
      const { courseId } = req.params;
      const session = await storage.getActiveClassSession(courseId);
      res.json(session || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  app.post("/api/courses/:courseId/sessions", async (req, res) => {
    try {
      const { courseId } = req.params;
      const sessionDate = new Date();
      
      // Check if there's already an active session for today
      const existingSession = await storage.getActiveClassSession(courseId, sessionDate);
      if (existingSession) {
        res.json(existingSession);
        return;
      }

      const sessionData = insertClassSessionSchema.parse({
        courseId,
        sessionDate,
        isActive: true,
        expiresAt: new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate(), 23, 59, 59)
      });
      
      const session = await storage.createClassSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create class session" });
      }
    }
  });

  // Public route for students to access via session token
  app.get("/class/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Deactivate expired sessions first
      await storage.deactivateExpiredSessions();
      
      // Find active session by token
      const sessions = await storage.getClassSessions("");
      const session = sessions.find(s => s.accessToken === token && s.isActive && s.expiresAt > new Date());
      
      if (!session) {
        res.status(404).json({ error: "Session not found or expired" });
        return;
      }

      const course = await storage.getCourse(session.courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // Redirect to class session page with course pre-selected
      res.redirect(`/class-session?courseId=${course.id}`);
    } catch (error) {
      res.status(500).json({ error: "Failed to access class session" });
    }
  });

  // Analytics
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getSubmissionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/analytics/confusion-patterns", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const patterns = await storage.getConfusionPatterns(days);
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch confusion patterns" });
    }
  });

  // AI-powered feedback assistance
  app.post("/api/ai/feedback-suggestions", async (req, res) => {
    try {
      const { topic, confusionLevel } = req.body;
      
      if (!topic || !confusionLevel) {
        res.status(400).json({ error: "Topic and confusion level are required" });
        return;
      }

      const suggestions = await generateFeedbackSuggestions(topic, confusionLevel);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  app.post("/api/ai/improve-feedback", async (req, res) => {
    try {
      const { text, topic } = req.body;
      
      if (!text || !topic) {
        res.status(400).json({ error: "Text and topic are required" });
        return;
      }

      const improvedText = await improveFeedbackText(text, topic);
      res.json({ improvedText });
    } catch (error) {
      console.error("Error improving feedback:", error);
      res.status(500).json({ error: "Failed to improve feedback" });
    }
  });

  // User Stories
  app.get("/api/user-stories", async (req, res) => {
    try {
      // Get or create session token
      let sessionToken = req.headers['x-session-token'] as string;
      if (!sessionToken) {
        sessionToken = randomUUID();
      }
      
      const stories = await storage.getUserStories(sessionToken);
      res.json({ stories, sessionToken });
    } catch (error) {
      console.error("Error fetching user stories:", error);
      res.status(500).json({ error: "Failed to fetch user stories" });
    }
  });

  app.get("/api/user-stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let sessionToken = req.headers['x-session-token'] as string;
      if (!sessionToken) {
        sessionToken = randomUUID();
      }
      
      const story = await storage.getUserStory(id, sessionToken);
      if (story) {
        res.json(story);
      } else {
        res.status(404).json({ error: "User story not found" });
      }
    } catch (error) {
      console.error("Error fetching user story:", error);
      res.status(500).json({ error: "Failed to fetch user story" });
    }
  });

  app.post("/api/user-stories", async (req, res) => {
    try {
      let sessionToken = req.headers['x-session-token'] as string;
      if (!sessionToken) {
        res.status(401).json({ error: "Session token required to submit user stories" });
        return;
      }
      
      const data = insertUserStorySchema.parse(req.body);
      const story = await storage.createUserStory({
        ...data,
        sessionToken,
      });
      res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating user story:", error);
        res.status(500).json({ error: "Failed to create user story" });
      }
    }
  });

  app.put("/api/user-stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const isOwner = req.headers['x-app-owner'] === 'true';
      
      if (!isOwner) {
        res.status(403).json({ error: "Only app owners can update user stories" });
        return;
      }
      
      const data = insertUserStorySchema.partial().parse(req.body);
      const story = await storage.updateUserStory(id, data);
      
      if (story) {
        res.json(story);
      } else {
        res.status(404).json({ error: "User story not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error updating user story:", error);
        res.status(500).json({ error: "Failed to update user story" });
      }
    }
  });

  app.delete("/api/user-stories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const isOwner = req.headers['x-app-owner'] === 'true';
      
      if (!isOwner) {
        res.status(403).json({ error: "Only app owners can delete user stories" });
        return;
      }
      
      const success = await storage.deleteUserStory(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "User story not found" });
      }
    } catch (error) {
      console.error("Error deleting user story:", error);
      res.status(500).json({ error: "Failed to delete user story" });
    }
  });

  // User Story Upvotes
  app.post("/api/user-stories/:id/upvote", async (req, res) => {
    try {
      const { id } = req.params;
      let sessionToken = req.headers['x-session-token'] as string;
      
      if (!sessionToken) {
        res.status(401).json({ error: "Session token required to upvote" });
        return;
      }
      
      const success = await storage.upvoteUserStory(id, sessionToken);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Already upvoted" });
      }
    } catch (error) {
      console.error("Error upvoting user story:", error);
      res.status(500).json({ error: "Failed to upvote user story" });
    }
  });

  app.delete("/api/user-stories/:id/upvote", async (req, res) => {
    try {
      const { id } = req.params;
      let sessionToken = req.headers['x-session-token'] as string;
      
      if (!sessionToken) {
        res.status(401).json({ error: "Session token required to remove upvote" });
        return;
      }
      
      const success = await storage.removeUpvote(id, sessionToken);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "No upvote found" });
      }
    } catch (error) {
      console.error("Error removing upvote:", error);
      res.status(500).json({ error: "Failed to remove upvote" });
    }
  });

  // User Story Merge
  app.post("/api/user-stories/merge", async (req, res) => {
    try {
      const isOwner = req.headers['x-app-owner'] === 'true';
      
      if (!isOwner) {
        res.status(403).json({ error: "Only app owners can merge user stories" });
        return;
      }
      
      const { keepId, mergeId } = req.body;
      
      if (!keepId || !mergeId) {
        res.status(400).json({ error: "Both keepId and mergeId are required" });
        return;
      }
      
      const mergedStory = await storage.mergeUserStories(keepId, mergeId);
      if (mergedStory) {
        res.json(mergedStory);
      } else {
        res.status(500).json({ error: "Failed to merge user stories" });
      }
    } catch (error) {
      console.error("Error merging user stories:", error);
      res.status(500).json({ error: "Failed to merge user stories" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
