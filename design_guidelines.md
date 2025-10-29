# Design Guidelines: The Daily Double Down

## Design Approach

**Selected Approach:** Reference-Based Hybrid (Duolingo's gamification + Linear's data clarity + Kahoot's trivia energy)

**Key Principles:**
- Playful professionalism: Gaming aesthetics without sacrificing data credibility
- Clear information hierarchy for both gameplay and analytics
- Consistent ocean theme integration through shapes and patterns
- Component-based modular design for scalability

---

## Typography System

**Primary Font:** Inter (Google Fonts) - Clean, readable for data and UI
**Accent Font:** Poppins (Google Fonts) - Bold, energetic for game elements

**Hierarchy:**
- Page Titles: Poppins Bold, 2.5rem (40px)
- Section Headers: Poppins SemiBold, 1.75rem (28px)
- Game Board Categories: Poppins Bold, 1.125rem (18px), uppercase, letter-spacing: 0.05em
- Dollar Values: Poppins Bold, 2rem (32px)
- Body Text: Inter Regular, 1rem (16px)
- Data Labels: Inter Medium, 0.875rem (14px)
- Small Stats: Inter SemiBold, 0.75rem (12px)

---

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 24 (e.g., p-4, gap-8, mb-12)

**Grid Structure:**
- Dashboard: 12-column grid with sidebar (3 cols) + main content (9 cols)
- Game Board: 6-column responsive grid for categories
- Analytics: Mixed 2-3 column layouts for stat cards

**Container Widths:**
- Full app: max-w-screen-2xl, centered
- Content sections: max-w-6xl
- Stat cards: Flexible within grid

---

## Component Library

### Navigation
**Top Bar:** Fixed header with app logo/title (left), user streak counter (center), profile avatar with points badge (right). Height: h-16, padding: px-8

**Sidebar Navigation:** Categories list, recent achievements, quick stats. Width: w-64 on desktop, collapsible to icon-only on tablet. Spacing: py-6, px-4

### Game Board
**Category Headers:** Full-width cells with wave-pattern border-bottom (use CSS wave SVG as background-image). Height: h-20, centered text

**Dollar Value Tiles:** Square aspect ratio cards (aspect-square), large centered dollar amounts. Grid gap: gap-2. Hover lift effect (transform: translateY(-4px))

**Tile States:**
- Unplayed: Full opacity with dollar value visible
- Completed: Semi-transparent with checkmark icon overlay
- Locked: Grayed with lock icon

### Performance Tracking

**Mastery Level Indicators:** Circular progress rings (use conic-gradient for CSS-based approach) showing percentage completion. Size: w-24 h-24, with category icon in center

**Category Cards:** Each displays category name, mastery ring, question count, accuracy percentage, last played date. Layout: 3-column grid on desktop, 1-column on mobile. Padding: p-6, gap: gap-6

**Stats Grid:** 2x2 grid showing: Total Questions Answered, Overall Accuracy, Current Streak, Best Category. Each stat in rounded card with large number (text-4xl) above small label. Padding: p-8

### Analytics Dashboard

**Performance Graph:** Line chart showing accuracy over time. Use Chart.js or similar via CDN. Container height: h-80. Include toggle buttons for time ranges (7d, 30d, 90d, All)

**Recent Activity Feed:** Scrollable list (max-h-96, overflow-y-auto) showing recent questions with result icons (✓/✗), category badges, and timestamp. Item padding: py-3, border-b between items

### Achievement System

**Badge Grid:** Masonry-style grid (3-4 columns) displaying earned and locked achievements. Badge size: w-20 h-20 icon with title below

**Badge Cards:** Includes icon, title, description, progress bar (if partially complete), unlock date. Locked badges shown at 40% opacity. Padding: p-6

**Achievement Notification Toast:** Slides in from top-right, displays new badge with celebration confetti background effect. Width: w-96, padding: p-4

### Forms & Inputs

**Answer Input:** Large text input for Jeopardy-style "What is..." responses. Height: h-14, rounded-lg, px-4

**Multiple Choice:** Radio buttons styled as full-width option cards. Each option: h-16, rounded-lg, px-6, with hover border highlight

**Submit Button:** Primary CTA button, full-width or auto-width context-dependent. Height: h-12, rounded-lg, font-semibold, includes loading spinner state

### Data Visualization

**Progress Bars:** Horizontal bars showing completion percentage. Height: h-3, rounded-full, with animated fill

**Comparison Bars:** Side-by-side bars for category comparisons. Include percentage labels at end of bars

**Stat Rings:** Donut charts for at-a-glance metrics. Size: w-32 h-32, stroke-width: 8

---

## Page Layouts

### Landing/Home Page
**Hero Section:** Full-width (h-[600px]) with ocean wave illustration background image (abstract wave patterns, no literal ocean photos). Centered content: App title (Poppins Bold, 3.5rem), tagline (Inter Regular, 1.25rem), dual CTAs (Start Training, View Stats). Buttons on backdrop-blur-md background for readability.

**Feature Showcase:** 3-column grid highlighting: Interactive Game Board, Smart Tracking, Achievement System. Each column: icon (w-16 h-16), heading, 2-3 line description. Spacing: py-24, gap-12

**Stats Highlight:** 4-column counter display (if user has stats): Questions Mastered, Accuracy Rate, Days Streak, Badges Earned. Animated count-up on scroll into view

### Game Board Page
**Header:** Category selection breadcrumb, current session stats (questions attempted/remaining), timer (if timed mode). Height: h-20

**Main Board:** 6x5 grid (6 categories × 5 dollar values). Full viewport utilization with proper spacing (gap-4, p-8)

**Question Modal:** Overlay modal (fixed inset-0, bg-overlay) displaying question text (large, centered), answer input, timer, and submit button. Modal width: max-w-2xl, padding: p-12

### Dashboard Page
**Quick Stats Row:** 4 stat cards showing key metrics. Height: auto, equal-width columns

**Category Performance Section:** Grid of category mastery cards (described above). Section padding: py-12

**Analytics Charts:** Performance graph, accuracy breakdown pie chart, time-based activity heatmap. Stack vertically with spacing: space-y-8

**Recent Activity Sidebar:** Right column (w-80) showing last 10 questions attempted with quick-glance results

### Achievements Page
**Header:** Total badges earned counter, completion percentage ring

**Badge Categories:** Tabs for filtering (All, Earned, Locked, Recent). Tab bar: h-12, border-b

**Badge Display:** Responsive grid (grid-cols-2 md:grid-cols-3 lg:grid-cols-4) with consistent gap-6

---

## Icons
**Library:** Heroicons (via CDN) for all UI icons
**Game-Specific Icons:** Use Heroicons for: trophy (achievements), chart-bar (analytics), academic-cap (mastery), check-circle (correct), x-circle (incorrect), lock-closed (locked content)

---

## Images

**Hero Background Image:** Abstract geometric ocean wave pattern illustration (not photographic). Positioning: background-size: cover, background-position: center. Style: Modern, minimalist waves with gradient overlay from darker at top to lighter at bottom to ensure text readability.

**Achievement Badge Graphics:** Icon-based graphics using Heroicons as base, no custom illustrations needed. Style badges with background circles and solid icon fills.

No additional photographic images required - maintain clean, icon-driven interface aesthetic.

---

## Animations
**Minimal Animation Strategy:**
- Tile reveal on game board: 50ms stagger per tile on page load
- Number count-ups for stats: 1s duration
- Achievement unlock: Scale-in animation (scale 0.8 to 1.0, 300ms)
- Page transitions: Simple fade (200ms)