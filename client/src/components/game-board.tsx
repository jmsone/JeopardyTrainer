import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Target, Zap, RotateCcw, Timer } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, QuestionWithCategory, CategoryStats } from "@shared/schema";
import { useAnsweredQuestions } from "@/hooks/useAnsweredQuestions";

interface GameBoardProps {
  onQuestionSelect: (questionId: string) => void;
  onRapidFire: () => void;
  onAnytimeTest: () => void;
}

export default function GameBoard({ onQuestionSelect, onRapidFire, onAnytimeTest }: GameBoardProps) {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: categoryStats } = useQuery<CategoryStats[]>({
    queryKey: ["/api/stats/categories"],
  });

  const { data: overallStats } = useQuery({
    queryKey: ["/api/stats/overall"],
  });

  const { answeredQuestions, clearAnsweredQuestions } = useAnsweredQuestions();

  const resetBoardMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reset-board"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/answered-questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const values = [200, 400, 600, 800, 1000];
  const totalQuestions = categories?.length ? categories.length * values.length : 30;
  const completedQuestions = answeredQuestions.length;
  const isGameComplete = completedQuestions >= totalQuestions;

  const handleResetBoard = () => {
    if (confirm("Are you sure you want to reset the board? This will generate new questions and clear all progress.")) {
      resetBoardMutation.mutate();
    }
  };

  return (
    <section className="p-4" data-testid="game-board">
      {/* Progress Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Today's Challenge</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Progress Today</span>
            <span className="text-sm font-medium" data-testid="text-daily-progress">
              {overallStats?.totalQuestions || 0}/30 questions
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(((overallStats?.totalQuestions || 0) / 30) * 100, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Jeopardy Game Board */}
      <Card className="mb-6 overflow-hidden">
        <div className="jeopardy-gradient text-primary-foreground p-2">
          <h3 className="text-center font-bold text-lg">JEOPARDY!</h3>
        </div>
        
        <div className="p-4">
          {/* Category Headers */}
          <div className="grid grid-cols-6 gap-1 mb-2">
            {categories?.slice(0, 6).map((category) => (
              <div
                key={category.id}
                className="bg-primary text-primary-foreground p-2 text-center text-xs font-bold uppercase rounded"
                data-testid={`header-${category.id}`}
              >
                {category.name.replace(/&/g, '&').substring(0, 12)}
              </div>
            ))}
          </div>
          
          {/* Question Grid */}
          <div className="grid grid-cols-6 gap-1">
            {values.map((value) => (
              categories?.slice(0, 6).map((category) => (
                <QuestionButton
                  key={`${category.id}-${value}`}
                  categoryId={category.id}
                  value={value}
                  onSelect={onQuestionSelect}
                  answeredQuestions={answeredQuestions}
                />
              ))
            ))}
          </div>
        </div>
      </Card>

      {/* Completion Status */}
      {isGameComplete && (
        <Card className="p-4 mb-4 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <div className="text-center">
            <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">🎉 Game Board Complete!</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              You've answered all {totalQuestions} questions! Ready for a new challenge?
            </p>
            <Button 
              onClick={handleResetBoard}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={resetBoardMutation.isPending}
              data-testid="button-reset-board-complete"
            >
              <RotateCcw className="mr-2" size={16} />
              {resetBoardMutation.isPending ? "Generating New Board..." : "Get New Questions"}
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Study Mode */}
      <Card className="p-4">
        <h3 className="font-bold mb-3">Study Modes</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={onRapidFire}
            className="bg-destructive text-destructive-foreground p-4 h-auto hover:bg-destructive/90 flex flex-col items-center"
            data-testid="button-rapid-fire"
          >
            <Zap className="mb-2 text-lg" />
            <span className="font-medium text-xs">Rapid Fire</span>
          </Button>
          <Button 
            onClick={onAnytimeTest}
            className="bg-orange-600 text-white p-4 h-auto hover:bg-orange-700 flex flex-col items-center"
            data-testid="button-anytime-test"
          >
            <Timer className="mb-2 text-lg" />
            <span className="font-medium text-xs">Anytime! Test</span>
          </Button>
          <Button 
            className="bg-accent text-accent-foreground p-4 h-auto hover:bg-accent/90 flex flex-col items-center"
            data-testid="button-spaced-repetition"
          >
            <Clock className="mb-2 text-lg" />
            <span className="font-medium text-xs">Spaced Rep.</span>
          </Button>
          <Button 
            className="bg-primary text-primary-foreground p-4 h-auto hover:bg-primary/90 flex flex-col items-center"
            data-testid="button-weak-areas"
          >
            <Target className="mb-2 text-lg" />
            <span className="font-medium text-xs">Weak Areas</span>
          </Button>
        </div>
      </Card>
    </section>
  );
}

interface QuestionButtonProps {
  categoryId: string;
  value: number;
  onSelect: (questionId: string) => void;
  answeredQuestions: { questionId: string; assessment: "correct" | "incorrect" | "unsure" }[];
}

function QuestionButton({ categoryId, value, onSelect, answeredQuestions }: QuestionButtonProps) {
  const { data: question } = useQuery<QuestionWithCategory>({
    queryKey: [`/api/questions?categoryId=${categoryId}&value=${value}`],
    enabled: !!categoryId,
  });

  const isAvailable = !!question;
  const answeredData = question && answeredQuestions.find(aq => aq.questionId === question.id);
  const isAnswered = !!answeredData;

  const handleClick = () => {
    if (question) {
      onSelect(question.id);
    }
  };

  const getButtonStyle = () => {
    if (!isAvailable) {
      return 'bg-muted text-muted-foreground cursor-not-allowed';
    }
    if (isAnswered && answeredData) {
      switch (answeredData.assessment) {
        case 'correct':
          return 'bg-green-600 text-white opacity-85 border-2 border-green-400';
        case 'incorrect':
          return 'bg-red-600 text-white opacity-85 border-2 border-red-400';
        case 'unsure':
          return 'bg-orange-500 text-white opacity-85 border-2 border-orange-400';
      }
    }
    return 'gold-gradient text-black hover:opacity-90';
  };

  const getAssessmentIcon = () => {
    if (!isAnswered || !answeredData) return null;
    switch (answeredData.assessment) {
      case 'correct':
        return '✓';
      case 'incorrect':
        return '✗';
      case 'unsure':
        return '?';
      default:
        return null;
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!isAvailable}
      className={`
        ripple font-bold text-lg transition-colors min-h-[60px] flex items-center justify-center relative
        ${getButtonStyle()}
      `}
      data-testid={`button-question-${categoryId}-${value}${!isAvailable ? '-disabled' : isAnswered ? '-answered' : ''}`}
    >
      ${value}
      {isAnswered && (
        <span className="absolute top-1 right-1 text-sm font-bold">
          {getAssessmentIcon()}
        </span>
      )}
    </Button>
  );
}
