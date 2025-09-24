import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Target, Trophy, Clock, Brain } from "lucide-react";
import StreakIndicator, { StreakCard } from "@/components/streak-indicator";
import DailyGoals from "@/components/daily-goals";
import type { CategoryStats, DailyStats, ReadinessScore, GamificationStats } from "@shared/schema";

export default function StatsDashboard() {
  const { data: overallStats } = useQuery<{
    totalQuestions: number;
    overallAccuracy: number;
    currentStreak: number;
    totalStudyTime: number;
  }>({
    queryKey: ["/api/stats/overall"],
  });

  const { data: categoryStats } = useQuery<CategoryStats[]>({
    queryKey: ["/api/stats/categories"],
  });

  const { data: dailyStats } = useQuery<DailyStats[]>({
    queryKey: ["/api/stats/daily"],
  });

  const { data: readinessData } = useQuery<ReadinessScore>({
    queryKey: ["/api/readiness"],
  });

  const { data: gamificationStats } = useQuery<GamificationStats>({
    queryKey: ["/api/gamification-stats"],
  });

  return (
    <section className="p-4" data-testid="stats-dashboard">
      <h2 className="text-xl font-bold mb-4">Jeopardy Anytime! Test Readiness</h2>
      
      {/* Overall Readiness Score */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="text-primary mr-2" size={24} />
            <span className="text-lg font-semibold">Test Readiness Score</span>
          </div>
          <div className="text-4xl font-bold text-primary mb-2" data-testid="readiness-overall-score">
            {readinessData ? `${readinessData.overallScore.toFixed(1)}%` : "0.0%"}
          </div>
          <div className="text-lg font-medium mb-3" data-testid="readiness-letter-grade">
            Grade: {readinessData?.letterGrade || "F"}
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            (readinessData?.overallScore || 0) >= 80 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : (readinessData?.overallScore || 0) >= 70
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`} data-testid="readiness-status">
            {(readinessData?.overallScore || 0) >= 80 ? "Ready for Anytime! Test" : 
             (readinessData?.overallScore || 0) >= 70 ? "Nearly Ready - Keep Practicing" : 
             "More Practice Needed"}
          </div>
        </div>
      </Card>

      {/* Component Breakdown */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-4 flex items-center">
          <Brain className="mr-2" size={20} />
          Readiness Component Breakdown
        </h3>
        <div className="space-y-4">
          {readinessData?.components.map((component, index) => {
            const getIcon = (name: string) => {
              if (name.toLowerCase().includes('anytime') || name.toLowerCase().includes('test')) {
                return <Trophy className="mr-2 text-yellow-500" size={16} />;
              } else if (name.toLowerCase().includes('game') || name.toLowerCase().includes('practice')) {
                return <Target className="mr-2 text-blue-500" size={16} />;
              } else if (name.toLowerCase().includes('spaced') || name.toLowerCase().includes('repetition')) {
                return <Clock className="mr-2 text-green-500" size={16} />;
              }
              return <Brain className="mr-2 text-gray-500" size={16} />;
            };

            return (
              <div key={index} data-testid={`component-${component.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center">
                    {getIcon(component.name)}
                    {component.name} ({Math.round(component.weight * 100)}%)
                  </span>
                  <span className="text-sm font-medium" data-testid={`score-${component.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    {component.score.toFixed(1)}%
                  </span>
                </div>
                <Progress value={component.score} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {component.description}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Category Coverage */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-4 flex items-center">
          <CheckCircle className="mr-2" size={20} />
          Category Coverage for Test Readiness
        </h3>
        <div className="text-sm text-muted-foreground mb-4">
          Minimum 6 categories needed for full readiness. Coverage affects your final score.
        </div>
        <div className="space-y-3">
          {categoryStats?.map((category) => {
            const isCovered = category.totalQuestions >= 5; // Minimum threshold for coverage
            const isStrong = category.accuracy >= 75;
            
            return (
              <div key={category.categoryId} data-testid={`category-coverage-${category.categoryId}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {isCovered ? (
                      <CheckCircle className="mr-2 text-green-500" size={16} />
                    ) : (
                      <AlertCircle className="mr-2 text-red-500" size={16} />
                    )}
                    <span className="font-medium" data-testid={`text-category-${category.categoryId}`}>
                      {category.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      isStrong ? 'text-green-600' : category.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`} data-testid={`text-accuracy-${category.categoryId}`}>
                      {Math.round(category.accuracy)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({category.totalQuestions})
                    </span>
                  </div>
                </div>
                <Progress 
                  value={category.accuracy} 
                  className="h-1.5"
                />
                <div className="text-xs text-muted-foreground mt-1" data-testid={`text-status-${category.categoryId}`}>
                  {!isCovered ? "⚠️ Needs more practice (5+ questions required)" :
                   isStrong ? "✅ Strong performance" :
                   category.accuracy >= 60 ? "⏳ Room for improvement" :
                   "❌ Requires focused study"}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Coverage Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium mb-1">Coverage Summary</div>
          <div className="text-xs text-muted-foreground">
            Categories covered: {categoryStats?.filter(c => c.totalQuestions >= 5).length || 0} / {categoryStats?.length || 0}
            {(categoryStats?.filter(c => c.totalQuestions >= 5).length || 0) < 6 && (
              <span className="text-yellow-600 ml-2">
                ⚠️ Need {6 - (categoryStats?.filter(c => c.totalQuestions >= 5).length || 0)} more for full readiness
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Test Readiness Recommendations */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-4 flex items-center">
          <AlertCircle className="mr-2" size={20} />
          Readiness Recommendations
        </h3>
        <div className="space-y-3">
          {/* Dynamic recommendations based on readiness score */}
          {readinessData && (readinessData.overallScore || 0) < 80 && (
            <div className="space-y-2">
              {/* Check for low Anytime Test component */}
              {readinessData?.components.find(c => c.name.toLowerCase().includes('anytime') || c.name.toLowerCase().includes('test'))?.score < 60 && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Trophy className="text-yellow-500 mt-0.5" size={16} />
                  <div>
                    <div className="text-sm font-medium">Practice Anytime! Test Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Take more 50-question, 15-second practice tests to improve speed and accuracy
                    </div>
                  </div>
                </div>
              )}
              
              {/* Category coverage check */}
              {(readinessData?.categoryBreadth.coveredCategories || 0) < (readinessData?.categoryBreadth.requiredCategories || 6) && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <CheckCircle className="text-red-500 mt-0.5" size={16} />
                  <div>
                    <div className="text-sm font-medium">Expand Category Coverage</div>
                    <div className="text-xs text-muted-foreground">
                      Practice in {(readinessData?.categoryBreadth.requiredCategories || 6) - (readinessData?.categoryBreadth.coveredCategories || 0)} more categories for full readiness
                    </div>
                  </div>
                </div>
              )}
              
              {/* Check for low Game Mode component */}
              {readinessData && readinessData.components.find(c => c.name.toLowerCase().includes('game') || c.name.toLowerCase().includes('practice'))?.score < 50 && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Target className="text-blue-500 mt-0.5" size={16} />
                  <div>
                    <div className="text-sm font-medium">Increase Regular Practice</div>
                    <div className="text-xs text-muted-foreground">
                      More game board and rapid-fire sessions will improve your foundation
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {(readinessData?.overallScore || 0) >= 80 && (
            <div className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="text-green-500 mt-0.5" size={16} />
              <div>
                <div className="text-sm font-medium">Ready for Anytime! Test</div>
                <div className="text-xs text-muted-foreground">
                  You're well-prepared! Consider taking the official test or maintaining practice to stay sharp.
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Streak Overview */}
      {gamificationStats && (
        <StreakCard
          dailyStreak={gamificationStats.streakInfo.dailyStreak}
          weeklyStreak={gamificationStats.streakInfo.weeklyStreak}
          monthlyStreak={gamificationStats.streakInfo.monthlyStreak}
          longestStreak={gamificationStats.streakInfo.longestDailyStreak}
          goalProgress={gamificationStats.streakInfo.goalProgress}
          questionsToday={gamificationStats.streakInfo.questionsToday}
          todayComplete={gamificationStats.streakInfo.todayComplete}
        />
      )}

      {/* Daily Goals */}
      <DailyGoals />

      {/* Performance Summary */}
      <Card className="p-4">
        <h3 className="font-bold mb-4 flex items-center">
          <Clock className="mr-2" size={20} />
          Performance Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="stat-total-questions">
              {overallStats?.totalQuestions || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent" data-testid="stat-overall-accuracy">
              {Math.round(overallStats?.overallAccuracy || 0)}%
            </div>
            <div className="text-sm text-muted-foreground">Overall Accuracy</div>
          </div>
          <div className="flex justify-center" data-testid="stat-current-streak">
            <StreakIndicator
              streakValue={overallStats?.currentStreak || 0}
              streakType="daily"
              goalProgress={gamificationStats?.streakInfo.goalProgress || 0}
              size="large"
              animated={true}
              showProgress={true}
              showLabel={true}
            />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="stat-study-time">
              {overallStats?.totalStudyTime || 0}h
            </div>
            <div className="text-sm text-muted-foreground">Study Time</div>
          </div>
        </div>
      </Card>
    </section>
  );
}
