import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuestionWithCategory } from "@shared/schema";
import EnhancedFeedbackModal from "./enhanced-feedback-modal";

interface QuestionViewProps {
  questionId: string;
  onAnswerSubmit: (correct: boolean, answer: string, value: number) => void;
  onBack: () => void;
}

export default function QuestionView({ questionId, onAnswerSubmit, onBack }: QuestionViewProps) {
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [userAssessment, setUserAssessment] = useState<"correct" | "incorrect" | "unsure">("unsure");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const { data: question, isLoading } = useQuery<QuestionWithCategory>({
    queryKey: [`/api/questions/${questionId}`],
    enabled: !!questionId,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (data: {
      questionId: string;
      correct: boolean;
      userAnswer: string;
      timeSpent: number;
      selfAssessment: "correct" | "incorrect" | "unsure";
    }) => {
      return apiRequest("POST", "/api/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/answered-questions"] });
    },
  });

  const handleSelfAssessment = async (assessment: "correct" | "incorrect" | "unsure") => {
    if (!question) return;

    setUserAssessment(assessment);

    await submitAnswerMutation.mutateAsync({
      questionId: question.id,
      correct: assessment === "correct",
      userAnswer: "",
      timeSpent,
      selfAssessment: assessment,
    });

    setShowFeedback(true);
  };

  const handleFeedbackNext = () => {
    if (!question) return;
    setShowFeedback(false);
    onAnswerSubmit(userAssessment === "correct", question.answer, question.value);
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
        <div className="text-center">
          <p className="mb-4">Question not found.</p>
          <Button onClick={onBack}>Back to Game Board</Button>
        </div>
      </div>
    );
  }

  return (
    <section className="p-4" data-testid="question-view">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center"
          data-testid="button-back"
        >
          <ChevronLeft className="mr-1" size={20} />
          Back
        </Button>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Time Spent</div>
          <div className="font-bold flex items-center" data-testid="text-time-spent">
            <Clock className="mr-1" size={16} />
            {timeSpent}s
          </div>
        </div>
      </div>

      {/* Category and Value */}
      <div className="mb-6 text-center">
        <div className="text-sm text-muted-foreground mb-1" data-testid="text-category">
          {question.category.name}
        </div>
        <div className="text-2xl font-bold text-primary" data-testid="text-value">
          ${question.value}
        </div>
        {question.airDate && (
          <div className="text-xs text-muted-foreground mt-1" data-testid="text-air-date">
            Originally aired: {new Date(question.airDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Question Card */}
      <Card className="question-card p-8 mb-6">
        <div className="text-center">
          <p className="text-xl leading-relaxed mb-6 text-primary-foreground" data-testid="text-question">
            {question.text}
          </p>
          
          {!showAnswer ? (
            <Button
              onClick={() => setShowAnswer(true)}
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              data-testid="button-reveal-answer"
            >
              Reveal Answer
            </Button>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-primary-foreground/20 rounded-lg">
                <p className="text-xl font-medium text-primary-foreground" data-testid="text-answer">
                  {question.answer}
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-primary-foreground/80">How did you do?</p>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleSelfAssessment("correct")}
                    className="bg-green-600 text-white hover:bg-green-700 py-3"
                    data-testid="button-self-correct"
                    disabled={submitAnswerMutation.isPending}
                  >
                    ✓ Correct
                  </Button>
                  <Button
                    onClick={() => handleSelfAssessment("incorrect")}
                    className="bg-red-600 text-white hover:bg-red-700 py-3"
                    data-testid="button-self-incorrect"
                    disabled={submitAnswerMutation.isPending}
                  >
                    ✗ Incorrect
                  </Button>
                  <Button
                    onClick={() => handleSelfAssessment("unsure")}
                    variant="secondary"
                    className="py-3"
                    data-testid="button-self-unsure"
                    disabled={submitAnswerMutation.isPending}
                  >
                    ? Unsure
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Feedback Modal */}
      <EnhancedFeedbackModal
        isVisible={showFeedback}
        correct={userAssessment === "correct"}
        answer={question.answer}
        value={question.value}
        questionId={question.id}
        userAssessment={userAssessment}
        onNext={handleFeedbackNext}
      />
    </section>
  );
}