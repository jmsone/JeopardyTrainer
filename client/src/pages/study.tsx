import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookOpen, Brain, ExternalLink, Plus, Loader2, CheckCircle, XCircle, HelpCircle, ChevronLeft, Star, TrendingUp, Zap, Gem } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StudyReview, StudyMaterial, Category, QuestionWithLearning } from "@shared/schema";

export default function StudyPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [studyTopic, setStudyTopic] = useState("");
  const [, setLocation] = useLocation();

  const processContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmed = line.trim();
      
      // Filter out unwanted sections
      if (trimmed.toLowerCase().includes('why this is correct') || 
          trimmed.length < 10 || 
          trimmed.match(/^[A-Z][a-z]{1,4}$/) ||
          trimmed.endsWith('...') ||
          (trimmed.length < 50 && trimmed.split(' ').length < 5)) {
        return null;
      }
      
      // Handle bold headers
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <h4 key={index} className="font-semibold mt-3 mb-1 text-primary text-sm">{trimmed.slice(2, -2)}</h4>;
      } 
      // Handle bullet points with indentation
      else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        return <li key={index} className="ml-6 mb-1 text-sm list-disc">{trimmed.slice(1).trim()}</li>;
      } 
      // Handle inline bold text
      else if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        return (
          <p key={index} className="mb-1 text-sm leading-snug">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? 
                <strong key={partIndex} className="font-semibold">{part}</strong> : 
                part
            )}
          </p>
        );
      } 
      // Regular text
      else if (trimmed.length > 0) {
        return <p key={index} className="mb-1 text-sm leading-snug">{trimmed}</p>;
      }
      return null;
    }).filter(Boolean);
  };

  // Fetch categories for study material generation
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch study review (questions with learning materials by assessment)
  const { data: studyReview, isLoading: isLoadingReview } = useQuery<StudyReview>({
    queryKey: ["/api/study-review"],
  });

  // Fetch general study materials
  const { data: studyMaterials = [], isLoading: isLoadingMaterials, refetch: refetchMaterials } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/study-materials"],
  });

  // Generate new study material
  const generateStudyMutation = useMutation<StudyMaterial, Error, { category: string; topic?: string }>({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/study-materials", data);
    },
    onSuccess: () => {
      refetchMaterials();
      setStudyTopic("");
    },
  });

  const handleGenerateStudyMaterial = () => {
    if (!selectedCategory) return;
    generateStudyMutation.mutate({
      category: selectedCategory,
      topic: studyTopic || undefined,
    });
  };

  const renderQuestionCard = (question: QuestionWithLearning, index: number) => (
    <Card key={`${question.id}-${index}`} className="p-4 mb-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{question.category.name}</Badge>
          <span className="text-sm font-semibold">${question.value}</span>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium text-sm">{question.text}</p>
          <p className="text-sm text-muted-foreground">
            <strong>Answer:</strong> {question.answer}
          </p>
        </div>

        {question.learningMaterial && (
          <div className="bg-muted/50 p-3 rounded space-y-2">
            <h5 className="font-medium text-sm flex items-center">
              <BookOpen size={14} className="mr-1" />
              Learning Material
            </h5>
            <div className="text-xs">
              {processContent(question.learningMaterial.explanation)}
            </div>
            
            {question.learningMaterial.relatedFacts.length > 0 && (
              <div className="space-y-1">
                <h6 className="font-medium text-xs">Related Facts:</h6>
                {question.learningMaterial.relatedFacts
                  .filter(fact => {
                    const trimmed = fact.trim();
                    return trimmed.length >= 10 && 
                           !trimmed.toLowerCase().includes('why this is correct') &&
                           !trimmed.endsWith('...') &&
                           !(trimmed.length < 50 && trimmed.split(' ').length < 5);
                  })
                  .slice(0, 2)
                  .map((fact, factIndex) => (
                  <div key={factIndex} className="text-xs text-muted-foreground">
                    <span className="inline-block w-1 h-1 bg-muted-foreground rounded-full mr-2"></span>
                    <span className="inline">
                      {fact.includes('**') ? (
                        fact.split('**').map((part, partIndex) => 
                          partIndex % 2 === 1 ? 
                            <strong key={partIndex} className="font-semibold">{part}</strong> : 
                            part
                        )
                      ) : fact}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-20" data-testid="study-page">
      {/* Header with navigation */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="flex items-center mr-4"
          data-testid="button-back-to-game"
        >
          <ChevronLeft className="mr-1" size={20} />
          Back to Game
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">Study Center</h1>
          <p className="text-muted-foreground">
            Review your practice questions and explore study materials to improve your Jeopardy knowledge.
          </p>
        </div>
      </div>

      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review" data-testid="tab-review">
            <Brain className="mr-2" size={16} />
            Question Review
          </TabsTrigger>
          <TabsTrigger value="materials" data-testid="tab-materials">
            <BookOpen className="mr-2" size={16} />
            Study Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-6" data-testid="tab-content-review">
          {isLoadingReview ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 animate-spin" size={20} />
              <span>Loading your study review...</span>
            </div>
          ) : !studyReview || (studyReview.correct.length === 0 && studyReview.incorrect.length === 0 && studyReview.unsure.length === 0) ? (
            <Card className="p-8 text-center">
              <Brain className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Practice Questions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start practicing with the game board or rapid-fire mode to build your study review.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Incorrect Questions */}
              {studyReview.incorrect.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <XCircle className="mr-2 text-red-500" size={20} />
                    <h2 className="text-lg font-semibold">Questions to Review ({studyReview.incorrect.length})</h2>
                  </div>
                  <div className="space-y-4">
                    {studyReview.incorrect.map(renderQuestionCard)}
                  </div>
                </div>
              )}

              {/* Unsure Questions */}
              {studyReview.unsure.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <HelpCircle className="mr-2 text-orange-500" size={20} />
                    <h2 className="text-lg font-semibold">Questions You Were Unsure About ({studyReview.unsure.length})</h2>
                  </div>
                  <div className="space-y-4">
                    {studyReview.unsure.map(renderQuestionCard)}
                  </div>
                </div>
              )}

              {/* Correct Questions */}
              {studyReview.correct.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <CheckCircle className="mr-2 text-green-500" size={20} />
                    <h2 className="text-lg font-semibold">Questions You Got Right ({studyReview.correct.length})</h2>
                  </div>
                  <div className="space-y-4">
                    {studyReview.correct.map(renderQuestionCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-6" data-testid="tab-content-materials">
          {/* Generate New Study Material */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Plus className="mr-2 text-primary" size={20} />
                <h3 className="text-lg font-semibold">Generate Study Material</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} data-testid="select-category">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Specific Topic (Optional)</label>
                  <Input
                    value={studyTopic}
                    onChange={(e) => setStudyTopic(e.target.value)}
                    placeholder="e.g., Napoleon Bonaparte, DNA structure"
                    data-testid="input-topic"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleGenerateStudyMaterial}
                disabled={!selectedCategory || generateStudyMutation.isPending}
                data-testid="button-generate-material"
              >
                {generateStudyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2" size={16} />
                    Generate Study Material
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Study Materials List */}
          {isLoadingMaterials ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 animate-spin" size={20} />
              <span>Loading study materials...</span>
            </div>
          ) : studyMaterials.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Study Materials Yet</h3>
              <p className="text-muted-foreground">
                Generate your first study material by selecting a category above.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Study Materials</h3>
              {studyMaterials.map((material) => (
                <Card key={material.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{material.category}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(material.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-lg">{material.title}</h4>
                    
                    <div className="prose prose-sm max-w-none">
                      {processContent(material.content)}
                    </div>
                    
                    {material.relatedTopics.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Related Topics:</h5>
                        <div className="flex flex-wrap gap-1">
                          {material.relatedTopics.map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {material.sources.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Sources:</h5>
                        <div className="flex flex-wrap gap-2">
                          {material.sources.map((source, index) => (
                            <a
                              key={index}
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center"
                            >
                              <ExternalLink size={12} className="mr-1" />
                              Source {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}