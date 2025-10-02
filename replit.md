# The Daily Double Down

## Project Overview
A comprehensive trivia training application featuring Google login authentication via Replit Auth, spaced repetition learning, realistic question data, sophisticated gamification, and comprehensive performance tracking.

## Core Features
- Real Jeopardy questions from authentic data sources
- Spaced repetition learning algorithm based on scientific principles
- Category performance tracking and improvement analytics
- Weighted question selection favoring common 2025-era categories
- Mobile-first responsive design

## User Preferences
- Focus on accuracy and authenticity of questions/answers
- Importance of appropriate difficulty matching dollar values
- Scientific approach to spaced repetition learning
- Performance improvement tracking emphasis

## Technical Architecture
- Frontend: React with Vite, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express.js with TypeScript
- Database: In-memory storage (expandable to PostgreSQL)
- Data Sources: Authentic Jeopardy question databases/APIs
- Algorithms: Spaced repetition (SM-2 or similar)

## Data Quality Measures
- Authentic Jeopardy data sources only
- Question-answer accuracy validation
- Dollar value difficulty correlation
- Category frequency weighting for 2025 relevance

## Recent Changes
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
1. Integrate authentic Jeopardy data source (jService.io API)
2. Enhance spaced repetition algorithm with performance tracking
3. Add advanced analytics and progress visualization
4. Implement user authentication and data persistence