import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

type AnsweredQuestion = {
  questionId: string;
  assessment: "correct" | "incorrect" | "unsure";
};

const STORAGE_KEY = "anonymous_answered_questions";

export function useAnsweredQuestions() {
  const { user } = useAuth();
  const isAnonymous = !user;

  // For anonymous users, track answered questions in sessionStorage
  const [localAnswered, setLocalAnswered] = useState<AnsweredQuestion[]>(() => {
    if (typeof window === "undefined" || !isAnonymous) return [];
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // For authenticated users, fetch from server
  const { data: serverAnswered = [] } = useQuery<AnsweredQuestion[]>({
    queryKey: ["/api/answered-questions"],
    enabled: !isAnonymous,
  });

  // Sync local storage when localAnswered changes
  useEffect(() => {
    if (isAnonymous && typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(localAnswered));
    }
  }, [localAnswered, isAnonymous]);

  const answeredQuestions = isAnonymous ? localAnswered : serverAnswered;

  const addAnsweredQuestion = (questionId: string, assessment: "correct" | "incorrect" | "unsure") => {
    if (isAnonymous) {
      setLocalAnswered(prev => {
        const exists = prev.find(q => q.questionId === questionId);
        if (exists) {
          return prev.map(q => 
            q.questionId === questionId ? { questionId, assessment } : q
          );
        }
        return [...prev, { questionId, assessment }];
      });
    }
  };

  const clearAnsweredQuestions = () => {
    if (isAnonymous) {
      setLocalAnswered([]);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  return {
    answeredQuestions,
    addAnsweredQuestion,
    clearAnsweredQuestions,
    isAnonymous,
  };
}
