/**
 * Mastery and readiness calculation utilities
 */

/**
 * Calculate time decay weight for an answer given when it was answered.
 * Uses normalized exponential decay that reaches exactly 0% at 6 months (180 days):
 * Formula: (e^(-k*days) - e^(-k*180)) / (1 - e^(-k*180))
 * - Day 0: 100% weight
 * - Day 60 (2 months): ~33.5% weight  
 * - Day 120 (4 months): ~8.9% weight
 * - Day 180 (6 months): 0% weight
 * - Day 180+: 0% weight (answers older than 6 months contribute nothing)
 * 
 * The exponential curve encourages recent practice while ensuring answers
 * older than 6 months have zero contribution.
 * 
 * @param answeredAt - When the answer was given
 * @param now - Current time (defaults to now, can be overridden for testing)
 * @returns Weight from 0.0 to 1.0
 */
export function calculateTimeDecayWeight(answeredAt: Date, now: Date = new Date()): number {
  const daysSince = (now.getTime() - answeredAt.getTime()) / (1000 * 60 * 60 * 24);
  const maxDays = 180; // 6 months
  const k = 3 / 180; // Decay rate chosen so e^(-k*180) ≈ 0.05 (negligible)
  
  // Normalized exponential: shifts and scales to reach exactly 0 at maxDays
  const rawWeight = Math.exp(-k * daysSince);
  const minWeight = Math.exp(-k * maxDays);
  const normalizedWeight = (rawWeight - minWeight) / (1 - minWeight);
  
  // Clamp to [0, 1] to handle edge cases (future dates, very old answers)
  return Math.max(0, Math.min(1, normalizedWeight));
}

/**
 * Calculate weighted correct score for a category based on all answers.
 * Each correct answer contributes its time-decayed weight.
 * Score is normalized to 0-100 scale based on a target of 50 correct answers.
 * 
 * @param answers - Array of answer records with { correct: boolean, answeredAt: Date }
 * @param targetAnswers - Number of correct answers needed for mastery (default: 50)
 * @returns Score from 0 to 100
 */
export function calculateWeightedCorrectScore(
  answers: Array<{ correct: boolean; answeredAt: Date }>,
  targetAnswers: number = 50
): number {
  const now = new Date();
  let weightedCorrectSum = 0;
  
  for (const answer of answers) {
    if (answer.correct) {
      const weight = calculateTimeDecayWeight(answer.answeredAt, now);
      weightedCorrectSum += weight;
    }
  }
  
  // Normalize to 0-100 scale
  const score = (weightedCorrectSum / targetAnswers) * 100;
  return Math.min(100, Math.max(0, score));
}

/**
 * Determine mastery level based on weighted correct score.
 * - Novice: 0-20 points
 * - Intermediate: 20-40 points
 * - Advanced: 40-60 points
 * - Expert: 60-80 points
 * - Master: 80-100 points
 * 
 * @param weightedCorrectScore - Score from 0 to 100
 * @returns Mastery level
 */
export function determineMasteryLevel(
  weightedCorrectScore: number
): "novice" | "intermediate" | "advanced" | "expert" | "master" {
  if (weightedCorrectScore >= 80) return "master";
  if (weightedCorrectScore >= 60) return "expert";
  if (weightedCorrectScore >= 40) return "advanced";
  if (weightedCorrectScore >= 20) return "intermediate";
  return "novice";
}

/**
 * Calculate category mastery contribution to overall readiness.
 * Based on user requirements: requires ~50 correct answers per category with 80%+ accuracy.
 * 
 * @param categoryMasteryRecords - Array of user's category mastery records
 * @returns Score from 0 to 100
 */
export function calculateCategoryMasteryScore(
  categoryMasteryRecords: Array<{ weightedCorrectScore: number }>
): number {
  if (categoryMasteryRecords.length === 0) return 0;
  
  // Average the weighted scores across all categories
  const avgScore = categoryMasteryRecords.reduce(
    (sum, record) => sum + record.weightedCorrectScore,
    0
  ) / categoryMasteryRecords.length;
  
  return avgScore;
}

/**
 * Calculate category breadth score (how many categories the user has practiced).
 * Rewards practicing diverse categories.
 * 
 * @param totalCategories - Total available categories (24)
 * @param practiceCategories - Number of categories user has practiced
 * @returns Score from 0 to 100
 */
export function calculateBreadthScore(
  totalCategories: number,
  practicedCategories: number
): number {
  return (practicedCategories / totalCategories) * 100;
}

/**
 * Calculate overall readiness score.
 * Formula: 60% category mastery + 20% breadth + 20% Anytime Test performance
 * 
 * @param categoryMasteryScore - Category mastery score (0-100)
 * @param breadthScore - Category breadth score (0-100)
 * @param anytimeTestScore - Anytime Test performance score (0-100)
 * @returns Overall readiness score from 0 to 100
 */
export function calculateOverallReadiness(
  categoryMasteryScore: number,
  breadthScore: number,
  anytimeTestScore: number
): number {
  const score = (
    categoryMasteryScore * 0.60 +
    breadthScore * 0.20 +
    anytimeTestScore * 0.20
  );
  return Math.min(100, Math.max(0, score));
}
