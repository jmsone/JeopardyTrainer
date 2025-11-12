# The Daily Double Down

A sophisticated trivia training and learning platform that gamifies the Jeopardy experience with spaced repetition learning, achievement tracking, and comprehensive analytics.

## Overview

**The Daily Double Down** is a full-stack TypeScript web application designed to help users master trivia knowledge through scientific learning algorithms and engaging gameplay mechanics. The platform combines authentic Jeopardy-style gameplay with modern learning science, featuring self-assessment, spaced repetition, and detailed progress tracking.

## Key Features

### Gameplay

- **Jeopardy-Style Game Board**: Classic 6x5 grid with categories and dollar values ($200-$1000)
- **Multiple Game Modes**:
  - **Game Mode**: Main board with category-specific questions
  - **Rapid-Fire Mode**: Timed quiz with customizable question counts
  - **Anytime Test**: Isolated 50-question test that doesn't affect game board progress
- **Self-Assessment System**: Rate answers as "Correct," "Incorrect," or "Unsure" to focus on comprehension over exact text matching
- **Anonymous Play**: Immediate access without login required

### Learning & Education

- **AI-Powered Explanations**: Detailed explanations via Perplexity API
- **Study Materials**: Curated study guides organized by category
- **Spaced Repetition**: SM-2 algorithm implementation for optimal knowledge retention
- **Category Mastery System**: Track expertise across 24 different trivia categories with time-decay algorithm

### Gamification

- **Achievement System**: Badges across 5 categories (milestone, streak, mastery, speed, consistency) with 4 tiers (bronze, silver, gold, platinum)
- **Streak Tracking**: Daily streak indicators with celebration effects
- **Daily Goals**: Customizable targets with reminder notifications
- **Points System**: Earn points through achievements and consistent practice

### Analytics & Progress

- **Comprehensive Stats Dashboard**:
  - Questions answered, accuracy percentage, current streak
  - Best category identification
  - Performance graphs (7-day, 30-day, 90-day, all-time views)
  - Time-based heatmaps
- **Category Mastery Levels**: Progress from novice to master across all categories
- **Performance Tracking**: Detailed history with time-weighted scoring

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: Wouter 3.3.5
- **State Management**: TanStack React Query 5.60.5
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17
- **Icons**: Lucide React 0.453.0
- **Animations**: Framer Motion 11.13.1
- **Charts**: Recharts 2.15.2

### Backend
- **Runtime**: Node.js with Express.js 4.21.2
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM 0.39.1
- **Authentication**: Replit Auth with Google OAuth
- **Session Storage**: Express-session with PostgreSQL adapter
- **WebSockets**: ws 8.18.0
- **API Integration**: Open Trivia Database

### Shared
- **Type Safety**: Zod schema validation
- **TypeScript**: 5.6.3 (strict mode)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (or use in-memory storage for development)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/JeopardyTrainer.git
cd JeopardyTrainer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file in the root directory
DATABASE_URL=your_postgresql_connection_string
REPLIT_AUTH_CLIENT_ID=your_client_id
REPLIT_AUTH_CLIENT_SECRET=your_client_secret
PERPLEXITY_API_KEY=your_perplexity_key

# Optional: Force database storage in development
USE_DB_STORAGE=true
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
JeopardyTrainer/
├── client/
│   └── src/
│       ├── pages/              # Main application pages
│       │   ├── home.tsx        # Game board/dashboard
│       │   ├── study.tsx       # Study materials
│       │   ├── progress.tsx    # Analytics & stats
│       │   └── landing.tsx     # Welcome page
│       ├── components/         # React components
│       │   ├── game-board.tsx
│       │   ├── question-view.tsx
│       │   ├── achievement-*.tsx
│       │   ├── stats-dashboard.tsx
│       │   └── ui/            # shadcn UI primitives
│       ├── hooks/             # Custom React hooks
│       └── lib/               # Utilities
├── server/
│   ├── index.ts               # Express app initialization
│   ├── routes.ts              # API route definitions
│   ├── storage.ts             # In-memory storage
│   ├── db-storage.ts          # Database implementation
│   ├── opentdb.ts             # Open Trivia DB client
│   ├── perplexity-service.ts  # AI learning materials
│   └── utils/
│       └── mastery-calculations.ts  # Spaced repetition logic
├── shared/
│   └── schema.ts              # Zod schemas & Drizzle tables
└── [config files]
```

## API Documentation

### Core Endpoints

#### Questions
- `GET /api/categories` - Retrieve all 24 trivia categories
- `GET /api/questions` - Get current game board questions
- `GET /api/questions?categoryId=x&value=200` - Get specific question
- `GET /api/questions/rapid-fire` - Get random rapid-fire questions
- `GET /api/anytime-test-questions` - Get 50-question test set

#### Progress Tracking
- `GET /api/answered-questions` - User's answered questions
- `POST /api/answer-question` - Submit answer with self-assessment
- `POST /api/reset-board` - Generate new game board
- `GET /api/stats` - User statistics and analytics
- `GET /api/user-achievements` - Achievement progress

#### Learning
- `GET /api/learning-materials/:questionId` - AI-generated explanations
- `GET /api/study-materials` - Curated study guides

#### Authentication
- `GET /api/auth/user` - Current user profile
- `POST /api/auth/logout` - Logout user

#### Health
- `GET /healthz` - Detailed readiness status
- `HEAD /` - Deployment health check

## Database Schema

The application uses 15 PostgreSQL tables:

**Core Data**:
- `categories`: 24 trivia categories
- `questions`: Question bank
- `users`: User profiles

**User Progress**:
- `userProgress`: Question attempts
- `spacedRepetition`: SM-2 algorithm tracking
- `categoryMastery`: Per-category statistics
- `userGoals`: Daily/weekly targets

**Gamification**:
- `achievements`: Achievement definitions
- `userAchievements`: User progress
- `notifications`: Notification history

**Learning**:
- `learningMaterials`: AI explanations
- `studyMaterials`: Curated guides

**Session Management**:
- `sessions`: Express-session storage

## Features in Detail

### Category Mastery System

The platform tracks mastery across 24 trivia categories with a sophisticated algorithm:
- Time-decay calculation (6-month exponential decay)
- Weighted correct score calculation
- Five mastery levels: Novice → Intermediate → Advanced → Expert → Master
- Approximately 50 time-weighted correct answers needed per category for mastery

### Spaced Repetition (SM-2 Algorithm)

Questions are scheduled for review using the SM-2 algorithm:
- Tracks ease factor, interval, and repetitions
- Calculates optimal next review date
- Ensures long-term knowledge retention

### Achievement System

Earn badges across multiple categories:
- **Milestone**: Total questions answered
- **Streak**: Daily consistency
- **Mastery**: Category expertise
- **Speed**: Quick correct answers
- **Consistency**: Regular engagement

Each achievement has 4 tiers with increasing difficulty and point values.

## Development

### Storage Options

The application supports two storage backends:

**In-Memory Storage** (default in development):
```bash
npm run dev
```

**PostgreSQL Storage** (production):
```bash
USE_DB_STORAGE=true npm run dev
# or
NODE_ENV=production npm run start
```

### Database Commands

```bash
# Generate migrations
npm run db:generate

# Push schema changes
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Build Commands

```bash
# Development
npm run dev

# Type checking
npm run check

# Production build
npm run build

# Start production server
npm run start
```

## Design System

**Color Palette** (Ocean Theme):
- Primary: `#176B87` (ocean blue)
- Dark: `#04364A` (deep navy)
- Accent: `#64CCC5` (turquoise)
- Light: `#DAFFFB` (light cyan)

**Typography**:
- Headers: Poppins Bold
- Body: Inter Regular

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Question data sourced from [Open Trivia Database](https://opentdb.com/)
- AI explanations powered by [Perplexity API](https://www.perplexity.ai/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication via [Replit Auth](https://docs.replit.com/auth)

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with TypeScript, React, and PostgreSQL
