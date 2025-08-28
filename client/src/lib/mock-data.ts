import type { Category, Question } from "@shared/schema";

export const mockCategories: Category[] = [
  { id: "1", name: "World History", weight: 2.0 },
  { id: "2", name: "Science & Nature", weight: 1.8 },
  { id: "3", name: "Literature", weight: 1.5 },
  { id: "4", name: "Geography", weight: 1.7 },
  { id: "5", name: "Sports", weight: 1.3 },
  { id: "6", name: "Entertainment", weight: 1.4 },
];

export const mockQuestions: Question[] = [
  {
    id: "q1",
    categoryId: "1",
    text: "This French emperor was exiled to the island of Elba in 1814, only to return for the famous 'Hundred Days' before his final defeat at Waterloo.",
    answer: "Who is Napoleon Bonaparte?",
    value: 600,
    difficulty: 3,
  },
  {
    id: "q2",
    categoryId: "1",
    text: "This ancient wonder of the world was a lighthouse built on the island of Pharos near Alexandria, Egypt.",
    answer: "What is the Lighthouse of Alexandria?",
    value: 400,
    difficulty: 2,
  },
  {
    id: "q3",
    categoryId: "2",
    text: "This element has the chemical symbol Au and atomic number 79.",
    answer: "What is gold?",
    value: 400,
    difficulty: 2,
  },
  {
    id: "q4",
    categoryId: "3",
    text: "This Shakespeare play features the characters Rosencrantz and Guildenstern.",
    answer: "What is Hamlet?",
    value: 800,
    difficulty: 4,
  },
  {
    id: "q5",
    categoryId: "6",
    text: "This 1969 music festival took place on Max Yasgur's dairy farm in Bethel, New York.",
    answer: "What is Woodstock?",
    value: 200,
    difficulty: 1,
  },
];
