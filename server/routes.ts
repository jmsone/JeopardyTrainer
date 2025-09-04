import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserProgressSchema, insertSpacedRepetitionSchema, insertLearningMaterialSchema, insertStudyMaterialSchema } from "@shared/schema";
import { z } from "zod";
import { perplexityService } from "./perplexity-service";

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
      const { categoryId, value } = req.query;
      
      if (categoryId && value) {
        const question = await storage.getQuestionByValue(categoryId as string, parseInt(value as string));
        res.json(question);
      } else if (categoryId) {
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

  // Rapid-fire mode
  app.get("/api/questions/rapid-fire", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const categories = req.query.categories ? (req.query.categories as string).split(',') : undefined;
      const questions = await storage.getRapidFireQuestions(limit, categories);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rapid-fire questions" });
    }
  });

  // Get answered questions
  app.get("/api/answered-questions", async (req, res) => {
    try {
      const answeredQuestions = await storage.getAnsweredQuestions();
      res.json(answeredQuestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch answered questions" });
    }
  });

  // Reset game board with new questions
  app.post("/api/reset-board", async (req, res) => {
    try {
      await storage.resetGameBoard();
      res.json({ message: "Game board reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset game board" });
    }
  });

  // Clear all progress
  app.post("/api/clear-progress", async (req, res) => {
    try {
      await storage.clearProgress();
      res.json({ message: "Progress cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear progress" });
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

  // Learning Materials
  app.post("/api/learning-materials", async (req, res) => {
    try {
      const { questionId, userWasCorrect } = req.body;
      
      // Check if learning material already exists
      const existing = await storage.getLearningMaterial(questionId);
      if (existing) {
        return res.json(existing);
      }

      // Get question details
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Generate explanation using Perplexity
      const explanation = await perplexityService.generateExplanation(
        question.text,
        question.answer,
        userWasCorrect || false
      );

      // Save to storage
      const learningMaterial = await storage.createLearningMaterial({
        questionId,
        explanation: explanation.explanation,
        sources: explanation.sources,
        relatedFacts: explanation.relatedFacts,
        commonness: explanation.commonness,
      });

      res.json(learningMaterial);
    } catch (error) {
      console.error('Error generating learning material:', error);
      res.status(500).json({ message: "Failed to generate learning material" });
    }
  });

  app.get("/api/learning-materials/:questionId", async (req, res) => {
    try {
      const material = await storage.getLearningMaterial(req.params.questionId);
      if (!material) {
        return res.status(404).json({ message: "Learning material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning material" });
    }
  });

  // Study Review
  app.get("/api/study-review", async (req, res) => {
    try {
      const review = await storage.getStudyReview();
      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study review" });
    }
  });

  // Study Materials
  app.get("/api/study-materials", async (req, res) => {
    try {
      const { category } = req.query;
      
      if (category) {
        const materials = await storage.getStudyMaterialsByCategory(category as string);
        res.json(materials);
      } else {
        const materials = await storage.getStudyMaterials();
        res.json(materials);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study materials" });
    }
  });

  app.post("/api/study-materials", async (req, res) => {
    try {
      const { category, topic } = req.body;
      
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      // Generate study material using Perplexity
      const generatedMaterial = await perplexityService.generateStudyMaterial(category, topic);

      // Save to storage
      const studyMaterial = await storage.createStudyMaterial({
        category,
        title: generatedMaterial.title,
        content: generatedMaterial.content,
        sources: generatedMaterial.sources,
        relatedTopics: generatedMaterial.relatedTopics,
      });

      res.json(studyMaterial);
    } catch (error) {
      console.error('Error generating study material:', error);
      res.status(500).json({ message: "Failed to generate study material" });
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
