import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Target, Zap } from "lucide-react";
import type { Category, QuestionWithCategory, CategoryStats } from "@shared/schema";

interface GameBoardProps {
  onQuestionSelect: (questionId: string) => void;
  onRapidFire: () => void;
}

export default function GameBoard({ onQuestionSelect, onRapidFire }: GameBoardProps) {
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
                />
              ))
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Study Mode */}
      <Card className="p-4">
        <h3 className="font-bold mb-3">Study Modes</h3>
        <div className="grid grid-cols-3 gap-3">
          <Button 
            className="bg-accent text-accent-foreground p-4 h-auto hover:bg-accent/90 flex flex-col items-center"
            data-testid="button-spaced-repetition"
          >
            <Clock className="mb-2 text-lg" />
            <span className="font-medium text-xs">Spaced Rep.</span>
          </Button>
          <Button 
            onClick={onRapidFire}
            className="bg-destructive text-destructive-foreground p-4 h-auto hover:bg-destructive/90 flex flex-col items-center"
            data-testid="button-rapid-fire"
          >
            <Zap className="mb-2 text-lg" />
            <span className="font-medium text-xs">Rapid Fire</span>
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
}

function QuestionButton({ categoryId, value, onSelect }: QuestionButtonProps) {
  const { data: question } = useQuery<QuestionWithCategory>({
    queryKey: [`/api/questions?categoryId=${categoryId}&value=${value}`],
    enabled: !!categoryId,
  });

  const isAvailable = !!question;

  const handleClick = () => {
    if (question) {
      onSelect(question.id);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!isAvailable}
      className={`
        ripple font-bold text-lg transition-colors min-h-[60px] flex items-center justify-center
        ${isAvailable 
          ? 'gold-gradient text-black hover:opacity-90' 
          : 'bg-muted text-muted-foreground cursor-not-allowed'
        }
      `}
      data-testid={`button-question-${categoryId}-${value}${!isAvailable ? '-disabled' : ''}`}
    >
      ${value}
    </Button>
  );
}
