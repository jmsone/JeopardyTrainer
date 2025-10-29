# The Daily Double Down

## Project Overview
A comprehensive trivia training application featuring optional Google login authentication via Replit Auth, spaced repetition learning, dynamic question data, sophisticated gamification, and comprehensive performance tracking. Users can access the game board immediately without login, with optional authentication for progress tracking and advanced features.

## Core Features
- Dynamic trivia questions from Open Trivia Database API
- Spaced repetition learning algorithm based on scientific principles
- Category performance tracking and improvement analytics
- Jeopardy-style dollar value system (200-1000)
- Mobile-first responsive design

## User Preferences
- Focus on accuracy and authenticity of questions/answers
- Importance of appropriate difficulty matching dollar values
- Scientific approach to spaced repetition learning
- Performance improvement tracking emphasis

## Technical Architecture
- Frontend: React with Vite, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express.js with TypeScript
- Database: PostgreSQL (Neon) with Drizzle ORM
- Storage: Dual implementation (MemStorage for dev, DbStorage for production)
  - Feature flag: `USE_DB_STORAGE=true` or `NODE_ENV=production` enables database storage
  - Questions stored globally in database, shared across all users
  - User progress, achievements, and spaced repetition data scoped per user
- Data Sources: Open Trivia Database API (opentdb.com)
- Algorithms: Spaced repetition (SM-2 or similar)

## Data Quality Measures
- Questions sourced from Open Trivia Database
- HTML entity decoding for clean display
- **Global difficulty sorting** - All 50 questions sorted by difficulty, first 30 distributed across board
- Dollar value assignment guarantees easy questions at $200, hard at $1000
- Category diversity in question selection

## Recent Changes
- **✅ CRITICAL: Fixed OAuth authentication for production** - Replaced static domain-based strategy registration with dynamic on-demand registration using `ensureStrategy()` helper. OAuth strategies now register automatically for any domain (dev/production/custom) at runtime, fixing "invalid_grant" errors. Enabled session table auto-creation (`createTableIfMissing: true`) to prevent session storage failures in production. Authentication now works seamlessly across all environments. (2025-10-29)
- **✅ CRITICAL: Fixed production deployment failures** - DbStorage was missing `getCategoryMasteryRecords` and `updateCategoryMastery` methods added for mastery-based readiness system, causing service unavailable errors in production. Implemented both methods with database queries and added fallback protection for timing edge cases. Production deployments now fully functional. (2025-10-29)
- **✅ Optional authentication system** - Removed login gate to allow anonymous users immediate access to game board. Created `optionalAuth` middleware and updated 20+ routes to work without authentication. Anonymous users can play questions but don't get progress tracking. Authenticated users get full features (stats, achievements, notifications, progress persistence). Header shows "Sign In" button for anonymous users, user profile dropdown for authenticated users. Testing confirmed both flows work correctly. (2025-10-29)
- **✅ Category diversity system** - Implemented topic grouping and diversity quotas to prevent 5 Entertainment + 1 other category boards. Categories now grouped into Entertainment (10 subcategories), Science (4 subcategories), and General (10 topics). Selection enforces max 2 Entertainment, max 1 Science, ensuring 3-4 categories from diverse General topics like History, Geography, Sports, Mythology, Art, Animals, etc. Testing confirmed reduction from 5/6 Entertainment to 2/6, with broad topic coverage. (2025-10-29)
- **✅ Enhanced Jeopardy-style question filtering** - Expanded isJeopardySuitable() to filter out ordering/listing questions that require multiple choice options: "list the following", "order the following", "arrange/sort/rank the following", "put the following in order", "the following in chronological order". Prevents questions like "List the following Iranic empires in chronological order" which are unanswerable as standalone clues. (2025-10-29)
- **✅ CRITICAL: Fixed ES module import bug** - Replaced CommonJS `require()` calls with ES6 `import` statements in server/storage.ts mastery calculation functions. Previous code caused "ReferenceError: require is not defined" preventing category mastery from being saved. Fix validated with full e2e testing (4 questions answered, category mastery tracking confirmed, readiness calculation working). (2025-10-29)
- **✅ CRITICAL: Mastery-based readiness system** - Complete overhaul of readiness calculation from old formula (60% Anytime Test + 25% Game Mode + 15% Spaced Repetition) to new category mastery system (60% Category Mastery + 20% Breadth + 20% Anytime Test). Requires ~50 time-weighted correct answers per category for mastery. (2025-10-29)
- **✅ CategoryMastery data model** - Added database table tracking per-category statistics: totalCorrect, totalAnswered, weightedCorrectScore (time-decayed 0-100 scale), masteryLevel (novice/intermediate/advanced/expert/master), lastAnswered. Updates after each answer to maintain accurate category performance metrics. (2025-10-29)
- **✅ Time decay algorithm** - Implemented normalized exponential decay function reaching exactly 0% at 6 months (180 days). Formula: (e^(-k*days) - e^(-k*180)) / (1 - e^(-k*180)) where k=3/180. Ensures old answers don't contribute to mastery while providing smooth exponential curve. (2025-10-29)
- **✅ Random category selection** - Game board now randomly selects 6 categories from all 24 Open Trivia DB categories each time board regenerates. Uses Fisher-Yates shuffle with retry logic (max 18 attempts) to ensure 6 successful categories with ≥5 questions each. Provides better variety and long-term engagement. (2025-10-29)
- **✅ CRITICAL: Fixed category-question mismatch bug** - Questions now sorted and selected WITHIN each category (not globally). Each category gets: 2 easy ($200/$400), 1 medium ($600), 2 hard ($800/$1000) questions from its own pool. Geography column now contains only geography questions, History only history, etc. (2025-10-29)
- **✅ CRITICAL: Fixed initialization race condition** - Added promise-based locking mechanism to prevent concurrent `fetchFreshGameBoard()` calls in both MemStorage and DbStorage. Previously, simultaneous requests to `/api/categories` and `/api/questions` on app load triggered 3+ concurrent API fetches, causing HTTP 429 rate limits and 35+ second load times. Now only one initialization occurs, reducing load time to ~5-8 seconds. (2025-10-28)
- **✅ PostgreSQL storage migration complete** - Implemented database-backed storage (DbStorage) to fix autoscale 404 errors. Feature flag automatically enables database storage in production (NODE_ENV=production) while keeping in-memory for development. Questions now persist across server instances. (2025-10-14)
- **✅ Jeopardy-suitable question filtering** - Filters out true/false and "which of the following" style questions. Only uses questions that work as standalone Jeopardy clues without requiring multiple choice options. (2025-10-08)
- **✅ Diverse category implementation** - Now fetches from 6 predefined categories (General Knowledge, History, Geography, Science & Nature, Sports, Art) instead of random questions. Guarantees category variety while maintaining difficulty progression. (2025-10-03)
- **✅ Fixed difficulty-value correlation** - Refactored to sort ALL questions globally by difficulty before distributing across board. First 30 questions (easiest) assigned sequentially ensures $200 rows get easy questions, $1000 rows get hard questions. Guarantees proper progression. (2025-10-03)
- **⚠️ CRITICAL: Migrated from jService to Open Trivia DB** - jService.io API permanently shut down (HTTP 410) in October 2025. Replaced with Open Trivia Database for continued functionality. Note: Questions are now general trivia, NOT authentic Jeopardy data. Air dates removed as Open Trivia DB doesn't provide them. (2025-10-03)
- **Anytime Test isolation fix** - Fixed game board showing Anytime Test questions as completed by filtering answered questions by mode (2025-10-02)
- **Anytime Test 50-question fix** - Added 20 more questions to seed data (now 50 total), fixed logic to complete all 50 questions (2025-10-02)
- **Anytime Test isolation** - Test uses different questions from game board, doesn't affect spaced repetition, only Correct/Incorrect options (2025-10-02)
- **Complete authentication system** - Integrated Replit Auth with Google OAuth, session management, user profiles, logout (2025-09-30)
- **Rebranded to "The Daily Double Down"** - Updated all UI components, page titles, meta tags (2025-09-30)
- **Ocean-themed color palette** - Applied #04364A, #176B87, #64CCC5, #DAFFFB throughout light/dark modes (2025-09-30)
- **Anytime Test start screen** - Test now requires explicit user action to begin, no auto-start (2025-09-30)
- **API cost optimization** - Reduced polling from 5s to event-driven invalidation (80%+ API call reduction)
- **PostgreSQL database** - Migrated from in-memory storage with user-scoped data
- Project initialized with classic Jeopardy board layout (2025-08-28)
- Implemented self-assessment system for main board and rapid-fire mode
- Added visual indicators for completed questions on game board (color-coded: green ✓, red ✗, orange ?)
- Created category selection for rapid-fire mode with customizable question counts
- Enhanced mobile-responsive design with authentic Jeopardy styling
- Added reset functionality for completed game boards and rapid-fire sessions
- Fixed outdated questions and added air date display for time context

## User Preferences
- Prefers self-assessment over exact text matching for answers
- Values visual feedback for question completion status
- Wants category selection options for focused practice
- Emphasizes knowledge retention over perfect spelling/formatting
- Requires authentic, current Jeopardy data with proper time context
- Requests air date information for questions that may become outdated
- Expects seamless continuation after completing sessions (reset/restart functionality)
- Prefers Anytime Test to require explicit start action, not auto-start on page load
- Wants immediate access to game board without forced authentication - login should be optional for progress tracking

## Next Steps
1. Consider self-hosting jService for authentic Jeopardy data (optional)
2. Enhance spaced repetition algorithm with performance tracking
3. Add advanced analytics and progress visualization
4. Consider implementing Open Trivia DB session tokens to avoid question repetition