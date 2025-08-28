export interface SpacedRepetitionCard {
  id: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
  lastReviewed?: Date;
}

export interface ReviewResult {
  quality: number; // 0-5 scale (0 = complete blackout, 5 = perfect response)
}

/**
 * SuperMemo SM-2 Algorithm Implementation
 * 
 * @param card - Current spaced repetition data
 * @param result - Review result with quality rating
 * @returns Updated spaced repetition data
 */
export function updateSpacedRepetition(
  card: SpacedRepetitionCard,
  result: ReviewResult
): SpacedRepetitionCard {
  const { quality } = result;
  let { easeFactor, interval, repetitions } = card;

  // If quality < 3, restart the card
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    
    // Calculate new interval
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ensure ease factor doesn't go below 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReviewed: new Date(),
  };
}

/**
 * Convert answer correctness to quality score
 * 
 * @param correct - Whether the answer was correct
 * @param timeSpent - Time taken to answer (in seconds)
 * @param timeLimit - Maximum time allowed (in seconds)
 * @returns Quality score (0-5)
 */
export function calculateQuality(
  correct: boolean,
  timeSpent: number,
  timeLimit: number = 30
): number {
  if (!correct) {
    return timeSpent > timeLimit ? 0 : 1; // Complete failure or hesitant failure
  }

  // For correct answers, factor in response time
  const timeRatio = timeSpent / timeLimit;
  
  if (timeRatio <= 0.3) return 5; // Perfect response (< 30% of time)
  if (timeRatio <= 0.5) return 4; // Good response (< 50% of time)
  if (timeRatio <= 0.8) return 3; // Acceptable response (< 80% of time)
  return 3; // Slow but correct response
}

/**
 * Get cards due for review
 * 
 * @param cards - All spaced repetition cards
 * @param limit - Maximum number of cards to return
 * @returns Cards due for review, sorted by priority
 */
export function getCardsForReview(
  cards: SpacedRepetitionCard[],
  limit: number = 20
): SpacedRepetitionCard[] {
  const now = new Date();
  
  return cards
    .filter(card => card.nextReview <= now)
    .sort((a, b) => {
      // Prioritize by overdue time and difficulty (lower ease factor = more difficult)
      const aOverdue = now.getTime() - a.nextReview.getTime();
      const bOverdue = now.getTime() - b.nextReview.getTime();
      const aDifficulty = 1 / a.easeFactor;
      const bDifficulty = 1 / b.easeFactor;
      
      // Combine overdue time and difficulty for priority scoring
      const aScore = aOverdue + (aDifficulty * 1000000); // Weight difficulty heavily
      const bScore = bOverdue + (bDifficulty * 1000000);
      
      return bScore - aScore; // Descending order (highest priority first)
    })
    .slice(0, limit);
}

/**
 * Calculate study statistics
 * 
 * @param cards - All spaced repetition cards
 * @returns Study statistics
 */
export function getStudyStats(cards: SpacedRepetitionCard[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const dueToday = cards.filter(card => card.nextReview <= tomorrow).length;
  const dueTomorrow = cards.filter(card => 
    card.nextReview > tomorrow && card.nextReview <= new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
  ).length;
  const dueThisWeek = cards.filter(card => 
    card.nextReview > tomorrow && card.nextReview <= nextWeek
  ).length;

  return {
    dueToday,
    dueTomorrow,
    dueThisWeek,
    totalCards: cards.length,
  };
}
