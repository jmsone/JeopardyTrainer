import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Check, SkipForward, ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuestionWithCategory } from "@shared/schema";

interface QuestionViewProps {
  questionId: string;
  onAnswerSubmit: (correct: boolean, answer: string, value: number) => void;
  onBack: () => void;
}

export default function QuestionView({ questionId, onAnswerSubmit, onBack }: QuestionViewProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const { data: question, isLoading } = useQuery<QuestionWithCategory>({
    queryKey: ["/api/questions", questionId],
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: {
      questionId: string;
      correct: boolean;
      userAnswer: string;
      timeSpent: number;
    }) => {
      return apiRequest("POST", "/api/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const validateJeopardyFormat = (answer: string): boolean => {
    const trimmed = answer.trim().toLowerCase();
    return trimmed.startsWith("who is") || 
           trimmed.startsWith("what is") || 
           trimmed.startsWith("where is") || 
           trimmed.startsWith("when is") ||
           trimmed.startsWith("how is") ||
           trimmed.startsWith("why is");
  };

  const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    const normalize = (str: string) => 
      str.toLowerCase()
         .replace(/^(who|what|where|when|how|why) is\s+/i, '')
         .replace(/[^\w\s]/g, '')
         .trim();

    return normalize(userAnswer) === normalize(correctAnswer);
  };

  const handleSubmit = () => {
    if (!question || !userAnswer.trim()) return;

    if (!validateJeopardyFormat(userAnswer)) {
      alert("Please format your answer as a question (e.g., 'Who is...' or 'What is...')");
      return;
    }

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const correct = checkAnswer(userAnswer, question.answer);

    submitAnswerMutation.mutate({
      questionId: question.id,
      correct,
      userAnswer,
      timeSpent,
    });

    onAnswerSubmit(correct, question.answer, question.value);
  };

  const handleSkip = () => {
    if (!question) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    submitAnswerMutation.mutate({
      questionId: question.id,
      correct: false,
      userAnswer: "",
      timeSpent,
    });

    onAnswerSubmit(false, question.answer, 0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading question...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">Question not found</div>
      </div>
    );
  }

  return (
    <section className="p-4" data-testid="question-view">
      {/* Progress Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span data-testid="text-question-category">{question.category.name} • ${question.value}</span>
          <span data-testid="text-question-progress">Question 5/30</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1">
          <div className="bg-primary h-1 rounded-full" style={{ width: "17%" }} />
        </div>
      </div>

      {/* Question Card */}
      <Card className="question-card p-6 mb-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg leading-relaxed mb-4" data-testid="text-question">
            {question.text}
          </p>
          <div className="text-sm text-muted-foreground">
            <Clock className="inline mr-1" size={16} />
            <span className={timeRemaining <= 10 ? "text-destructive font-bold" : ""} data-testid="text-timer">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </Card>

      {/* Answer Input */}
      <Card className="p-4 mb-6">
        <label className="block text-sm font-medium mb-2">
          Your Answer (in question form)
        </label>
        <Input
          type="text"
          placeholder="Who is..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="mb-3"
          data-testid="input-answer"
        />
        <div className="flex space-x-3">
          <Button
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || submitAnswerMutation.isPending}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            data-testid="button-submit-answer"
          >
            <Check className="mr-2" size={16} />
            Submit Answer
          </Button>
          <Button
            onClick={handleSkip}
            disabled={submitAnswerMutation.isPending}
            variant="secondary"
            className="flex-1"
            data-testid="button-skip"
          >
            <SkipForward className="mr-2" size={16} />
            Skip
          </Button>
        </div>
      </Card>

      {/* Hint Section */}
      <Card className="p-4">
        <Button
          variant="ghost"
          onClick={() => setShowHint(!showHint)}
          className="w-full flex items-center justify-between text-left p-0 h-auto"
          data-testid="button-toggle-hint"
        >
          <span className="font-medium">Need a hint?</span>
          <ChevronDown className={`transition-transform ${showHint ? 'rotate-180' : ''}`} />
        </Button>
        {showHint && (
          <div className="mt-3 text-sm text-muted-foreground" data-testid="text-hint">
            This question is worth ${question.value} and is in the {question.category.name} category.
          </div>
        )}
      </Card>
    </section>
  );
}
