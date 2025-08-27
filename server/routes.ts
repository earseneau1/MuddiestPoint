import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCourseSchema, insertSubmissionSchema, insertMagicLinkSchema } from "@shared/schema";
import { z } from "zod";

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
