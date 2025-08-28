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
});

export const insertSpacedRepetitionSchema = createInsertSchema(spacedRepetition).omit({
  id: true,
});

export type Category = typeof categories.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type SpacedRepetition = typeof spacedRepetition.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertSpacedRepetition = z.infer<typeof insertSpacedRepetitionSchema>;

// Extended types for API responses
export type QuestionWithCategory = Question & {
  category: Category;
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
