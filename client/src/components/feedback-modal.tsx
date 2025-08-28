import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface FeedbackModalProps {
  isVisible: boolean;
  correct: boolean;
  answer: string;
  value: number;
  onNext: () => void;
}

export default function FeedbackModal({ 
  isVisible, 
  correct, 
  answer, 
  value, 
  onNext 
}: FeedbackModalProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      data-testid="feedback-modal"
    >
      <Card className="p-6 max-w-sm w-full shadow-xl">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            correct ? 'bg-accent' : 'bg-destructive'
          }`}>
            {correct ? (
              <Check className="text-2xl text-accent-foreground" data-testid="icon-correct" />
            ) : (
              <X className="text-2xl text-destructive-foreground" data-testid="icon-incorrect" />
            )}
          </div>
          <h3 className="text-lg font-bold mb-2" data-testid="text-feedback-title">
            {correct ? 'Correct!' : 'Incorrect'}
          </h3>
          {correct && (
            <p className="text-muted-foreground mb-4" data-testid="text-points-earned">
              You earned ${value}
            </p>
          )}
          <div className="text-sm text-muted-foreground mb-4">
            <strong>Answer:</strong> <span data-testid="text-correct-answer">{answer}</span>
          </div>
          <Button
            onClick={onNext}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-next-question"
          >
            Next Question
          </Button>
        </div>
      </Card>
    </div>
  );
}
