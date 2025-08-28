import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Target } from "lucide-react";
import type { Category, Question, CategoryStats } from "@shared/schema";

interface GameBoardProps {
  onQuestionSelect: (questionId: string) => void;
}

export default function GameBoard({ onQuestionSelect }: GameBoardProps) {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: categoryStats } = useQuery<CategoryStats[]>({
    queryKey: ["/api/stats/categories"],
  });

  const { data: overallStats } = useQuery({
    queryKey: ["/api/stats/overall"],
  });

  const values = [200, 400, 600, 800, 1000];

  const getCategoryPriorityLabel = (accuracy: number) => {
    if (accuracy >= 75) return { label: "High Priority", color: "bg-primary/20" };
    if (accuracy >= 60) return { label: "Improving", color: "bg-accent/20" };
    return { label: "Needs Work", color: "bg-destructive/20" };
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

      {/* Category Grid */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {categories?.map((category) => {
          const stats = categoryStats?.find(s => s.categoryId === category.id);
          const priority = getCategoryPriorityLabel(stats?.accuracy || 0);
          
          return (
            <Card key={category.id} className="overflow-hidden" data-testid={`card-category-${category.id}`}>
              <div className="bg-primary text-primary-foreground p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase" data-testid={`text-category-name-${category.id}`}>
                    {category.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`${priority.color} px-2 py-1 rounded text-xs`}>
                      {priority.label}
                    </span>
                    <span className="text-xs text-primary-foreground/80" data-testid={`text-accuracy-${category.id}`}>
                      {Math.round(stats?.accuracy || 0)}% accuracy
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1 p-3">
                {values.map((value) => (
                  <QuestionButton
                    key={`${category.id}-${value}`}
                    categoryId={category.id}
                    value={value}
                    onSelect={onQuestionSelect}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Study Mode */}
      <Card className="p-4">
        <h3 className="font-bold mb-3">Quick Study</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="bg-accent text-accent-foreground p-4 h-auto hover:bg-accent/90 flex flex-col items-center"
            data-testid="button-spaced-repetition"
          >
            <Clock className="mb-2 text-lg" />
            <span className="font-medium">Spaced Repetition</span>
          </Button>
          <Button 
            className="bg-primary text-primary-foreground p-4 h-auto hover:bg-primary/90 flex flex-col items-center"
            data-testid="button-weak-areas"
          >
            <Target className="mb-2 text-lg" />
            <span className="font-medium">Weak Areas</span>
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
}

function QuestionButton({ categoryId, value, onSelect }: QuestionButtonProps) {
  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/questions", categoryId],
    enabled: !!categoryId,
  });

  const question = questions?.find(q => q.value === value);
  const isAvailable = !!question;

  if (!isAvailable) {
    return (
      <Button
        disabled
        className="bg-muted text-muted-foreground p-3 rounded font-bold text-sm cursor-not-allowed min-h-[60px] flex items-center justify-center"
        data-testid={`button-question-${categoryId}-${value}-disabled`}
      >
        ${value}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => onSelect(question.id)}
      className="ripple bg-secondary text-secondary-foreground p-3 rounded font-bold text-sm hover:bg-secondary/90 transition-colors min-h-[60px] flex items-center justify-center"
      data-testid={`button-question-${categoryId}-${value}`}
    >
      ${value}
    </Button>
  );
}
