import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, BookOpen, Lightbulb, Loader2, Star, TrendingUp, Zap, Gem } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { LearningMaterial } from "@shared/schema";

interface EnhancedFeedbackModalProps {
  isVisible: boolean;
  correct: boolean;
  answer: string;
  value: number;
  questionId: string;
  userAssessment: "correct" | "incorrect" | "unsure";
  onNext: () => void;
}

export default function EnhancedFeedbackModal({ 
  isVisible, 
  correct, 
  answer, 
  value, 
  questionId,
  userAssessment,
  onNext 
}: EnhancedFeedbackModalProps) {
  const [showLearningMaterial, setShowLearningMaterial] = useState(false);

  const renderCommonnessIcon = (commonness: string | undefined) => {
    switch (commonness) {
      case 'very_common':
        return <Star className="text-green-500" size={14} />;
      case 'common':
        return <TrendingUp className="text-blue-500" size={14} />;
      case 'uncommon':
        return <Zap className="text-orange-500" size={14} />;
      case 'rare':
        return <Gem className="text-purple-500" size={14} />;
      default:
        return <TrendingUp className="text-blue-500" size={14} />;
    }
  };

  // Generate learning material for incorrect/unsure answers
  const generateLearningMutation = useMutation<LearningMaterial>({
    mutationFn: async () => {
      return apiRequest("POST", "/api/learning-materials", {
        questionId,
        userWasCorrect: userAssessment === "correct"
      });
    },
  });

  // Fetch existing learning material
  const { data: existingMaterial, refetch: refetchExisting } = useQuery<LearningMaterial>({
    queryKey: [`/api/learning-materials/${questionId}`],
    enabled: false, // Don't auto-fetch, only when needed
  });

  const handleShowLearningMaterial = async () => {
    setShowLearningMaterial(true);
    
    // Try to get existing material first
    try {
      const existing = await refetchExisting();
      if (existing.data) {
        return;
      }
    } catch (error) {
      console.log('No existing material found, generating new one');
    }
    
    // Generate new material if none exists
    try {
      await generateLearningMutation.mutateAsync();
    } catch (error) {
      console.error('Error generating learning material:', error);
    }
  };

  const learningMaterial = existingMaterial || generateLearningMutation.data;
  const isGenerating = generateLearningMutation.isPending;

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      data-testid="enhanced-feedback-modal"
    >
      <Card className="p-6 max-w-2xl w-full shadow-xl my-8">
        <div className="text-center mb-6">
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
            {correct ? 'Correct!' : userAssessment === "incorrect" ? 'Incorrect' : 'Learning Opportunity'}
          </h3>
          {correct && (
            <p className="text-muted-foreground mb-4" data-testid="text-points-earned">
              You earned ${value}
            </p>
          )}
          <div className="text-sm text-muted-foreground mb-4">
            <strong>Answer:</strong> <span data-testid="text-correct-answer">{answer}</span>
          </div>
        </div>

        {/* Learning Material Section for incorrect/unsure answers */}
        {(userAssessment === "incorrect" || userAssessment === "unsure") && (
          <div className="mb-6">
            {!showLearningMaterial ? (
              <div className="text-center">
                <Button
                  onClick={handleShowLearningMaterial}
                  variant="outline"
                  className="mb-4"
                  data-testid="button-show-explanation"
                >
                  <BookOpen className="mr-2" size={16} />
                  Get Detailed Explanation
                </Button>
                <p className="text-sm text-muted-foreground">
                  Learn more about this topic with expert explanations and related facts
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Separator />
                
                {isGenerating ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    <span>Generating detailed explanation...</span>
                  </div>
                ) : learningMaterial ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Lightbulb className="mr-2 text-primary" size={20} />
                        <h4 className="font-semibold">Learning Materials</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderCommonnessIcon(learningMaterial.commonness)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {learningMaterial.commonness?.replace('_', ' ') || 'common'} topic
                        </span>
                      </div>
                    </div>
                    
                    {/* Explanation */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Explanation</h5>
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none" data-testid="text-explanation">
                        {(learningMaterial.explanation || '').split('\n').map((line, index) => (
                          <p key={index} className="mb-2">{line}</p>
                        ))}
                      </div>
                    </div>

                    {/* Related Facts */}
                    {learningMaterial.relatedFacts && learningMaterial.relatedFacts.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Related Trivia Facts</h5>
                        <div className="space-y-2">
                          {learningMaterial.relatedFacts.map((fact, index) => (
                            <div key={index} className="bg-muted/30 p-3 rounded text-sm" data-testid={`related-fact-${index}`}>
                              <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                              {fact}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources */}
                    {learningMaterial.sources && learningMaterial.sources.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Sources</h5>
                        <div className="flex flex-wrap gap-2">
                          {learningMaterial.sources.map((source, index) => (
                            <Badge key={index} variant="outline" className="text-xs" data-testid={`source-${index}`}>
                              <ExternalLink size={12} className="mr-1" />
                              <a 
                                href={source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                Source {index + 1}
                              </a>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Unable to generate learning materials at this time.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Button
          onClick={onNext}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-next-question"
        >
          Continue
        </Button>
      </Card>
    </div>
  );
}