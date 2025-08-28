# Jeopardy Training App

## Project Overview
A mobile-optimized web application for Jeopardy training featuring spaced repetition learning, realistic question data, and comprehensive performance tracking.

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
- Project initialized with classic Jeopardy board layout (2025-08-28)
- Implemented self-assessment system for main board and rapid-fire mode
- Added visual indicators for completed questions on game board
- Created category selection for rapid-fire mode with customizable question counts
- Removed problematic text input validation in favor of reveal+assess approach
- Enhanced mobile-responsive design with authentic Jeopardy styling

## User Preferences
- Prefers self-assessment over exact text matching for answers
- Values visual feedback for question completion status
- Wants category selection options for focused practice
- Emphasizes knowledge retention over perfect spelling/formatting
- Requires authentic, current Jeopardy data with proper time context
- Requests air date information for questions that may become outdated

## Next Steps
1. Integrate authentic Jeopardy data source (jService.io API)
2. Enhance spaced repetition algorithm with performance tracking
3. Add advanced analytics and progress visualization
4. Implement user authentication and data persistence