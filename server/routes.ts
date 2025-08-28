import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserProgressSchema, insertSpacedRepetitionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Questions
  app.get("/api/questions", async (req, res) => {
    try {
      const { categoryId } = req.query;
      
      if (categoryId) {
        const questions = await storage.getQuestionsByCategory(categoryId as string);
        res.json(questions);
      } else {
        const questions = await storage.getQuestions();
        res.json(questions);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  // Spaced repetition questions
  app.get("/api/questions/review/next", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const questions = await storage.getQuestionsForReview(limit);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review questions" });
    }
  });

  // User progress
  app.post("/api/progress", async (req, res) => {
    try {
      const validatedData = insertUserProgressSchema.parse(req.body);
      const progress = await storage.createUserProgress(validatedData);
      
      // Update spaced repetition data
      const srData = await storage.getSpacedRepetitionForQuestion(validatedData.questionId);
      if (srData) {
        const { easeFactor, interval, repetitions } = calculateSpacedRepetition(
          srData.easeFactor,
          srData.interval,
          srData.repetitions,
          validatedData.correct
        );
        
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);
        
        await storage.updateSpacedRepetition(srData.id, {
          easeFactor,
          interval,
          repetitions,
          nextReview,
          lastReviewed: new Date(),
        });
      }
      
      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save progress" });
    }
  });

  // Statistics
  app.get("/api/stats/categories", async (req, res) => {
    try {
      const stats = await storage.getCategoryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });

  app.get("/api/stats/daily", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const stats = await storage.getDailyStats(days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/stats/overall", async (req, res) => {
    try {
      const stats = await storage.getOverallStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch overall stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Spaced repetition algorithm (simplified SM-2)
function calculateSpacedRepetition(
  easeFactor: number,
  interval: number,
  repetitions: number,
  correct: boolean
): { easeFactor: number; interval: number; repetitions: number } {
  if (!correct) {
    return {
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      interval: 1,
      repetitions: 0,
    };
  }

  const newRepetitions = repetitions + 1;
  let newInterval: number;
  
  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * easeFactor);
  }

  return {
    easeFactor: Math.max(1.3, easeFactor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))),
    interval: newInterval,
    repetitions: newRepetitions,
  };
}
