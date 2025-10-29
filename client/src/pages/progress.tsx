import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CategoryMastery {
  id: string;
  userId: string;
  categoryName: string;
  totalCorrect: number;
  totalAnswered: number;
  weightedCorrectScore: number;
  masteryLevel: 'novice' | 'intermediate' | 'proficient' | 'expert' | 'master';
  lastAnswered: string | null;
  updatedAt: string;
}

const masteryLevelConfig = {
  novice: { color: "bg-gray-400 dark:bg-gray-600", label: "Novice", emoji: "🌱" },
  intermediate: { color: "bg-blue-400 dark:bg-blue-600", label: "Intermediate", emoji: "📚" },
  proficient: { color: "bg-purple-400 dark:bg-purple-600", label: "Proficient", emoji: "🎯" },
  expert: { color: "bg-orange-400 dark:bg-orange-600", label: "Expert", emoji: "⭐" },
  master: { color: "bg-amber-400 dark:bg-amber-600", label: "Master", emoji: "🏆" },
};

export default function ProgressPage() {
  const { data: masteryRecords, isLoading, isError, error, refetch } = useQuery<CategoryMastery[]>({
    queryKey: ['/api/category-mastery'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#04364A] to-[#176B87] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-white text-center py-12" data-testid="loading-progress">
            Loading your progress...
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#04364A] to-[#176B87] p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/95 dark:bg-[#04364A]/95 border-red-500" data-testid="error-progress">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 text-2xl">
                Failed to Load Progress
              </CardTitle>
              <CardDescription>
                We couldn't retrieve your category mastery data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "An unexpected error occurred"}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-[#176B87] hover:bg-[#04364A] text-white rounded-lg transition-colors"
                data-testid="button-retry-progress"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const sortedRecords = [...(masteryRecords || [])].sort((a, b) => 
    b.weightedCorrectScore - a.weightedCorrectScore
  );

  const totalCategories = 24; // All Open Trivia DB categories
  const practicedCategories = sortedRecords.length;
  const averageMastery = sortedRecords.length > 0
    ? sortedRecords.reduce((sum, r) => sum + r.weightedCorrectScore, 0) / sortedRecords.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#04364A] to-[#176B87] dark:from-[#02242E] dark:to-[#0D4456] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white dark:text-[#DAFFFB]">
            Category Mastery
          </h1>
          <p className="text-lg text-[#64CCC5] dark:text-[#64CCC5]">
            Track your progress across all trivia categories
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-categories-practiced" className="bg-white/95 dark:bg-[#04364A]/95 border-[#176B87]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Categories Practiced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#04364A] dark:text-[#DAFFFB]">
                {practicedCategories} / {totalCategories}
              </div>
              <Progress 
                value={(practicedCategories / totalCategories) * 100} 
                className="mt-2 h-2"
                data-testid="progress-categories-breadth"
              />
            </CardContent>
          </Card>

          <Card data-testid="card-average-mastery" className="bg-white/95 dark:bg-[#04364A]/95 border-[#176B87]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Average Mastery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#04364A] dark:text-[#DAFFFB]">
                {averageMastery.toFixed(1)}%
              </div>
              <Progress 
                value={averageMastery} 
                className="mt-2 h-2"
                data-testid="progress-average-mastery"
              />
            </CardContent>
          </Card>

          <Card data-testid="card-total-answers" className="bg-white/95 dark:bg-[#04364A]/95 border-[#176B87]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Total Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#04364A] dark:text-[#DAFFFB]">
                {sortedRecords.reduce((sum, r) => sum + r.totalAnswered, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {sortedRecords.reduce((sum, r) => sum + r.totalCorrect, 0)} correct
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="bg-white/95 dark:bg-[#04364A]/95 border-[#176B87]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#04364A] dark:text-[#DAFFFB]">
              Your Categories
            </CardTitle>
            <CardDescription className="dark:text-[#64CCC5]">
              Detailed breakdown of your performance in each category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">No practice data yet!</p>
                <p className="text-sm">Start answering questions to track your category mastery.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedRecords.map((record) => {
                  const config = masteryLevelConfig[record.masteryLevel];
                  const accuracy = record.totalAnswered > 0 
                    ? (record.totalCorrect / record.totalAnswered) * 100 
                    : 0;

                  return (
                    <div 
                      key={record.id}
                      data-testid={`category-${record.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                      className="p-4 rounded-lg bg-gradient-to-r from-[#64CCC5]/10 to-[#DAFFFB]/10 dark:from-[#176B87]/20 dark:to-[#04364A]/20 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Category Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl" aria-label={config.label}>
                              {config.emoji}
                            </span>
                            <div>
                              <h3 className="text-lg font-semibold text-[#04364A] dark:text-[#DAFFFB] truncate">
                                {record.categoryName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  className={`${config.color} text-white text-xs`}
                                  data-testid={`badge-mastery-${record.masteryLevel}`}
                                >
                                  {config.label}
                                </Badge>
                                {record.lastAnswered && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(record.lastAnswered), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Time-Weighted Mastery</span>
                              <span className="font-semibold text-[#176B87] dark:text-[#64CCC5]">
                                {record.weightedCorrectScore.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={record.weightedCorrectScore} 
                              className="h-2"
                              data-testid="progress-weighted-mastery"
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 text-center sm:text-left">
                          <div>
                            <div className="text-2xl font-bold text-[#04364A] dark:text-[#DAFFFB]">
                              {record.totalAnswered}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Answered
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-[#176B87] dark:text-[#64CCC5]">
                              {accuracy.toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Accuracy
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unpracticed Categories */}
        {practicedCategories < totalCategories && (
          <Card className="bg-white/95 dark:bg-[#04364A]/95 border-[#176B87]">
            <CardHeader>
              <CardTitle className="text-xl text-[#04364A] dark:text-[#DAFFFB]">
                Expand Your Knowledge
              </CardTitle>
              <CardDescription className="dark:text-[#64CCC5]">
                {totalCategories - practicedCategories} categories waiting to be explored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Continue playing to discover new categories and increase your breadth score!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
