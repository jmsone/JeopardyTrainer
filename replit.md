# The Daily Double Down

## Project Overview
A comprehensive trivia training application featuring Google login authentication via Replit Auth, spaced repetition learning, dynamic question data, sophisticated gamification, and comprehensive performance tracking.

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
- Database: PostgreSQL (Neon)
- Data Sources: Open Trivia Database API (opentdb.com)
- Algorithms: Spaced repetition (SM-2 or similar)

## Data Quality Measures
- Questions sourced from Open Trivia Database
- HTML entity decoding for clean display
- **Global difficulty sorting** - All 50 questions sorted by difficulty, first 30 distributed across board
- Dollar value assignment guarantees easy questions at $200, hard at $1000
- Category diversity in question selection

## Recent Changes
- **✅ Fixed difficulty-value correlation** - Refactored to sort ALL 50 questions globally by difficulty before distributing across board. First 30 questions (easiest) assigned sequentially ensures $200 rows get easy questions, $1000 rows get hard questions. Guarantees proper progression. (2025-10-03)
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

## Next Steps
1. Consider self-hosting jService for authentic Jeopardy data (optional)
2. Enhance spaced repetition algorithm with performance tracking
3. Add advanced analytics and progress visualization
4. Consider implementing Open Trivia DB session tokens to avoid question repetition