import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserProgressSchema, insertSpacedRepetitionSchema, insertLearningMaterialSchema, insertStudyMaterialSchema, insertTestAttemptSchema, insertUserGoalsSchema } from "@shared/schema";
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
      console.log("🎯 POST /api/progress called with:", req.body);
      const validatedData = insertUserProgressSchema.parse(req.body);
      const progress = await storage.createUserProgress(validatedData);
      console.log("📊 Progress saved:", progress);
      
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

      // 🚨 CRITICAL FIX: Trigger achievement detection after saving progress
      console.log("🏆 Checking achievements for progress:", progress.id);
      try {
        const notifications = await storage.checkAndAwardAchievements(progress);
        console.log("🎉 Achievement notifications created:", notifications.length);
      } catch (achievementError) {
        console.error("❌ Achievement detection failed:", achievementError);
        // Don't fail the entire request if achievement detection fails
      }

      // Also trigger full achievement evaluation to update all progress
      try {
        await storage.evaluateAchievements();
        console.log("✅ Achievement evaluation completed");
      } catch (evaluationError) {
        console.error("❌ Achievement evaluation failed:", evaluationError);
      }
      
      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("❌ Progress save failed:", error);
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

  // Readiness Score
  app.get("/api/readiness", async (req, res) => {
    try {
      const readinessScore = await storage.getReadinessScore();
      res.json(readinessScore);
    } catch (error) {
      console.error("Failed to get readiness score:", error);
      res.status(500).json({ message: "Failed to calculate readiness score" });
    }
  });

  // Test Attempts
  app.post("/api/test-attempts", async (req, res) => {
    try {
      const validatedData = insertTestAttemptSchema.parse(req.body);
      const testAttempt = await storage.createTestAttempt(validatedData);
      res.json(testAttempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid test attempt data", errors: error.errors });
        return;
      }
      console.error("Failed to create test attempt:", error);
      res.status(500).json({ message: "Failed to create test attempt" });
    }
  });

  app.get("/api/test-attempts", async (req, res) => {
    try {
      const { mode } = req.query;
      const testAttempts = await storage.getTestAttempts(mode as "anytime_test" | undefined);
      res.json(testAttempts);
    } catch (error) {
      console.error("Failed to get test attempts:", error);
      res.status(500).json({ message: "Failed to fetch test attempts" });
    }
  });

  // Anytime Test Questions
  app.get("/api/anytime-test-questions", async (req, res) => {
    try {
      const questions = await storage.getAnytimeTestSet();
      res.json(questions);
    } catch (error) {
      console.error("Failed to get anytime test questions:", error);
      res.status(500).json({ message: "Failed to fetch anytime test questions" });
    }
  });

  // ===== GAMIFICATION API ROUTES =====

  // Achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Failed to get achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/progress", async (req, res) => {
    try {
      const achievementsWithProgress = await storage.getAchievementsWithProgress();
      res.json(achievementsWithProgress);
    } catch (error) {
      console.error("Failed to get achievements with progress:", error);
      res.status(500).json({ message: "Failed to fetch achievements with progress" });
    }
  });

  app.get("/api/user-achievements", async (req, res) => {
    try {
      const userAchievements = await storage.getUserAchievements();
      res.json(userAchievements);
    } catch (error) {
      console.error("Failed to get user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const { unread } = req.query;
      const notifications = await storage.getNotifications(unread === 'true');
      res.json(notifications);
    } catch (error) {
      console.error("Failed to get notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount();
      res.json({ count });
    } catch (error) {
      console.error("Failed to get unread notification count:", error);
      res.status(500).json({ message: "Failed to get unread notification count" });
    }
  });

  // User Goals
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getUserGoals();
      res.json(goals);
    } catch (error) {
      console.error("Failed to get user goals:", error);
      res.status(500).json({ message: "Failed to fetch user goals" });
    }
  });

  app.patch("/api/goals", async (req, res) => {
    try {
      const validatedData = insertUserGoalsSchema.partial().parse(req.body);
      const updatedGoals = await storage.updateUserGoals(validatedData);
      res.json(updatedGoals);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid goal data", errors: error.errors });
        return;
      }
      console.error("Failed to update user goals:", error);
      res.status(500).json({ message: "Failed to update user goals" });
    }
  });

  // Streaks and Stats
  app.get("/api/streaks", async (req, res) => {
    try {
      const streakInfo = await storage.getStreakInfo();
      res.json(streakInfo);
    } catch (error) {
      console.error("Failed to get streak info:", error);
      res.status(500).json({ message: "Failed to fetch streak info" });
    }
  });

  app.get("/api/gamification-stats", async (req, res) => {
    try {
      const stats = await storage.getGamificationStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get gamification stats:", error);
      res.status(500).json({ message: "Failed to fetch gamification stats" });
    }
  });

  // Achievement Evaluation (trigger manually or after user actions)
  app.post("/api/evaluate-achievements", async (req, res) => {
    try {
      await storage.evaluateAchievements();
      res.json({ message: "Achievement evaluation completed" });
    } catch (error) {
      console.error("Failed to evaluate achievements:", error);
      res.status(500).json({ message: "Failed to evaluate achievements" });
    }
  });

  // Award specific achievement (admin/testing endpoint)
  app.post("/api/achievements/:key/award", async (req, res) => {
    try {
      const { key } = req.params;
      const { progress } = req.body;
      const result = await storage.awardAchievement(key, progress);
      
      if (result) {
        res.json({ 
          message: "Achievement awarded successfully", 
          achievement: result.achievement,
          notification: result.notification 
        });
      } else {
        res.json({ message: "Achievement not found or already earned" });
      }
    } catch (error) {
      console.error("Failed to award achievement:", error);
      res.status(500).json({ message: "Failed to award achievement" });
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
