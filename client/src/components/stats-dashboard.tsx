import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { CategoryStats, DailyStats } from "@shared/schema";

export default function StatsDashboard() {
  const { data: overallStats } = useQuery({
    queryKey: ["/api/stats/overall"],
  });

  const { data: categoryStats } = useQuery<CategoryStats[]>({
    queryKey: ["/api/stats/categories"],
  });

  const { data: dailyStats } = useQuery<DailyStats[]>({
    queryKey: ["/api/stats/daily"],
  });

  return (
    <section className="p-4" data-testid="stats-dashboard">
      <h2 className="text-xl font-bold mb-4">Performance Analytics</h2>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary" data-testid="stat-total-questions">
            {overallStats?.totalQuestions || 0}
          </div>
          <div className="text-sm text-muted-foreground">Questions Answered</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-accent" data-testid="stat-overall-accuracy">
            {Math.round(overallStats?.overallAccuracy || 0)}%
          </div>
          <div className="text-sm text-muted-foreground">Overall Accuracy</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-secondary" data-testid="stat-current-streak">
            {overallStats?.currentStreak || 0}
          </div>
          <div className="text-sm text-muted-foreground">Current Streak</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary" data-testid="stat-study-time">
            {overallStats?.totalStudyTime || 0}h
          </div>
          <div className="text-sm text-muted-foreground">Study Time</div>
        </Card>
      </div>

      {/* Category Performance */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-4">Category Performance</h3>
        <div className="space-y-4">
          {categoryStats?.map((category) => (
            <div key={category.categoryId} data-testid={`category-stat-${category.categoryId}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium" data-testid={`text-category-${category.categoryId}`}>
                  {category.categoryName}
                </span>
                <span className="text-sm text-muted-foreground" data-testid={`text-accuracy-${category.categoryId}`}>
                  {Math.round(category.accuracy)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    category.accuracy >= 75 ? 'bg-primary' : 
                    category.accuracy >= 60 ? 'bg-accent' : 'bg-destructive'
                  }`}
                  style={{ width: `${category.accuracy}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1" data-testid={`text-questions-${category.categoryId}`}>
                {category.totalQuestions} questions
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 7-Day Progress Chart */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-4">7-Day Progress</h3>
        <div className="h-32 flex items-end space-x-2" data-testid="chart-daily-progress">
          {dailyStats?.slice(-7).map((day, index) => {
            const maxQuestions = Math.max(...(dailyStats?.map(d => d.questionsAnswered) || [1]));
            const height = maxQuestions > 0 ? (day.questionsAnswered / maxQuestions) * 100 : 0;
            
            return (
              <div
                key={day.date}
                className={`flex-1 rounded-t transition-all duration-500 ${
                  day.questionsAnswered > 0 ? 'bg-primary' : 'bg-muted'
                }`}
                style={{ height: `${Math.max(height, 5)}%` }}
                data-testid={`chart-bar-${index}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <span key={day} data-testid={`chart-label-${index}`}>{day}</span>
          ))}
        </div>
      </Card>

      {/* Spaced Repetition Status */}
      <Card className="p-4">
        <h3 className="font-bold mb-4">Spaced Repetition Queue</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between" data-testid="sr-due-today">
            <span className="text-sm">Due Today</span>
            <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
              5
            </span>
          </div>
          <div className="flex items-center justify-between" data-testid="sr-due-tomorrow">
            <span className="text-sm">Due Tomorrow</span>
            <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
              3
            </span>
          </div>
          <div className="flex items-center justify-between" data-testid="sr-due-week">
            <span className="text-sm">This Week</span>
            <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-medium">
              12
            </span>
          </div>
        </div>
      </Card>
    </section>
  );
}
