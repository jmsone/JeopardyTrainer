import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Zap } from "lucide-react";
import type { Category } from "@shared/schema";

interface RapidFireSettingsProps {
  onStart: (settings: { selectedCategories: string[]; questionCount: number }) => void;
  onBack: () => void;
}

export default function RapidFireSettings({ onStart, onBack }: RapidFireSettingsProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(cat => cat.id));
    }
  };

  const handleStart = () => {
    onStart({
      selectedCategories: selectedCategories.length > 0 ? selectedCategories : categories.map(cat => cat.id),
      questionCount,
    });
  };

  return (
    <section className="p-4" data-testid="rapid-fire-settings">
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
          <div className="text-sm text-muted-foreground">Rapid Fire</div>
          <div className="font-bold">Settings</div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-6">
        {/* Question Count */}
        <Card className="p-4">
          <h3 className="font-bold mb-3">Number of Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((count) => (
              <Button
                key={count}
                variant={questionCount === count ? "default" : "outline"}
                onClick={() => setQuestionCount(count)}
                data-testid={`button-count-${count}`}
              >
                {count}
              </Button>
            ))}
          </div>
        </Card>

        {/* Category Selection */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Categories</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              data-testid="button-select-all"
            >
              {selectedCategories.length === categories.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  data-testid={`checkbox-${category.id}`}
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>

          {selectedCategories.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              No categories selected. All categories will be included.
            </p>
          )}
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          size="lg"
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          data-testid="button-start-rapid-fire"
        >
          <Zap className="mr-2" size={20} />
          Start Rapid Fire ({questionCount} questions)
        </Button>
      </div>
    </section>
  );
}