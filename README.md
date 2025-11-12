The Daily Double Down


1. Summary

A trivia training application that applies a Spaced Repetition Algorithm and a Mastery-Based Readiness Engine to optimize user learning. Leveraged Duolingo-inspired gamification (streaks, achievements, points) to drive daily engagement and long-term retention. The core product metric is a data-driven Readiness Score (A-F grade). This project highlighted key learnings in AI-driven development governance and prioritization under hard budget constraints.


2. Key Learnings 

- The Context Dilemma: Plan Wide, Build Small: While comprehensive initial planning ("Plan Wide") is essential to define architecture and prevent costly re-work, execution with AI tools must be highly iterative and narrow ("Build Small"). The Product Manager must segment development instructions to fit the model's context window, optimizing for faster, more accurate output, and validating single features before moving to the next.

- Strategic Prototyping vs. Production Tooling: Generative AI is best viewed as a rapid prototyping and hypothesis validation engine, not a replacement for a full development team. It accelerates the validation of concepts and features but reinforces the need for human expertise in critical areas like security, infrastructure, scalability, and performance optimization before moving to a production environment.

- The Cost Facet of Prioritization: Working with a hard budget constraint (development credits) fundamentally changes the prioritization conversation. It elevates the "cost" facet beyond estimated developer-weeks, forcing an uncompromising focus on Minimum Lovable Product (MLP). This required explicitly deprioritizing non-core UX/design polish to ensure the highest-value functional elements (content accuracy, breadth, and core spaced repetition logic) were delivered first.
