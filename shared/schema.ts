import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  weight: real("weight").notNull().default(1.0), // Higher weight = more likely to appear
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  text: text("text").notNull(),
  answer: text("answer").notNull(),
  value: integer("value").notNull(), // Dollar value ($200, $400, etc.)
  difficulty: integer("difficulty").notNull().default(1), // 1-5 scale
  airDate: text("air_date"), // When the question originally aired on Jeopardy
  jServiceId: integer("j_service_id"), // Original ID from jService API
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  correct: boolean("correct").notNull(),
  userAnswer: text("user_answer"),
  timeSpent: integer("time_spent"), // in seconds
  selfAssessment: varchar("self_assessment", { enum: ["correct", "incorrect", "unsure"] }).notNull().default("unsure"),
  mode: varchar("mode", { enum: ["game", "rapid_fire", "anytime_test"] }).notNull().default("game"),
  sessionId: varchar("session_id"), // Groups related questions (e.g., a single test attempt)
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

export const spacedRepetition = pgTable("spaced_repetition", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1), // days
  repetitions: integer("repetitions").notNull().default(0),
  nextReview: timestamp("next_review").notNull().defaultNow(),
  lastReviewed: timestamp("last_reviewed"),
});

export const testAttempts = pgTable("test_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  mode: varchar("mode", { enum: ["anytime_test"] }).notNull(),
  correctCount: integer("correct_count").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at").notNull().defaultNow(),
});

export const learningMaterials = pgTable("learning_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => questions.id),
  explanation: text("explanation").notNull(),
  sources: text("sources").array().notNull(), // JSON array of source URLs
  relatedFacts: text("related_facts").array().notNull(), // Additional trivia facts
  commonness: varchar("commonness", { enum: ["very_common", "common", "uncommon", "rare"] }).notNull().default("common"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const studyMaterials = pgTable("study_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sources: text("sources").array().notNull(),
  relatedTopics: text("related_topics").array().notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  answeredAt: true,
}).extend({
  selfAssessment: z.enum(["correct", "incorrect", "unsure"]).optional(),
  mode: z.enum(["game", "rapid_fire", "anytime_test"]).optional(),
});

export const insertSpacedRepetitionSchema = createInsertSchema(spacedRepetition).omit({
  id: true,
});

export const insertLearningMaterialSchema = createInsertSchema(learningMaterials).omit({
  id: true,
  generatedAt: true,
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials).omit({
  id: true,
  generatedAt: true,
});

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({
  id: true,
  finishedAt: true,
});

export type Category = typeof categories.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type SpacedRepetition = typeof spacedRepetition.$inferSelect;
export type LearningMaterial = typeof learningMaterials.$inferSelect;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type TestAttempt = typeof testAttempts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertSpacedRepetition = z.infer<typeof insertSpacedRepetitionSchema>;
export type InsertLearningMaterial = z.infer<typeof insertLearningMaterialSchema>;
export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;

// Extended types for API responses
export type QuestionWithCategory = Question & {
  category: Category;
};

export type QuestionWithLearning = QuestionWithCategory & {
  learningMaterial?: LearningMaterial;
};

export type StudyReview = {
  correct: QuestionWithLearning[];
  incorrect: QuestionWithLearning[];
  unsure: QuestionWithLearning[];
};

export type CategoryStats = {
  categoryId: string;
  categoryName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
};

export type DailyStats = {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  studyTime: number;
};

// Readiness scoring types
export type ReadinessComponent = {
  name: string;
  score: number;
  weight: number;
  description: string;
};

export type CategoryCoverage = {
  categoryId: string;
  categoryName: string;
  accuracy: number;
  recentQuestions: number;
  weight: number;
  covered: boolean;
};

export type ReadinessScore = {
  overallScore: number;
  letterGrade: "A" | "B" | "C" | "D" | "F";
  components: ReadinessComponent[];
  categoryBreadth: {
    coveredCategories: number;
    totalCategories: number;
    requiredCategories: number;
    breadthFactor: number;
  };
  categoryCoverage: CategoryCoverage[];
  weakCategories: CategoryCoverage[];
  testReady: boolean;
  lastUpdated: Date;
};
