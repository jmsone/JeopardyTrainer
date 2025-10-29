import { eq, and, desc, asc, gte, lte, inArray, sql, not } from 'drizzle-orm';
import { db } from './db';
import * as schema from '@shared/schema';
import type {
  Category,
  Question,
  UserProgress,
  SpacedRepetition,
  LearningMaterial,
  StudyMaterial,
  TestAttempt,
  Achievement,
  UserAchievement,
  Notification,
  UserGoals,
  CategoryMastery,
  InsertCategory,
  InsertQuestion,
  InsertUserProgress,
  InsertSpacedRepetition,
  InsertLearningMaterial,
  InsertStudyMaterial,
  InsertTestAttempt,
  InsertAchievement,
  InsertUserAchievement,
  InsertNotification,
  InsertUserGoals,
  QuestionWithCategory,
  QuestionWithLearning,
  StudyReview,
  CategoryStats,
  DailyStats,
  ReadinessScore,
  StreakInfo,
  AchievementWithProgress,
  GamificationStats,
  NotificationWithAction,
  UpsertUser,
  User
} from '@shared/schema';
import type { IStorage } from './storage';
import { openTDBClient } from './opentdb';
import { calculateWeightedCorrectScore, determineMasteryLevel } from './utils/mastery-calculations';

export class DbStorage implements IStorage {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Initialize achievements catalog on startup
    await this.initializeAchievements();
    
    // Check if we have questions in the database
    const existingQuestions = await db.select().from(schema.questions).limit(1);
    
    if (existingQuestions.length === 0) {
      console.log('🔄 No questions found in database, initializing game board...');
      await this.fetchFreshGameBoard();
    } else {
      console.log('✅ Questions already exist in database');
      this.initialized = true;
    }
  }

  // ==================== USER OPERATIONS ====================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [upserted] = await db
      .insert(schema.users)
      .values(user)
      .onConflictDoUpdate({
        target: schema.users.email,
        set: {
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  // ==================== CATEGORIES ====================
  
  async getCategories(): Promise<Category[]> {
    return await db.select().from(schema.categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(schema.categories).values(category).returning();
    return created;
  }

  // ==================== QUESTIONS ====================
  
  async getQuestions(): Promise<Question[]> {
    return await db.select().from(schema.questions);
  }

  async getQuestionsByCategory(categoryId: string): Promise<Question[]> {
    return await db.select().from(schema.questions).where(eq(schema.questions.categoryId, categoryId));
  }

  async getRandomQuestionsByCategory(categoryId: string, value: number): Promise<Question[]> {
    return await db
      .select()
      .from(schema.questions)
      .where(and(eq(schema.questions.categoryId, categoryId), eq(schema.questions.value, value)));
  }

  async getQuestion(id: string): Promise<QuestionWithCategory | undefined> {
    const result = await db
      .select({
        id: schema.questions.id,
        categoryId: schema.questions.categoryId,
        text: schema.questions.text,
        answer: schema.questions.answer,
        value: schema.questions.value,
        difficulty: schema.questions.difficulty,
        airDate: schema.questions.airDate,
        jServiceId: schema.questions.jServiceId,
        category: schema.categories,
      })
      .from(schema.questions)
      .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .where(eq(schema.questions.id, id))
      .limit(1);

    if (result.length === 0) return undefined;
    
    const { category, ...question } = result[0];
    return { ...question, category };
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [created] = await db.insert(schema.questions).values(question).returning();
    return created;
  }

  async getQuestionByValue(categoryId: string, value: number): Promise<QuestionWithCategory | undefined> {
    const result = await db
      .select({
        id: schema.questions.id,
        categoryId: schema.questions.categoryId,
        text: schema.questions.text,
        answer: schema.questions.answer,
        value: schema.questions.value,
        difficulty: schema.questions.difficulty,
        airDate: schema.questions.airDate,
        jServiceId: schema.questions.jServiceId,
        category: schema.categories,
      })
      .from(schema.questions)
      .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .where(and(eq(schema.questions.categoryId, categoryId), eq(schema.questions.value, value)))
      .limit(1);

    if (result.length === 0) return undefined;
    
    const { category, ...question } = result[0];
    return { ...question, category };
  }

  async getRapidFireQuestions(limit: number = 10, categoryIds?: string[]): Promise<QuestionWithCategory[]> {
    let query = db
      .select({
        id: schema.questions.id,
        categoryId: schema.questions.categoryId,
        text: schema.questions.text,
        answer: schema.questions.answer,
        value: schema.questions.value,
        difficulty: schema.questions.difficulty,
        airDate: schema.questions.airDate,
        jServiceId: schema.questions.jServiceId,
        category: schema.categories,
      })
      .from(schema.questions)
      .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    if (categoryIds && categoryIds.length > 0) {
      const results = await db
        .select({
          id: schema.questions.id,
          categoryId: schema.questions.categoryId,
          text: schema.questions.text,
          answer: schema.questions.answer,
          value: schema.questions.value,
          difficulty: schema.questions.difficulty,
          airDate: schema.questions.airDate,
          jServiceId: schema.questions.jServiceId,
          category: schema.categories,
        })
        .from(schema.questions)
        .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
        .where(inArray(schema.questions.categoryId, categoryIds))
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      return results.map(({ category, ...question }) => ({ ...question, category }));
    }

    const results = await query;
    return results.map(({ category, ...question }) => ({ ...question, category }));
  }

  async getAnsweredQuestions(userId?: string): Promise<{ questionId: string; assessment: "correct" | "incorrect" | "unsure" }[]> {
    if (!userId) return [];
    
    const results = await db
      .select({
        questionId: schema.userProgress.questionId,
        selfAssessment: schema.userProgress.selfAssessment,
      })
      .from(schema.userProgress)
      .where(and(
        eq(schema.userProgress.userId, userId),
        eq(schema.userProgress.mode, 'game')
      ));

    return results.map(r => ({
      questionId: r.questionId,
      assessment: r.selfAssessment
    }));
  }

  async clearProgress(userId?: string): Promise<void> {
    if (!userId) return;
    
    await db.transaction(async (tx) => {
      await tx.delete(schema.userProgress).where(eq(schema.userProgress.userId, userId));
      await tx.delete(schema.spacedRepetition).where(eq(schema.spacedRepetition.userId, userId));
    });
  }

  async resetGameBoard(userId?: string): Promise<void> {
    if (!userId) {
      // Full reset - clear all data and reload from API
      await db.transaction(async (tx) => {
        await tx.delete(schema.userProgress);
        await tx.delete(schema.spacedRepetition);
        await tx.delete(schema.questions);
        await tx.delete(schema.categories);
      });
      
      await this.fetchFreshGameBoard();
    } else {
      // User-specific reset - just clear their progress
      await db.transaction(async (tx) => {
        await tx.delete(schema.userProgress)
          .where(and(
            eq(schema.userProgress.userId, userId),
            eq(schema.userProgress.mode, 'game')
          ));
        await tx.delete(schema.spacedRepetition).where(eq(schema.spacedRepetition.userId, userId));
      });
    }
  }

  // ==================== USER PROGRESS ====================
  
  async getUserProgress(userId?: string): Promise<UserProgress[]> {
    if (!userId) return [];
    return await db.select().from(schema.userProgress).where(eq(schema.userProgress.userId, userId));
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [created] = await db.insert(schema.userProgress).values(progress).returning();
    return created;
  }

  async getUserProgressByCategory(categoryId: string, userId?: string): Promise<UserProgress[]> {
    if (!userId) return [];
    
    const results = await db
      .select({
        userProgress: schema.userProgress,
        question: schema.questions,
      })
      .from(schema.userProgress)
      .innerJoin(schema.questions, eq(schema.userProgress.questionId, schema.questions.id))
      .where(and(
        eq(schema.userProgress.userId, userId),
        eq(schema.questions.categoryId, categoryId)
      ));

    return results.map(r => r.userProgress);
  }

  // ==================== SPACED REPETITION ====================
  
  async getSpacedRepetitionData(): Promise<SpacedRepetition[]> {
    return await db.select().from(schema.spacedRepetition);
  }

  async getSpacedRepetitionForQuestion(questionId: string): Promise<SpacedRepetition | undefined> {
    const [result] = await db
      .select()
      .from(schema.spacedRepetition)
      .where(eq(schema.spacedRepetition.questionId, questionId))
      .limit(1);
    return result;
  }

  async createSpacedRepetition(data: InsertSpacedRepetition): Promise<SpacedRepetition> {
    const [created] = await db.insert(schema.spacedRepetition).values(data).returning();
    return created;
  }

  async updateSpacedRepetition(id: string, data: Partial<SpacedRepetition>): Promise<SpacedRepetition> {
    const [updated] = await db
      .update(schema.spacedRepetition)
      .set(data)
      .where(eq(schema.spacedRepetition.id, id))
      .returning();
    return updated;
  }

  async getQuestionsForReview(limit: number = 10): Promise<QuestionWithCategory[]> {
    const now = new Date();
    
    const results = await db
      .select({
        id: schema.questions.id,
        categoryId: schema.questions.categoryId,
        text: schema.questions.text,
        answer: schema.questions.answer,
        value: schema.questions.value,
        difficulty: schema.questions.difficulty,
        airDate: schema.questions.airDate,
        jServiceId: schema.questions.jServiceId,
        category: schema.categories,
      })
      .from(schema.spacedRepetition)
      .innerJoin(schema.questions, eq(schema.spacedRepetition.questionId, schema.questions.id))
      .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .where(lte(schema.spacedRepetition.nextReview, now))
      .orderBy(asc(schema.spacedRepetition.nextReview))
      .limit(limit);

    return results.map(({ category, ...question }) => ({ ...question, category }));
  }

  // ==================== GAME BOARD INITIALIZATION ====================
  
  async fetchFreshGameBoard(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization and store the promise
    this.initializationPromise = this._doFetchFreshGameBoard();
    
    try {
      await this.initializationPromise;
    } finally {
      // Clear the promise after completion (success or failure)
      this.initializationPromise = null;
    }
  }

  private async _doFetchFreshGameBoard(): Promise<void> {
    try {
      console.log('🎯 Fetching fresh game board from Open Trivia DB...');
      
      // Define all 24 Open Trivia DB categories
      const allCategories = [
        { id: 9, name: 'General Knowledge' },
        { id: 10, name: 'Entertainment: Books' },
        { id: 11, name: 'Entertainment: Film' },
        { id: 12, name: 'Entertainment: Music' },
        { id: 13, name: 'Entertainment: Musicals & Theatres' },
        { id: 14, name: 'Entertainment: Television' },
        { id: 15, name: 'Entertainment: Video Games' },
        { id: 16, name: 'Entertainment: Board Games' },
        { id: 17, name: 'Science & Nature' },
        { id: 18, name: 'Science: Computers' },
        { id: 19, name: 'Science: Mathematics' },
        { id: 20, name: 'Mythology' },
        { id: 21, name: 'Sports' },
        { id: 22, name: 'Geography' },
        { id: 23, name: 'History' },
        { id: 24, name: 'Politics' },
        { id: 25, name: 'Art' },
        { id: 26, name: 'Celebrities' },
        { id: 27, name: 'Animals' },
        { id: 28, name: 'Vehicles' },
        { id: 29, name: 'Entertainment: Comics' },
        { id: 30, name: 'Science: Gadgets' },
        { id: 31, name: 'Entertainment: Japanese Anime & Manga' },
        { id: 32, name: 'Entertainment: Cartoon & Animations' }
      ];
      
      // Fisher-Yates shuffle for unbiased randomization
      const shuffled = [...allCategories];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Fetch and select questions for each category with retry logic
      const selectedByCategory: Array<{ categoryName: string; questions: any[] }> = [];
      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
      const maxAttempts = 18; // Try up to 18 categories to get 6 successful ones
      let attemptedCount = 0;
      
      for (const cat of shuffled) {
        if (selectedByCategory.length >= 6) break; // Got enough categories
        if (attemptedCount >= maxAttempts) break; // Prevent infinite loop
        attemptedCount++;
        
        try {
          // Fetch 12 questions from this category
          const questions = await openTDBClient.getQuestionsByCategory(cat.id, 12);
          console.log(`   📚 Fetched ${questions.length} Jeopardy-suitable questions from ${cat.name}`);
          
          if (questions.length < 5) {
            console.warn(`   ⚠️  Not enough questions for ${cat.name}, trying next category...`);
            continue;
          }
          
          // Sort WITHIN this category by difficulty: easy → medium → hard
          const sortedQuestions = [...questions].sort((a, b) => {
            const orderA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2;
            const orderB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2;
            return orderA - orderB;
          });
          
          // Select 5 questions spanning difficulty range:
          // - Positions 0-1: Easy questions → $200, $400
          // - Position 2: Medium question → $600
          // - Positions 3-4: Harder questions → $800, $1000
          const selected = [
            sortedQuestions[0],  // Easiest → $200
            sortedQuestions[1],  // Easy → $400
            sortedQuestions[Math.floor(sortedQuestions.length / 2)],  // Middle → $600
            sortedQuestions[sortedQuestions.length - 2] || sortedQuestions[sortedQuestions.length - 1],  // Hard → $800
            sortedQuestions[sortedQuestions.length - 1]  // Hardest → $1000
          ];
          
          selectedByCategory.push({ categoryName: cat.name, questions: selected });
          console.log(`   ✅ Selected 5 questions for ${cat.name}: ${selected.filter(q => q.difficulty === 'easy').length} easy, ${selected.filter(q => q.difficulty === 'medium').length} medium, ${selected.filter(q => q.difficulty === 'hard').length} hard`);
          
        } catch (error) {
          console.warn(`   ⚠️  Failed to fetch ${cat.name}, trying next category...`);
        }
      }
      
      // Ensure we have enough categories
      if (selectedByCategory.length < 6) {
        throw new Error(`Insufficient categories: got ${selectedByCategory.length}, need 6. Tried ${attemptedCount} categories.`);
      }
      
      console.log(`🎲 Final board categories: ${selectedByCategory.map(c => c.categoryName).join(', ')}`);
      
      console.log(`📝 Successfully prepared ${selectedByCategory.length} categories with proper difficulty distribution`);
      
      const values = [200, 400, 600, 800, 1000];
      
      // Use transaction to ensure atomic operation
      await db.transaction(async (tx) => {
        // Clear existing data
        await tx.delete(schema.spacedRepetition);
        await tx.delete(schema.questions);
        await tx.delete(schema.categories);
        
        // Assign questions to categories and values
        for (const catData of selectedByCategory) {
          // Create category
          const [category] = await tx.insert(schema.categories).values({
            name: catData.categoryName,
            weight: 1.0
          }).returning();
          
          console.log(`   ✅ Created category: ${catData.categoryName}`);
          
          // Assign the 5 selected questions to this category
          // They're already sorted: 2 easy, 1 medium, 2 hard
          for (let i = 0; i < 5 && i < catData.questions.length; i++) {
            const tq = catData.questions[i];
            const converted = openTDBClient.convertQuestion(tq);
            const assignedValue = values[i];  // $200, $400, $600, $800, $1000
            
            const [question] = await tx.insert(schema.questions).values({
              categoryId: category.id,
              text: converted.text,
              answer: converted.answer,
              value: assignedValue,
              difficulty: Math.ceil(assignedValue / 200),
              airDate: null,
              jServiceId: null
            }).returning();
            
            // Initialize spaced repetition data for system
            await tx.insert(schema.spacedRepetition).values({
              userId: "system",
              questionId: question.id,
              easeFactor: 2.5,
              interval: 1,
              repetitions: 0,
              nextReview: new Date(),
              lastReviewed: null,
            });
          }
        }
      });
      
      const totalQuestions = await db.select().from(schema.questions);
      const totalCategories = await db.select().from(schema.categories);
      console.log(`✨ Game board initialized with ${totalQuestions.length} questions from ${totalCategories.length} categories`);
      
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

  // ==================== STUB METHODS (To be implemented) ====================
  
  async getLearningMaterial(questionId: string): Promise<LearningMaterial | undefined> {
    const [result] = await db.select().from(schema.learningMaterials).where(eq(schema.learningMaterials.questionId, questionId)).limit(1);
    return result;
  }

  async createLearningMaterial(material: InsertLearningMaterial): Promise<LearningMaterial> {
    const [created] = await db.insert(schema.learningMaterials).values(material).returning();
    return created;
  }

  async getStudyReview(): Promise<StudyReview> {
    // Stub implementation
    return {
      correct: [],
      incorrect: [],
      unsure: []
    };
  }

  async getStudyMaterials(): Promise<StudyMaterial[]> {
    return await db.select().from(schema.studyMaterials);
  }

  async getStudyMaterialsByCategory(category: string): Promise<StudyMaterial[]> {
    return await db.select().from(schema.studyMaterials).where(eq(schema.studyMaterials.category, category));
  }

  async createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial> {
    const [created] = await db.insert(schema.studyMaterials).values(material).returning();
    return created;
  }

  async createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt> {
    const [created] = await db.insert(schema.testAttempts).values(attempt).returning();
    return created;
  }

  async getTestAttempts(mode?: "anytime_test"): Promise<TestAttempt[]> {
    if (mode) {
      return await db.select().from(schema.testAttempts).where(eq(schema.testAttempts.mode, mode));
    }
    return await db.select().from(schema.testAttempts);
  }

  async getAnytimeTestSet(userId?: string): Promise<QuestionWithCategory[]> {
    // Return 50 random questions not answered in "anytime_test" mode
    const answeredInTest = userId ? await db
      .select({ questionId: schema.userProgress.questionId })
      .from(schema.userProgress)
      .where(and(
        eq(schema.userProgress.userId, userId),
        eq(schema.userProgress.mode, 'anytime_test')
      )) : [];

    const answeredIds = answeredInTest.map(a => a.questionId);

    let query = db
      .select({
        id: schema.questions.id,
        categoryId: schema.questions.categoryId,
        text: schema.questions.text,
        answer: schema.questions.answer,
        value: schema.questions.value,
        difficulty: schema.questions.difficulty,
        airDate: schema.questions.airDate,
        jServiceId: schema.questions.jServiceId,
        category: schema.categories,
      })
      .from(schema.questions)
      .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .orderBy(sql`RANDOM()`)
      .limit(50);

    if (answeredIds.length > 0) {
      const results = await db
        .select({
          id: schema.questions.id,
          categoryId: schema.questions.categoryId,
          text: schema.questions.text,
          answer: schema.questions.answer,
          value: schema.questions.value,
          difficulty: schema.questions.difficulty,
          airDate: schema.questions.airDate,
          jServiceId: schema.questions.jServiceId,
          category: schema.categories,
        })
        .from(schema.questions)
        .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
        .where(not(inArray(schema.questions.id, answeredIds)))
        .orderBy(sql`RANDOM()`)
        .limit(50);

      return results.map(({ category, ...question }) => ({ ...question, category }));
    }

    const results = await query;
    return results.map(({ category, ...question }) => ({ ...question, category }));
  }

  async getReadinessScore(): Promise<ReadinessScore> {
    // Stub implementation
    return {
      overallScore: 0,
      letterGrade: 'F',
      components: [],
      categoryBreadth: {
        coveredCategories: 0,
        totalCategories: 0,
        requiredCategories: 0,
        breadthFactor: 0
      },
      categoryCoverage: [],
      weakCategories: [],
      testReady: false,
      lastUpdated: new Date()
    };
  }

  async getCategoryStats(userId?: string): Promise<CategoryStats[]> {
    if (!userId) return [];
    
    const stats = await db
      .select({
        categoryId: schema.questions.categoryId,
        categoryName: schema.categories.name,
        totalQuestions: sql<number>`count(distinct ${schema.userProgress.questionId})`,
        correctCount: sql<number>`sum(case when ${schema.userProgress.selfAssessment} = 'correct' then 1 else 0 end)`,
      })
      .from(schema.userProgress)
      .innerJoin(schema.questions, eq(schema.userProgress.questionId, schema.questions.id))
      .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .where(eq(schema.userProgress.userId, userId))
      .groupBy(schema.questions.categoryId, schema.categories.name);

    return stats.map(s => ({
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      totalQuestions: Number(s.totalQuestions),
      correctAnswers: Number(s.correctCount),
      accuracy: s.totalQuestions > 0 ? (Number(s.correctCount) / Number(s.totalQuestions)) * 100 : 0,
      averageTime: 0
    }));
  }

  async getDailyStats(days: number, userId?: string): Promise<DailyStats[]> {
    if (!userId) return [];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db
      .select({
        date: sql<string>`date(${schema.userProgress.answeredAt})`,
        totalQuestions: sql<number>`count(*)`,
        correctCount: sql<number>`sum(case when ${schema.userProgress.selfAssessment} = 'correct' then 1 else 0 end)`,
      })
      .from(schema.userProgress)
      .where(and(
        eq(schema.userProgress.userId, userId),
        gte(schema.userProgress.answeredAt, startDate)
      ))
      .groupBy(sql`date(${schema.userProgress.answeredAt})`);

    return stats.map(s => ({
      date: s.date,
      questionsAnswered: Number(s.totalQuestions),
      correctAnswers: Number(s.correctCount),
      accuracy: s.totalQuestions > 0 ? (Number(s.correctCount) / Number(s.totalQuestions)) * 100 : 0,
      studyTime: 0
    }));
  }

  async getOverallStats(userId?: string): Promise<{
    totalQuestions: number;
    overallAccuracy: number;
    currentStreak: number;
    totalStudyTime: number;
  }> {
    if (!userId) {
      return {
        totalQuestions: 0,
        overallAccuracy: 0,
        currentStreak: 0,
        totalStudyTime: 0
      };
    }

    const [stats] = await db
      .select({
        totalQuestions: sql<number>`count(*)`,
        correctCount: sql<number>`sum(case when ${schema.userProgress.selfAssessment} = 'correct' then 1 else 0 end)`,
      })
      .from(schema.userProgress)
      .where(eq(schema.userProgress.userId, userId));

    const totalQuestions = Number(stats?.totalQuestions || 0);
    const correctCount = Number(stats?.correctCount || 0);

    return {
      totalQuestions,
      overallAccuracy: totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0,
      currentStreak: 0,
      totalStudyTime: 0
    };
  }

  // ==================== ACHIEVEMENTS (Stub implementations) ====================
  
  private async initializeAchievements() {
    const achievementData: InsertAchievement[] = [
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
    ];

    for (const achievement of achievementData) {
      await db
        .insert(schema.achievements)
        .values(achievement)
        .onConflictDoUpdate({
          target: schema.achievements.key,
          set: achievement
        });
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(schema.achievements);
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [created] = await db.insert(schema.achievements).values(achievement).returning();
    return created;
  }

  async getUserAchievements(userId?: string): Promise<UserAchievement[]> {
    if (!userId) return [];
    return await db.select().from(schema.userAchievements).where(eq(schema.userAchievements.userId, userId));
  }

  async getUserAchievementByKey(key: string, userId?: string): Promise<UserAchievement | undefined> {
    if (!userId) return undefined;
    const [result] = await db
      .select()
      .from(schema.userAchievements)
      .where(and(
        eq(schema.userAchievements.userId, userId),
        eq(schema.userAchievements.achievementKey, key)
      ))
      .limit(1);
    return result;
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [created] = await db.insert(schema.userAchievements).values(userAchievement).returning();
    return created;
  }

  async updateUserAchievement(id: string, data: Partial<UserAchievement>): Promise<UserAchievement> {
    const [updated] = await db
      .update(schema.userAchievements)
      .set(data)
      .where(eq(schema.userAchievements.id, id))
      .returning();
    return updated;
  }

  async getAchievementsWithProgress(userId?: string): Promise<AchievementWithProgress[]> {
    // Stub implementation
    const achievements = await this.getAchievements();
    return achievements.map(a => ({
      ...a,
      progress: 0,
      maxProgress: 1,
      isEarned: false,
      earnedAt: undefined,
      progressPercent: 0
    }));
  }

  async awardAchievement(achievementKey: string, progress?: number, userId?: string): Promise<{ achievement: Achievement; notification: Notification } | null> {
    // Stub implementation
    return null;
  }

  async getNotifications(unreadOnly?: boolean, userId?: string): Promise<NotificationWithAction[]> {
    if (!userId) return [];
    
    let query = db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));

    if (unreadOnly) {
      const results = await db
        .select()
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        ))
        .orderBy(desc(schema.notifications.createdAt));

      return results.map(n => ({ 
        ...n, 
        timeAgo: this.formatTimeAgo(n.createdAt),
        canDismiss: true
      }));
    }

    const results = await query;
    return results.map(n => ({ 
      ...n, 
      timeAgo: this.formatTimeAgo(n.createdAt),
      canDismiss: true
    }));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(schema.notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string, userId?: string): Promise<void> {
    if (!userId) return;
    
    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, userId)
      ));
  }

  async getUnreadNotificationCount(userId?: string): Promise<number> {
    if (!userId) return 0;
    
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      ));

    return Number(result?.count || 0);
  }

  async getUserGoals(userId?: string): Promise<UserGoals> {
    if (!userId) {
      return {
        id: '',
        userId: '',
        dailyQuestionGoal: 10,
        weeklyStreakGoal: 7,
        remindersEnabled: false,
        reminderHour: 19,
        quietHoursStart: 22,
        quietHoursEnd: 8,
        updatedAt: new Date()
      };
    }

    const [result] = await db
      .select()
      .from(schema.userGoals)
      .where(eq(schema.userGoals.userId, userId))
      .limit(1);

    if (!result) {
      // Create default goals
      const [created] = await db
        .insert(schema.userGoals)
        .values({
          userId,
          dailyQuestionGoal: 10,
          weeklyStreakGoal: 7,
          remindersEnabled: false,
          reminderHour: 19,
          quietHoursStart: 22,
          quietHoursEnd: 8
        })
        .returning();
      return created;
    }

    return result;
  }

  async updateUserGoals(goals: Partial<InsertUserGoals>, userId?: string): Promise<UserGoals> {
    if (!userId) {
      throw new Error('User ID required');
    }

    const [updated] = await db
      .update(schema.userGoals)
      .set({ ...goals, updatedAt: new Date() })
      .where(eq(schema.userGoals.userId, userId))
      .returning();

    return updated;
  }

  async getStreakInfo(userId?: string): Promise<StreakInfo> {
    // Stub implementation
    return {
      dailyStreak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,
      longestDailyStreak: 0,
      lastActiveDate: new Date().toISOString(),
      todayComplete: false,
      questionsToday: 0,
      goalProgress: 0
    };
  }

  async getGamificationStats(userId?: string): Promise<GamificationStats> {
    // Stub implementation
    const streakInfo = await this.getStreakInfo(userId);
    return {
      totalPoints: 0,
      achievementsEarned: 0,
      totalAchievements: 0,
      currentTier: 'bronze',
      nextTierProgress: 0,
      streakInfo,
      recentAchievements: [],
      unreadNotifications: 0
    };
  }

  async checkAndAwardAchievements(progressData: UserProgress): Promise<Notification[]> {
    // Stub implementation
    return [];
  }

  async evaluateAchievements(): Promise<void> {
    // Stub implementation
  }

  // ==================== CATEGORY MASTERY ====================
  
  async getCategoryMasteryRecords(userId?: string): Promise<CategoryMastery[]> {
    if (!userId) return [];
    
    return await db
      .select()
      .from(schema.categoryMastery)
      .where(eq(schema.categoryMastery.userId, userId));
  }

  async updateCategoryMastery(
    userId: string,
    categoryName: string,
    isCorrect: boolean,
    answeredAt: Date
  ): Promise<CategoryMastery> {
    // Find existing record
    const [existing] = await db
      .select()
      .from(schema.categoryMastery)
      .where(and(
        eq(schema.categoryMastery.userId, userId),
        eq(schema.categoryMastery.categoryName, categoryName)
      ))
      .limit(1);
    
    if (!existing) {
      // Create new record
      const [created] = await db
        .insert(schema.categoryMastery)
        .values({
          userId,
          categoryName,
          totalCorrect: isCorrect ? 1 : 0,
          totalAnswered: 1,
          weightedCorrectScore: 0,
          lastAnswered: answeredAt,
          masteryLevel: 'novice'
        })
        .returning();
      
      // Recalculate weighted score
      return await this.recalculateCategoryMastery(created.id, userId, categoryName);
    }
    
    // Update existing record
    const [updated] = await db
      .update(schema.categoryMastery)
      .set({
        totalAnswered: existing.totalAnswered + 1,
        totalCorrect: existing.totalCorrect + (isCorrect ? 1 : 0),
        lastAnswered: answeredAt,
        updatedAt: new Date()
      })
      .where(eq(schema.categoryMastery.id, existing.id))
      .returning();
    
    // Recalculate weighted score
    return await this.recalculateCategoryMastery(updated.id, userId, categoryName);
  }

  private async recalculateCategoryMastery(
    recordId: string,
    userId: string,
    categoryName: string
  ): Promise<CategoryMastery> {
    // Get the current mastery record to access counts
    const [currentRecord] = await db
      .select()
      .from(schema.categoryMastery)
      .where(eq(schema.categoryMastery.id, recordId))
      .limit(1);
    
    if (!currentRecord) {
      throw new Error('Category mastery record not found');
    }
    
    // Get all answers for this category
    const categoryAnswers = await db
      .select({
        correct: schema.userProgress.correct,
        answeredAt: schema.userProgress.answeredAt
      })
      .from(schema.userProgress)
      .innerJoin(schema.questions, eq(schema.userProgress.questionId, schema.questions.id))
      .innerJoin(schema.categories, eq(schema.questions.categoryId, schema.categories.id))
      .where(and(
        eq(schema.userProgress.userId, userId),
        eq(schema.categories.name, categoryName)
      ));
    
    // Calculate weighted score using time decay
    // Use the authoritative 'correct' field, not selfAssessment
    let weightedScore = 0;
    if (categoryAnswers.length > 0) {
      weightedScore = calculateWeightedCorrectScore(
        categoryAnswers.map(a => ({
          correct: a.correct,
          answeredAt: a.answeredAt
        }))
      );
    } else if (currentRecord.totalAnswered > 0) {
      // Fallback: If query returned no answers but we have counts,
      // calculate a simple score based on accuracy
      const accuracy = currentRecord.totalCorrect / currentRecord.totalAnswered;
      weightedScore = accuracy * 100;
      console.warn(`⚠️  Category mastery recalculation found no answers for ${categoryName}, using fallback score: ${weightedScore}`);
    }
    
    // Determine mastery level
    const masteryLevel = determineMasteryLevel(weightedScore);
    
    // Update the record
    const [updated] = await db
      .update(schema.categoryMastery)
      .set({
        weightedCorrectScore: weightedScore,
        masteryLevel: masteryLevel,
        updatedAt: new Date()
      })
      .where(eq(schema.categoryMastery.id, recordId))
      .returning();
    
    return updated;
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
