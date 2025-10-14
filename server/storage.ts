import { 
  type Category, 
  type Question, 
  type UserProgress, 
  type SpacedRepetition,
  type LearningMaterial,
  type StudyMaterial,
  type TestAttempt,
  type Achievement,
  type UserAchievement,
  type Notification,
  type UserGoals,
  type InsertCategory,
  type InsertQuestion,
  type InsertUserProgress,
  type InsertSpacedRepetition,
  type InsertLearningMaterial,
  type InsertStudyMaterial,
  type InsertTestAttempt,
  type InsertAchievement,
  type InsertUserAchievement,
  type InsertNotification,
  type InsertUserGoals,
  type QuestionWithCategory,
  type QuestionWithLearning,
  type StudyReview,
  type CategoryStats,
  type DailyStats,
  type ReadinessScore,
  type StreakInfo,
  type AchievementWithProgress,
  type GamificationStats,
  type NotificationWithAction
} from "@shared/schema";
import { randomUUID } from "crypto";
import { openTDBClient } from "./opentdb";

export interface IStorage {
  // User operations (IMPORTANT) - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestionsByCategory(categoryId: string): Promise<Question[]>;
  getRandomQuestionsByCategory(categoryId: string, value: number): Promise<Question[]>;
  getQuestion(id: string): Promise<QuestionWithCategory | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionByValue(categoryId: string, value: number): Promise<QuestionWithCategory | undefined>;
  getRapidFireQuestions(limit?: number, categoryIds?: string[]): Promise<QuestionWithCategory[]>;
  getAnsweredQuestions(userId?: string): Promise<{ questionId: string; assessment: "correct" | "incorrect" | "unsure" }[]>;
  clearProgress(userId?: string): Promise<void>;
  resetGameBoard(userId?: string): Promise<void>;
  
  // User Progress
  getUserProgress(userId?: string): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgressByCategory(categoryId: string, userId?: string): Promise<UserProgress[]>;
  
  // Spaced Repetition
  getSpacedRepetitionData(): Promise<SpacedRepetition[]>;
  getSpacedRepetitionForQuestion(questionId: string): Promise<SpacedRepetition | undefined>;
  createSpacedRepetition(data: InsertSpacedRepetition): Promise<SpacedRepetition>;
  updateSpacedRepetition(id: string, data: Partial<SpacedRepetition>): Promise<SpacedRepetition>;
  getQuestionsForReview(limit?: number): Promise<QuestionWithCategory[]>;
  
  // Learning Materials
  getLearningMaterial(questionId: string): Promise<LearningMaterial | undefined>;
  createLearningMaterial(material: InsertLearningMaterial): Promise<LearningMaterial>;
  getStudyReview(): Promise<StudyReview>;
  
  // Study Materials  
  getStudyMaterials(): Promise<StudyMaterial[]>;
  getStudyMaterialsByCategory(category: string): Promise<StudyMaterial[]>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;
  
  // Test Attempts
  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt>;
  getTestAttempts(mode?: "anytime_test"): Promise<TestAttempt[]>;
  getAnytimeTestSet(userId?: string): Promise<QuestionWithCategory[]>;
  
  // Readiness Calculation
  getReadinessScore(): Promise<ReadinessScore>;
  
  // Statistics
  getCategoryStats(userId?: string): Promise<CategoryStats[]>;
  getDailyStats(days: number, userId?: string): Promise<DailyStats[]>;
  getOverallStats(userId?: string): Promise<{
    totalQuestions: number;
    overallAccuracy: number;
    currentStreak: number;
    totalStudyTime: number;
  }>;

  // Gamification - Achievements
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId?: string): Promise<UserAchievement[]>;
  getUserAchievementByKey(key: string, userId?: string): Promise<UserAchievement | undefined>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: string, data: Partial<UserAchievement>): Promise<UserAchievement>;
  getAchievementsWithProgress(userId?: string): Promise<AchievementWithProgress[]>;
  awardAchievement(achievementKey: string, progress?: number, userId?: string): Promise<{ achievement: Achievement; notification: Notification } | null>;

  // Gamification - Notifications
  getNotifications(unreadOnly?: boolean, userId?: string): Promise<NotificationWithAction[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string, userId?: string): Promise<void>;
  getUnreadNotificationCount(userId?: string): Promise<number>;

  // Gamification - Goals and Streaks
  getUserGoals(userId?: string): Promise<UserGoals>;
  updateUserGoals(goals: Partial<InsertUserGoals>, userId?: string): Promise<UserGoals>;
  getStreakInfo(userId?: string): Promise<StreakInfo>;
  getGamificationStats(userId?: string): Promise<GamificationStats>;

  // Achievement Detection
  checkAndAwardAchievements(progressData: UserProgress): Promise<Notification[]>;
  evaluateAchievements(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private questions: Map<string, Question> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private spacedRepetition: Map<string, SpacedRepetition> = new Map();
  private learningMaterials: Map<string, LearningMaterial> = new Map();
  private studyMaterials: Map<string, StudyMaterial> = new Map();
  private testAttempts: Map<string, TestAttempt> = new Map();
  
  // Gamification storage
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private userGoals: Map<string, UserGoals> = new Map();

  private initialized = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize achievement catalog only
    // Categories and questions will be loaded from jService API on demand
    this.initializeAchievements();
  }

  // Fetch fresh game board from Open Trivia DB API
  async fetchFreshGameBoard(): Promise<void> {
    try {
      console.log('🎯 Fetching fresh game board from Open Trivia DB...');
      
      // Define diverse category mix using Open Trivia DB category IDs
      const diverseCategories = [
        { id: 9, name: 'General Knowledge' },
        { id: 23, name: 'History' },
        { id: 22, name: 'Geography' },
        { id: 17, name: 'Science & Nature' },
        { id: 21, name: 'Sports' },
        { id: 25, name: 'Art' }
      ];
      
      // Fetch questions from each category (12 per category, filtered down to ~8 each = ~48 total)
      const allQuestions: any[] = [];
      for (const cat of diverseCategories) {
        try {
          const questions = await openTDBClient.getQuestionsByCategory(cat.id, 12);
          console.log(`   📚 Fetched ${questions.length} Jeopardy-suitable questions from ${cat.name}`);
          allQuestions.push(...questions);
        } catch (error) {
          console.warn(`   ⚠️  Failed to fetch ${cat.name}, skipping...`);
        }
      }
      
      console.log(`📝 Total fetched: ${allQuestions.length} questions from ${diverseCategories.length} categories`);
      
      // Ensure we have enough questions
      if (allQuestions.length < 30) {
        throw new Error(`Insufficient questions after filtering: got ${allQuestions.length}, need 30`);
      }
      
      // Sort ALL questions by difficulty: easy → medium → hard
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      const allSortedQuestions = [...allQuestions].sort((a, b) => {
        const orderA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2;
        const orderB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2;
        return orderA - orderB;
      });
      
      // Take first 30 questions (guarantees easiest questions come first)
      const selectedQuestions = allSortedQuestions.slice(0, 30);
      console.log(`📊 Selected 30 questions by difficulty: ${selectedQuestions.filter(q => q.difficulty === 'easy').length} easy, ${selectedQuestions.filter(q => q.difficulty === 'medium').length} medium, ${selectedQuestions.filter(q => q.difficulty === 'hard').length} hard`);
      
      // Group into 6 categories (5 questions each)
      const categoryMap = new Map<string, typeof selectedQuestions>();
      
      for (const q of selectedQuestions) {
        if (!categoryMap.has(q.category)) {
          categoryMap.set(q.category, []);
        }
        categoryMap.get(q.category)!.push(q);
      }
      
      // Take up to 6 categories
      const categoryNames = Array.from(categoryMap.keys()).slice(0, 6);
      
      // Prepare new data structures
      const newCategories = new Map<string, Category>();
      const newQuestions = new Map<string, Question>();
      const newSpacedRepetition = new Map<string, SpacedRepetition>();
      const values = [200, 400, 600, 800, 1000];
      
      // Assign questions to categories and values
      let questionIndex = 0;
      for (const categoryName of categoryNames) {
        // Create category
        const category: Category = {
          id: randomUUID(),
          name: categoryName,
          weight: 1.0
        };
        newCategories.set(category.id, category);
        
        // Assign 5 questions to this category from our sorted list
        for (let i = 0; i < 5 && questionIndex < selectedQuestions.length; i++) {
          const tq = selectedQuestions[questionIndex++];
          const converted = openTDBClient.convertQuestion(tq);
          const assignedValue = values[i];
          
          const question: Question = {
            id: randomUUID(),
            categoryId: category.id,
            text: converted.text,
            answer: converted.answer,
            value: assignedValue,
            difficulty: Math.ceil(assignedValue / 200),
            airDate: null,
            jServiceId: null
          };
          
          newQuestions.set(question.id, question);
          
          // Initialize spaced repetition data
          const srData: SpacedRepetition = {
            id: randomUUID(),
            userId: "system",
            questionId: question.id,
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
            nextReview: new Date(),
            lastReviewed: null,
          };
          newSpacedRepetition.set(srData.id, srData);
        }
        
        console.log(`   ✅ Prepared 5 questions for ${categoryName}`);
      }
      
      // Only clear and replace after successful fetch
      this.categories.clear();
      this.questions.clear();
      
      // Copy new data into existing maps
      for (const [key, value] of newCategories) {
        this.categories.set(key, value);
      }
      for (const [key, value] of newQuestions) {
        this.questions.set(key, value);
      }
      
      // Add new spaced repetition data (append to existing user data)
      for (const [key, value] of newSpacedRepetition) {
        this.spacedRepetition.set(key, value);
      }
      
      const totalQuestions = this.questions.size;
      console.log(`✨ Game board initialized with ${totalQuestions} questions from ${this.categories.size} categories`);
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to fetch fresh game board:', error);
      
      // If not initialized yet and we have no fallback, keep error thrown
      if (!this.initialized) {
        throw error;
      }
      
      // If already initialized, keep existing data and log error
      console.warn('⚠️  Keeping existing game board due to API error');
    }
  }

  private initializeAchievements() {
    const achievements: InsertAchievement[] = [
      // Milestone achievements
      {
        key: "first_clue",
        name: "First Clue! 🎯",
        description: "Answer your very first Jeopardy question",
        icon: "🎯",
        category: "milestone",
        tier: "bronze",
        points: 10,
        requirements: JSON.stringify({ totalQuestions: 1 })
      },
      {
        key: "getting_started", 
        name: "Getting Started 📚",
        description: "Answer 5 questions correctly",
        icon: "📚",
        category: "milestone", 
        tier: "bronze",
        points: 25,
        requirements: JSON.stringify({ correctAnswers: 5 })
      },
      {
        key: "quiz_enthusiast",
        name: "Quiz Enthusiast 🧠", 
        description: "Answer 25 questions total",
        icon: "🧠",
        category: "milestone",
        tier: "silver", 
        points: 50,
        requirements: JSON.stringify({ totalQuestions: 25 })
      },
      {
        key: "jeopardy_scholar",
        name: "Jeopardy Scholar 🎓",
        description: "Answer 100 questions total",
        icon: "🎓", 
        category: "milestone",
        tier: "gold",
        points: 100,
        requirements: JSON.stringify({ totalQuestions: 100 })
      },

      // Streak achievements
      {
        key: "daily_habit",
        name: "Daily Habit 🔥",
        description: "Maintain a 3-day streak",
        icon: "🔥",
        category: "streak",
        tier: "bronze", 
        points: 30,
        requirements: JSON.stringify({ dailyStreak: 3 })
      },
      {
        key: "week_warrior",
        name: "Week Warrior ⚡",
        description: "Maintain a 7-day streak", 
        icon: "⚡",
        category: "streak",
        tier: "silver",
        points: 75,
        requirements: JSON.stringify({ dailyStreak: 7 })
      },
      {
        key: "streak_master",
        name: "Streak Master 🌟",
        description: "Maintain a 30-day streak",
        icon: "🌟", 
        category: "streak",
        tier: "gold",
        points: 200,
        requirements: JSON.stringify({ dailyStreak: 30 })
      },

      // Mastery achievements
      {
        key: "category_specialist",
        name: "Category Specialist 🏆",
        description: "Achieve 80%+ accuracy in any category with 10+ questions",
        icon: "🏆",
        category: "mastery", 
        tier: "silver",
        points: 60,
        requirements: JSON.stringify({ categoryAccuracy: 80, categoryQuestions: 10 })
      },
      {
        key: "well_rounded",
        name: "Well Rounded 🌈",
        description: "Practice in 6 different categories",
        icon: "🌈",
        category: "mastery",
        tier: "silver", 
        points: 50,
        requirements: JSON.stringify({ categoriesCovered: 6 })
      },
      {
        key: "perfectionist", 
        name: "Perfectionist 💎",
        description: "Get 10 questions correct in a row",
        icon: "💎",
        category: "mastery",
        tier: "gold",
        points: 80,
        requirements: JSON.stringify({ perfectStreak: 10 })
      },

      // Speed achievements
      {
        key: "quick_thinker",
        name: "Quick Thinker ⚡",
        description: "Answer 5 questions in under 5 seconds each",
        icon: "⚡", 
        category: "speed",
        tier: "bronze",
        points: 40,
        requirements: JSON.stringify({ fastAnswers: 5, timeLimit: 5 })
      },
      {
        key: "speed_demon",
        name: "Speed Demon 🏃",
        description: "Answer 20 questions in under 3 seconds each", 
        icon: "🏃",
        category: "speed",
        tier: "gold",
        points: 100,
        requirements: JSON.stringify({ fastAnswers: 20, timeLimit: 3 })
      },

      // Test achievements
      {
        key: "test_taker", 
        name: "Test Taker 📝",
        description: "Complete your first Anytime! Test",
        icon: "📝",
        category: "milestone",
        tier: "silver",
        points: 75,
        requirements: JSON.stringify({ anytimeTestsCompleted: 1 })
      },
      {
        key: "test_master",
        name: "Test Master 👑",
        description: "Score 80%+ on an Anytime! Test",
        icon: "👑", 
        category: "mastery",
        tier: "platinum",
        points: 150,
        requirements: JSON.stringify({ anytimeTestScore: 80 })
      },

      // Readiness achievements
      {
        key: "test_ready",
        name: "Test Ready! 🎯",
        description: "Reach 70% overall readiness",
        icon: "🎯",
        category: "milestone",
        tier: "silver", 
        points: 100,
        requirements: JSON.stringify({ readinessScore: 70 })
      },
      {
        key: "highly_prepared", 
        name: "Highly Prepared 🚀",
        description: "Reach 80% overall readiness",
        icon: "🚀",
        category: "milestone",
        tier: "gold",
        points: 150,
        requirements: JSON.stringify({ readinessScore: 80 })
      },
      {
        key: "jeopardy_master",
        name: "Jeopardy Master 👑",
        description: "Reach 90% overall readiness", 
        icon: "👑",
        category: "milestone",
        tier: "platinum",
        points: 250,
        requirements: JSON.stringify({ readinessScore: 90 })
      }
    ];

    achievements.forEach(ach => {
      const achievement: Achievement = { ...ach, id: randomUUID() };
      this.achievements.set(achievement.key, achievement);
    });
  }

  // User operations (IMPORTANT) - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getCategories(): Promise<Category[]> {
    // Auto-initialize if not loaded yet
    if (!this.initialized) {
      await this.fetchFreshGameBoard();
    }
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id, weight: insertCategory.weight || 1.0 };
    this.categories.set(id, category);
    return category;
  }

  async getQuestions(): Promise<Question[]> {
    // Auto-initialize if not loaded yet
    if (!this.initialized) {
      await this.fetchFreshGameBoard();
    }
    return Array.from(this.questions.values());
  }

  async getQuestionsByCategory(categoryId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.categoryId === categoryId);
  }

  async getRandomQuestionsByCategory(categoryId: string, value: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.categoryId === categoryId && q.value === value);
  }

  async getQuestionByValue(categoryId: string, value: number): Promise<QuestionWithCategory | undefined> {
    const question = Array.from(this.questions.values()).find(q => q.categoryId === categoryId && q.value === value);
    if (!question) return undefined;
    
    const category = this.categories.get(question.categoryId);
    if (!category) return undefined;
    
    return { ...question, category };
  }

  async getRapidFireQuestions(limit: number = 10, categoryIds?: string[]): Promise<QuestionWithCategory[]> {
    let allQuestions = Array.from(this.questions.values());
    
    // Filter by categories if specified
    if (categoryIds && categoryIds.length > 0) {
      allQuestions = allQuestions.filter(q => categoryIds.includes(q.categoryId));
    }
    
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questionsWithCategories: QuestionWithCategory[] = [];
    
    for (const question of shuffled.slice(0, limit)) {
      const category = this.categories.get(question.categoryId);
      if (category) {
        questionsWithCategories.push({ ...question, category });
      }
    }
    
    return questionsWithCategories;
  }

  async getQuestion(id: string): Promise<QuestionWithCategory | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const category = this.categories.get(question.categoryId);
    if (!category) return undefined;
    
    return { ...question, category };
  }

  async getAnsweredQuestions(userId?: string, mode?: "game" | "rapid_fire" | "anytime_test"): Promise<{ questionId: string; assessment: "correct" | "incorrect" | "unsure" }[]> {
    let progressEntries = Array.from(this.userProgress.values());
    
    // Filter by userId if provided
    if (userId) {
      progressEntries = progressEntries.filter(p => p.userId === userId);
    }
    
    // Filter by mode if provided
    if (mode) {
      progressEntries = progressEntries.filter(p => p.mode === mode);
    }
    
    return progressEntries.map(p => ({ 
      questionId: p.questionId, 
      assessment: p.selfAssessment as "correct" | "incorrect" | "unsure"
    }));
  }

  async clearProgress(userId?: string): Promise<void> {
    if (userId) {
      // Clear progress for specific user only
      for (const [key, progress] of this.userProgress.entries()) {
        if (progress.userId === userId) {
          this.userProgress.delete(key);
        }
      }
      for (const [key, sr] of this.spacedRepetition.entries()) {
        if (sr.userId === userId) {
          this.spacedRepetition.delete(key);
        }
      }
    } else {
      // Clear all progress (backward compatibility)
      this.userProgress.clear();
      this.spacedRepetition.clear();
    }
  }

  async resetGameBoard(userId?: string): Promise<void> {
    // Clear progress for user (or all if no userId provided)
    await this.clearProgress(userId);
    
    // Always fetch fresh questions from jService API
    await this.fetchFreshGameBoard();
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { 
      ...insertQuestion, 
      id,
      difficulty: insertQuestion.difficulty || 1,
      airDate: insertQuestion.airDate || null,
      jServiceId: insertQuestion.jServiceId || null
    };
    this.questions.set(id, question);
    return question;
  }

  async getUserProgress(userId?: string): Promise<UserProgress[]> {
    let progressEntries = Array.from(this.userProgress.values());
    
    // Filter by userId if provided
    if (userId) {
      progressEntries = progressEntries.filter(p => p.userId === userId);
    }
    
    return progressEntries;
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const progress: UserProgress = { 
      ...insertProgress, 
      id, 
      mode: insertProgress.mode || "game",
      sessionId: insertProgress.sessionId || null,
      answeredAt: new Date(),
      userAnswer: insertProgress.userAnswer || null,
      timeSpent: insertProgress.timeSpent || null,
      selfAssessment: insertProgress.selfAssessment || "unsure"
    };
    this.userProgress.set(id, progress);
    return progress;
  }

  async getUserProgressByCategory(categoryId: string, userId?: string): Promise<UserProgress[]> {
    const categoryQuestions = await this.getQuestionsByCategory(categoryId);
    const questionIds = new Set(categoryQuestions.map(q => q.id));
    
    let progressEntries = Array.from(this.userProgress.values()).filter(
      progress => questionIds.has(progress.questionId)
    );
    
    // Filter by userId if provided
    if (userId) {
      progressEntries = progressEntries.filter(p => p.userId === userId);
    }
    
    return progressEntries;
  }

  async getSpacedRepetitionData(): Promise<SpacedRepetition[]> {
    return Array.from(this.spacedRepetition.values());
  }

  async getSpacedRepetitionForQuestion(questionId: string): Promise<SpacedRepetition | undefined> {
    return Array.from(this.spacedRepetition.values()).find(sr => sr.questionId === questionId);
  }

  async createSpacedRepetition(insertData: InsertSpacedRepetition): Promise<SpacedRepetition> {
    const id = randomUUID();
    const data: SpacedRepetition = { 
      ...insertData, 
      id,
      easeFactor: insertData.easeFactor ?? 2.5,
      interval: insertData.interval ?? 1,
      repetitions: insertData.repetitions ?? 0,
      nextReview: insertData.nextReview ?? new Date(),
      lastReviewed: insertData.lastReviewed ?? null
    };
    this.spacedRepetition.set(id, data);
    return data;
  }

  async updateSpacedRepetition(id: string, updates: Partial<SpacedRepetition>): Promise<SpacedRepetition> {
    const existing = this.spacedRepetition.get(id);
    if (!existing) throw new Error("Spaced repetition data not found");
    
    const updated: SpacedRepetition = { ...existing, ...updates };
    this.spacedRepetition.set(id, updated);
    return updated;
  }

  async getQuestionsForReview(limit: number = 10): Promise<QuestionWithCategory[]> {
    const now = new Date();
    const dueForReview = Array.from(this.spacedRepetition.values())
      .filter(sr => sr.nextReview <= now)
      .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
      .slice(0, limit);

    const questionsWithCategories: QuestionWithCategory[] = [];
    
    for (const sr of dueForReview) {
      const questionWithCategory = await this.getQuestion(sr.questionId);
      if (questionWithCategory) {
        questionsWithCategories.push(questionWithCategory);
      }
    }
    
    return questionsWithCategories;
  }

  async getCategoryStats(userId?: string): Promise<CategoryStats[]> {
    const categories = await this.getCategories();
    const stats: CategoryStats[] = [];

    for (const category of categories) {
      const categoryProgress = await this.getUserProgressByCategory(category.id, userId);
      const totalQuestions = categoryProgress.length;
      const correctAnswers = categoryProgress.filter(p => p.correct).length;
      const averageTime = totalQuestions > 0 
        ? categoryProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / totalQuestions 
        : 0;

      stats.push({
        categoryId: category.id,
        categoryName: category.name,
        totalQuestions,
        correctAnswers,
        accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        averageTime,
      });
    }

    return stats;
  }

  async getDailyStats(days: number, userId?: string): Promise<DailyStats[]> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const allProgress = await this.getUserProgress(userId);
    const dailyStats: DailyStats[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayProgress = allProgress.filter(p => {
        const progressDate = p.answeredAt.toISOString().split('T')[0];
        return progressDate === dateStr;
      });

      const questionsAnswered = dayProgress.length;
      const correctAnswers = dayProgress.filter(p => p.correct).length;
      const studyTime = dayProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

      dailyStats.push({
        date: dateStr,
        questionsAnswered,
        correctAnswers,
        accuracy: questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0,
        studyTime,
      });
    }

    return dailyStats;
  }

  async getOverallStats(userId?: string): Promise<{
    totalQuestions: number;
    overallAccuracy: number;
    currentStreak: number;
    totalStudyTime: number;
  }> {
    const allProgress = await this.getUserProgress(userId);
    const totalQuestions = allProgress.length;
    const correctAnswers = allProgress.filter(p => p.correct).length;
    const overallAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalStudyTime = Math.round(allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / 3600); // hours

    // Calculate current streak
    const sortedProgress = allProgress
      .sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime());
    
    let currentStreak = 0;
    for (const progress of sortedProgress) {
      if (progress.correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalQuestions,
      overallAccuracy,
      currentStreak,
      totalStudyTime,
    };
  }

  // Learning Materials implementation
  async getLearningMaterial(questionId: string): Promise<LearningMaterial | undefined> {
    return Array.from(this.learningMaterials.values()).find(lm => lm.questionId === questionId);
  }

  async createLearningMaterial(insertMaterial: InsertLearningMaterial): Promise<LearningMaterial> {
    const id = randomUUID();
    const material: LearningMaterial = { 
      ...insertMaterial, 
      id, 
      commonness: insertMaterial.commonness || "common",
      generatedAt: new Date() 
    };
    this.learningMaterials.set(id, material);
    return material;
  }

  async getStudyReview(): Promise<StudyReview> {
    const allProgress = await this.getUserProgress();
    const review: StudyReview = {
      correct: [],
      incorrect: [],
      unsure: []
    };

    for (const progress of allProgress) {
      const questionWithCategory = await this.getQuestion(progress.questionId);
      if (!questionWithCategory) continue;

      const learningMaterial = await this.getLearningMaterial(progress.questionId);
      const questionWithLearning: QuestionWithLearning = {
        ...questionWithCategory,
        learningMaterial
      };

      review[progress.selfAssessment].push(questionWithLearning);
    }

    return review;
  }

  // Study Materials implementation
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values());
  }

  async getStudyMaterialsByCategory(category: string): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values()).filter(sm => sm.category === category);
  }

  async createStudyMaterial(insertMaterial: InsertStudyMaterial): Promise<StudyMaterial> {
    const id = randomUUID();
    const material: StudyMaterial = { 
      ...insertMaterial, 
      id, 
      generatedAt: new Date()
    };
    this.studyMaterials.set(id, material);
    return material;
  }

  // Test Attempts implementation
  async createTestAttempt(insertAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const id = randomUUID();
    const attempt: TestAttempt = {
      ...insertAttempt,
      id,
      finishedAt: new Date()
    };
    this.testAttempts.set(id, attempt);
    return attempt;
  }

  async getTestAttempts(mode?: "anytime_test"): Promise<TestAttempt[]> {
    const attempts = Array.from(this.testAttempts.values());
    if (mode) {
      return attempts.filter(attempt => attempt.mode === mode);
    }
    return attempts;
  }

  async getAnytimeTestSet(userId?: string): Promise<QuestionWithCategory[]> {
    try {
      console.log('🎯 Fetching fresh Jeopardy-suitable questions from Open Trivia DB for Anytime Test...');
      
      // Fetch 50 random questions from Open Trivia DB (already filtered for Jeopardy suitability)
      const triviaQuestions = await openTDBClient.getRandomQuestions(50);
      console.log(`📝 Fetched ${triviaQuestions.length} Jeopardy-suitable questions from Open Trivia DB`);
      
      // Ensure we have enough questions
      if (triviaQuestions.length < 30) {
        console.warn(`⚠️ Only got ${triviaQuestions.length} questions after filtering, attempting to fetch more...`);
        // If we don't have enough, return what we have rather than failing
        if (triviaQuestions.length === 0) {
          throw new Error('No suitable questions available');
        }
      }
      
      const questions: QuestionWithCategory[] = [];
      
      // Convert each question to our format
      for (const tq of triviaQuestions) {
        const converted = openTDBClient.convertQuestion(tq);
        
        // Create a temporary category for this question
        const category: Category = {
          id: randomUUID(),
          name: tq.category,
          weight: 1.0
        };
        
        const question: QuestionWithCategory = {
          id: randomUUID(),
          categoryId: category.id,
          text: converted.text,
          answer: converted.answer,
          value: converted.value,
          difficulty: converted.difficulty,
          airDate: null,
          jServiceId: null,
          category
        };
        
        questions.push(question);
      }
      
      console.log(`✨ Anytime Test set ready with ${questions.length} Jeopardy-suitable questions`);
      return questions;
    } catch (error) {
      console.error('❌ Failed to fetch Anytime Test questions:', error);
      // Fallback to empty array rather than failing completely
      return [];
    }
  }

  async getReadinessScore(): Promise<ReadinessScore> {
    const now = new Date();
    const allProgress = await this.getUserProgress();
    const testAttempts = await this.getTestAttempts("anytime_test");
    const spacedRepetitionData = await this.getSpacedRepetitionData();
    const categories = await this.getCategories();

    // Time decay function: w = exp(-ageDays/halfLife)
    const calculateTimeWeight = (date: Date, halfLifeDays: number): number => {
      const ageDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return Math.exp(-ageDays / halfLifeDays);
    };

    // Component 1: Anytime! Test Performance (60%)
    let anytimeTestScore = 0;
    if (testAttempts.length > 0) {
      const weightedAttempts = testAttempts.map(attempt => {
        const accuracy = (attempt.correctCount / attempt.totalQuestions) * 100;
        const weight = calculateTimeWeight(attempt.finishedAt, 21); // 21-day half-life
        return { accuracy, weight };
      });
      
      const totalWeight = weightedAttempts.reduce((sum, a) => sum + a.weight, 0);
      if (totalWeight > 0) {
        anytimeTestScore = weightedAttempts.reduce((sum, a) => sum + (a.accuracy * a.weight), 0) / totalWeight;
      }
    }

    // Component 2: Game Mode Performance (25%)
    const gameProgress = allProgress.filter(p => p.mode === "game");
    let gameModeScore = 0;
    if (gameProgress.length > 0) {
      const weightedGameProgress = gameProgress.map(progress => {
        const accuracy = progress.correct ? 100 : 0;
        const weight = calculateTimeWeight(progress.answeredAt, 28); // 28-day half-life
        return { accuracy, weight };
      });
      
      const totalWeight = weightedGameProgress.reduce((sum, p) => sum + p.weight, 0);
      if (totalWeight > 0) {
        gameModeScore = weightedGameProgress.reduce((sum, p) => sum + (p.accuracy * p.weight), 0) / totalWeight;
      }
    }

    // Component 3: Spaced Repetition Performance (15%)
    let spacedRepetitionScore = 0;
    if (spacedRepetitionData.length > 0) {
      // Calculate average ease factor and recent review performance
      const avgEaseFactor = spacedRepetitionData.reduce((sum, sr) => sum + sr.easeFactor, 0) / spacedRepetitionData.length;
      
      // Recent reviews (last 30 days)
      const recentReviews = allProgress.filter(p => {
        const daysDiff = (now.getTime() - p.answeredAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      });
      
      const recentCorrectRate = recentReviews.length > 0 
        ? (recentReviews.filter(p => p.correct).length / recentReviews.length) * 100 
        : 0;
      
      // Map ease factor (baseline 2.5) to 0-100 scale and combine with recent performance
      const easeFactorScore = Math.max(0, Math.min(100, ((avgEaseFactor - 1.3) / 1.7) * 100));
      spacedRepetitionScore = Math.max(0, Math.min(100, easeFactorScore * (recentCorrectRate / 100)));
    }

    // Calculate category coverage and breadth
    const categoryCoverage: Array<{
      categoryId: string;
      categoryName: string;
      accuracy: number;
      recentQuestions: number;
      weight: number;
      covered: boolean;
    }> = [];

    for (const category of categories) {
      const categoryProgress = allProgress.filter(p => {
        const question = Array.from(this.questions.values()).find(q => q.id === p.questionId);
        return question?.categoryId === category.id;
      });

      // Recent questions (last 60 days)
      const recentProgress = categoryProgress.filter(p => {
        const daysDiff = (now.getTime() - p.answeredAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 60;
      });

      const accuracy = recentProgress.length > 0 
        ? (recentProgress.filter(p => p.correct).length / recentProgress.length) * 100 
        : 0;

      const covered = accuracy >= 70 && recentProgress.length >= 3;

      categoryCoverage.push({
        categoryId: category.id,
        categoryName: category.name,
        accuracy,
        recentQuestions: recentProgress.length,
        weight: category.weight,
        covered
      });
    }

    const coveredCategories = categoryCoverage.filter(c => c.covered).length;
    const breadthFactor = Math.min(1, coveredCategories / 10);

    // Calculate base score from components
    const components = [
      { name: "Anytime! Test", score: anytimeTestScore, weight: 0.6, description: "Practice test performance" },
      { name: "Game Mode", score: gameModeScore, weight: 0.25, description: "Traditional game performance" },
      { name: "Spaced Repetition", score: spacedRepetitionScore, weight: 0.15, description: "Knowledge retention" }
    ];

    const baseScore = components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0);
    
    // Apply breadth factor: final = baseScore * (0.7 + 0.3 * breadthFactor)
    // If covered < 6 categories, cap readiness at 69%
    let overallScore = baseScore * (0.7 + 0.3 * breadthFactor);
    if (coveredCategories < 6) {
      overallScore = Math.min(overallScore, 69);
    }

    // Letter grade
    const letterGrade: "A" | "B" | "C" | "D" | "F" = 
      overallScore >= 90 ? "A" :
      overallScore >= 80 ? "B" :
      overallScore >= 70 ? "C" :
      overallScore >= 60 ? "D" : "F";

    // Test ready: ≥80% readiness and at least one passing test in last 30 days
    const recentPassingTests = testAttempts.filter(attempt => {
      const daysDiff = (now.getTime() - attempt.finishedAt.getTime()) / (1000 * 60 * 60 * 24);
      const accuracy = (attempt.correctCount / attempt.totalQuestions) * 100;
      return daysDiff <= 30 && accuracy >= 70;
    });

    const testReady = overallScore >= 80 && recentPassingTests.length > 0;

    // Identify weak categories (below 60% accuracy or insufficient recent questions)
    const weakCategories = categoryCoverage.filter(c => c.accuracy < 60 || c.recentQuestions < 3);

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      letterGrade,
      components,
      categoryBreadth: {
        coveredCategories,
        totalCategories: categories.length,
        requiredCategories: 10,
        breadthFactor: Math.round(breadthFactor * 100) / 100
      },
      categoryCoverage,
      weakCategories,
      testReady,
      lastUpdated: now
    };
  }

  // Gamification methods implementation
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const newAchievement: Achievement = { ...achievement, id };
    this.achievements.set(achievement.key, newAchievement);
    return newAchievement;
  }

  async getUserAchievements(): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values());
  }

  async getUserAchievementByKey(key: string): Promise<UserAchievement | undefined> {
    return Array.from(this.userAchievements.values()).find(ua => ua.achievementKey === key);
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = randomUUID();
    const newUserAchievement: UserAchievement = {
      ...userAchievement,
      id,
      createdAt: new Date(),
    };
    this.userAchievements.set(id, newUserAchievement);
    return newUserAchievement;
  }

  async updateUserAchievement(id: string, data: Partial<UserAchievement>): Promise<UserAchievement> {
    const existing = this.userAchievements.get(id);
    if (!existing) {
      throw new Error("UserAchievement not found");
    }
    const updated = { ...existing, ...data };
    this.userAchievements.set(id, updated);
    return updated;
  }

  async getAchievementsWithProgress(): Promise<AchievementWithProgress[]> {
    const achievements = await this.getAchievements();
    const userAchievements = await this.getUserAchievements();
    
    return achievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievementKey === achievement.key);
      
      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        maxProgress: userAchievement?.maxProgress || 1,
        isEarned: userAchievement?.isEarned || false,
        earnedAt: userAchievement?.earnedAt,
        progressPercent: userAchievement ? (userAchievement.progress / userAchievement.maxProgress) * 100 : 0,
      };
    });
  }

  async awardAchievement(achievementKey: string, progress?: number): Promise<{ achievement: Achievement; notification: Notification } | null> {
    const achievement = this.achievements.get(achievementKey);
    if (!achievement) return null;

    let userAchievement = await this.getUserAchievementByKey(achievementKey);
    
    if (!userAchievement) {
      // Create new user achievement
      userAchievement = await this.createUserAchievement({
        achievementKey,
        progress: progress || 1,
        maxProgress: 1,
        isEarned: false,
      });
    } else if (userAchievement.isEarned) {
      return null; // Already earned
    }

    // Update progress
    const newProgress = Math.min(userAchievement.progress + (progress || 1), userAchievement.maxProgress);
    const isEarned = newProgress >= userAchievement.maxProgress;

    await this.updateUserAchievement(userAchievement.id, {
      progress: newProgress,
      isEarned,
      earnedAt: isEarned ? new Date() : undefined,
    });

    if (isEarned) {
      // Create notification
      const notification = await this.createNotification({
        type: "achievement",
        title: "Achievement Unlocked!",
        message: `${achievement.name}: ${achievement.description}`,
        icon: achievement.icon,
        priority: "high",
      });

      return { achievement, notification };
    }

    return null;
  }

  async getNotifications(unreadOnly?: boolean): Promise<NotificationWithAction[]> {
    const notifications = Array.from(this.notifications.values());
    const filtered = unreadOnly ? notifications.filter(n => !n.isRead) : notifications;
    
    return filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(notification => ({
        ...notification,
        canDismiss: true,
        timeAgo: this.formatTimeAgo(notification.createdAt),
        achievementData: notification.type === "achievement" ? 
          this.achievements.get(notification.message.split(":")[0]?.trim()) : undefined,
      }));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(id, notification);
    }
  }

  async getUnreadNotificationCount(userId?: string): Promise<number> {
    const notifications = Array.from(this.notifications.values());
    return notifications.filter(n => !n.isRead && (!userId || n.userId === userId)).length;
  }

  async getUserGoals(userId?: string): Promise<UserGoals> {
    // For now, return the single user goals instance
    // In a multi-user system, this would be scoped by userId
    return this.userGoals;
  }

  async updateUserGoals(goals: Partial<InsertUserGoals>, userId?: string): Promise<UserGoals> {
    // For now, update the single user goals instance
    // In a multi-user system, this would be scoped by userId
    this.userGoals = {
      ...this.userGoals,
      ...goals,
      updatedAt: new Date(),
    };
    return this.userGoals;
  }

  async getStreakInfo(userId?: string): Promise<StreakInfo> {
    // For now, calculate streaks for all data
    // In a multi-user system, this would be scoped by userId
    const dailyStats = await this.getDailyStats(365); // Get full year for accurate streaks
    const today = new Date().toISOString().split('T')[0];
    const userGoals = await this.getUserGoals(userId);
    
    // Calculate streaks
    let dailyStreak = 0;
    let longestDailyStreak = 0;
    let currentStreak = 0;
    
    // Sort daily stats by date
    const sortedStats = dailyStats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Check daily streak from today backwards
    for (let i = 0; i < sortedStats.length; i++) {
      const stat = sortedStats[i];
      if (stat.questionsAnswered > 0) {
        if (i === 0 || dailyStreak === i) { // Continuous streak
          dailyStreak++;
          currentStreak++;
        } else {
          break;
        }
      } else if (i === 0) {
        break; // Today has no activity
      }
    }
    
    // Calculate longest streak
    let tempStreak = 0;
    for (const stat of sortedStats.reverse()) {
      if (stat.questionsAnswered > 0) {
        tempStreak++;
        longestDailyStreak = Math.max(longestDailyStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const todayStat = dailyStats.find(s => s.date === today);
    const questionsToday = todayStat?.questionsAnswered || 0;
    const goalProgress = Math.min((questionsToday / userGoals.dailyQuestionGoal) * 100, 100);

    return {
      dailyStreak,
      weeklyStreak: Math.floor(dailyStreak / 7), // Simple weekly calculation
      monthlyStreak: Math.floor(dailyStreak / 30), // Simple monthly calculation
      longestDailyStreak,
      lastActiveDate: sortedStats.find(s => s.questionsAnswered > 0)?.date || today,
      todayComplete: questionsToday >= userGoals.dailyQuestionGoal,
      questionsToday,
      goalProgress,
    };
  }

  async getGamificationStats(userId?: string): Promise<GamificationStats> {
    // For now, calculate stats for all data
    // In a multi-user system, this would be scoped by userId
    const achievements = await this.getAchievementsWithProgress(userId);
    const earnedAchievements = achievements.filter(a => a.isEarned);
    const streakInfo = await this.getStreakInfo(userId);
    const unreadCount = await this.getUnreadNotificationCount(userId);
    
    const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);
    
    // Determine tier based on points
    let currentTier = "Bronze";
    let nextTierProgress = 0;
    
    if (totalPoints >= 1000) {
      currentTier = "Platinum";
      nextTierProgress = 100;
    } else if (totalPoints >= 500) {
      currentTier = "Gold";
      nextTierProgress = ((totalPoints - 500) / 500) * 100;
    } else if (totalPoints >= 200) {
      currentTier = "Silver";
      nextTierProgress = ((totalPoints - 200) / 300) * 100;
    } else {
      nextTierProgress = (totalPoints / 200) * 100;
    }

    return {
      totalPoints,
      achievementsEarned: earnedAchievements.length,
      totalAchievements: achievements.length,
      currentTier,
      nextTierProgress: Math.round(nextTierProgress),
      streakInfo,
      recentAchievements: earnedAchievements
        .sort((a, b) => (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0))
        .slice(0, 5),
      unreadNotifications: unreadCount,
    };
  }

  async checkAndAwardAchievements(progressData: UserProgress): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const overallStats = await this.getOverallStats();
    const categoryStats = await this.getCategoryStats();
    const streakInfo = await this.getStreakInfo();
    const readiness = await this.getReadinessScore();
    const testAttempts = await this.getTestAttempts("anytime_test");
    
    // Check various achievement conditions
    const checks = [
      // Milestone achievements
      { key: "first_clue", condition: overallStats.totalQuestions >= 1 },
      { key: "getting_started", condition: overallStats.totalQuestions >= 5 && overallStats.overallAccuracy >= 50 },
      { key: "quiz_enthusiast", condition: overallStats.totalQuestions >= 25 },
      { key: "jeopardy_scholar", condition: overallStats.totalQuestions >= 100 },
      
      // Streak achievements  
      { key: "daily_habit", condition: streakInfo.dailyStreak >= 3 },
      { key: "week_warrior", condition: streakInfo.dailyStreak >= 7 },
      { key: "streak_master", condition: streakInfo.dailyStreak >= 30 },
      
      // Mastery achievements
      { key: "category_specialist", condition: categoryStats.some(c => c.accuracy >= 80 && c.totalQuestions >= 10) },
      { key: "well_rounded", condition: categoryStats.filter(c => c.totalQuestions >= 5).length >= 6 },
      
      // Test achievements
      { key: "test_taker", condition: testAttempts.length >= 1 },
      { key: "test_master", condition: testAttempts.some(t => (t.correctCount / t.totalQuestions) * 100 >= 80) },
      
      // Readiness achievements
      { key: "test_ready", condition: readiness.overallScore >= 70 },
      { key: "highly_prepared", condition: readiness.overallScore >= 80 },
      { key: "jeopardy_master", condition: readiness.overallScore >= 90 },
    ];

    for (const check of checks) {
      if (check.condition) {
        const result = await this.awardAchievement(check.key);
        if (result) {
          notifications.push(result.notification);
        }
      }
    }

    return notifications;
  }

  async evaluateAchievements(): Promise<void> {
    // This method can be called periodically to check all achievements
    // For now, it's implemented as part of checkAndAwardAchievements
    // but could be expanded for more complex evaluation logic
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}

import { DbStorage } from './db-storage';

// Feature flag: use database storage for production autoscale compatibility
// Set USE_DB_STORAGE=true to enable database-backed storage
const USE_DB_STORAGE = process.env.USE_DB_STORAGE === 'true' || process.env.NODE_ENV === 'production';

export const storage: IStorage = USE_DB_STORAGE 
  ? new DbStorage() 
  : new MemStorage();

console.log(`💾 Using ${USE_DB_STORAGE ? 'Database' : 'In-Memory'} Storage`);

