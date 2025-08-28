import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, ChevronLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuestionWithCategory } from "@shared/schema";

interface RapidFireModeProps {
  settings?: { selectedCategories: string[]; questionCount: number };
  onBack: () => void;
}

export default function RapidFireMode({ settings, onBack }: RapidFireModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    unsure: 0,
  });

  const restartSession = () => {
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0, unsure: 0 });
    queryClient.invalidateQueries({ queryKey: ["/api/questions/rapid-fire", settings] });
  };

  const { data: questions, isLoading } = useQuery<QuestionWithCategory[]>({
    queryKey: ["/api/questions/rapid-fire", settings],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (settings?.questionCount) {
        params.append('limit', settings.questionCount.toString());
      }
      if (settings?.selectedCategories && settings.selectedCategories.length > 0) {
        params.append('categories', settings.selectedCategories.join(','));
      }
      
      const response = await fetch(`/api/questions/rapid-fire?${params}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
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

  const currentQuestion = questions?.[currentQuestionIndex];
  const totalQuestions = questions?.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const handleSelfAssessment = async (assessment: "correct" | "incorrect" | "unsure") => {
    if (!currentQuestion) return;

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      [assessment]: prev[assessment] + 1,
    }));

    // Submit to backend
    await submitAnswerMutation.mutateAsync({
      questionId: currentQuestion.id,
      correct: assessment === "correct",
      userAnswer: "",
      timeSpent: 30, // Default time for rapid-fire
      selfAssessment: assessment,
    });

    // Move to next question or finish
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Session complete - increment to trigger completion UI
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading rapid-fire questions...</div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="mb-4">No questions available for rapid-fire mode.</p>
          <Button onClick={onBack}>Back to Game Board</Button>
        </div>
      </div>
    );
  }

  // Check if session is complete
  if (currentQuestionIndex >= totalQuestions) {
    const accuracy = totalQuestions > 0 ? (sessionStats.correct / totalQuestions) * 100 : 0;
    
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Session Complete! 🎉</h2>
          <div className="mb-6">
            <p className="text-lg mb-2">Final Score:</p>
            <div className="text-3xl font-bold mb-4">
              {accuracy.toFixed(0)}% Accuracy
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{sessionStats.unsure}</div>
                <div className="text-sm text-muted-foreground">Unsure</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={restartSession} className="flex-1" data-testid="button-restart-session">
              <RotateCcw className="mr-2" size={16} />
              Play Again
            </Button>
            <Button onClick={onBack} variant="outline" className="flex-1">
              Back to Board
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="p-4" data-testid="rapid-fire-mode">
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
          <div className="text-sm text-muted-foreground">Rapid Fire Mode</div>
          <div className="font-bold" data-testid="text-question-counter">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
            data-testid="progress-bar"
          />
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-accent" data-testid="stat-correct">
            {sessionStats.correct}
          </div>
          <div className="text-xs text-muted-foreground">Correct</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-destructive" data-testid="stat-incorrect">
            {sessionStats.incorrect}
          </div>
          <div className="text-xs text-muted-foreground">Incorrect</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-secondary" data-testid="stat-unsure">
            {sessionStats.unsure}
          </div>
          <div className="text-xs text-muted-foreground">Unsure</div>
        </Card>
      </div>

      {/* Question Card */}
      <Card className="question-card p-6 mb-6">
        <div className="text-center">
          <div className="text-sm text-primary-foreground/80 mb-2" data-testid="text-category">
            {currentQuestion?.category.name} • ${currentQuestion?.value}
            {currentQuestion?.airDate && (
              <span className="block text-xs opacity-75 mt-1">
                Aired: {new Date(currentQuestion.airDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-lg leading-relaxed mb-4 text-primary-foreground" data-testid="text-question">
            {currentQuestion?.text}
          </p>
          
          {!showAnswer ? (
            <Button
              onClick={() => setShowAnswer(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-reveal-answer"
            >
              Reveal Answer
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-primary-foreground/20 rounded-lg">
                <p className="text-lg font-medium text-primary-foreground" data-testid="text-answer">
                  {currentQuestion?.answer}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">How did you do?</p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleSelfAssessment("correct")}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    data-testid="button-self-correct"
                  >
                    ✓ Correct
                  </Button>
                  <Button
                    onClick={() => handleSelfAssessment("incorrect")}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-self-incorrect"
                  >
                    ✗ Incorrect
                  </Button>
                  <Button
                    onClick={() => handleSelfAssessment("unsure")}
                    variant="secondary"
                    data-testid="button-self-unsure"
                  >
                    ? Unsure
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}