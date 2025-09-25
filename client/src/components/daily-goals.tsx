import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Target, TrendingUp, Calendar, CheckCircle, Edit2, Save, X, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { UserGoals, GamificationStats } from "@shared/schema";

export default function DailyGoals() {
  const [isEditingDaily, setIsEditingDaily] = useState(false);
  const [isEditingStreak, setIsEditingStreak] = useState(false);
  const [dailyTarget, setDailyTarget] = useState("");
  const [streakTarget, setStreakTarget] = useState("");
  const { toast } = useToast();

  const { data: userGoals } = useQuery<UserGoals>({
    queryKey: ["/api/user-goals"],
    refetchInterval: 60000, // Reduced from 30s to 60s for cost optimization
  });

  const { data: gamificationStats } = useQuery<GamificationStats>({
    queryKey: ["/api/gamification-stats"],
    // No separate refetch - will be updated by celebration system
  });

  const updateGoalsMutation = useMutation({
    mutationFn: (goalData: Partial<UserGoals>) =>
      apiRequest("PATCH", "/api/user-goals", goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-goals"] });
      setIsEditingDaily(false);
      setIsEditingStreak(false);
      toast({
        title: "Goals Updated! 🎯",
        description: "Your daily targets have been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goals. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate smart suggestions based on current performance
  const generateSuggestions = () => {
    if (!gamificationStats || !userGoals) return null;

    const { streakInfo } = gamificationStats;
    const currentDaily = streakInfo.questionsToday;
    const currentStreak = streakInfo.dailyStreak;
    const currentGoal = userGoals.dailyQuestionGoal;

    const suggestions = [];

    // Daily questions suggestion
    if (currentDaily >= currentGoal && currentGoal < 20) {
      suggestions.push({
        type: "increase_daily",
        message: `You're crushing your ${currentGoal} question goal! Consider increasing to ${Math.min(currentGoal + 3, 20)} questions.`,
        newValue: Math.min(currentGoal + 3, 20),
        color: "from-green-500 to-teal-500"
      });
    } else if (currentDaily < currentGoal * 0.7 && currentGoal > 5) {
      suggestions.push({
        type: "decrease_daily",
        message: `Struggling with ${currentGoal} questions? Try ${Math.max(currentGoal - 2, 5)} for more consistent success.`,
        newValue: Math.max(currentGoal - 2, 5),
        color: "from-blue-500 to-cyan-500"
      });
    }

    // Streak suggestion
    if (currentStreak >= userGoals.weeklyStreakGoal && userGoals.weeklyStreakGoal < 14) {
      suggestions.push({
        type: "increase_streak",
        message: `Amazing ${currentStreak}-day streak! Challenge yourself with a ${userGoals.weeklyStreakGoal + 3}-day target.`,
        newValue: userGoals.weeklyStreakGoal + 3,
        color: "from-red-500 to-orange-500"
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  const getDailyProgress = () => {
    if (!gamificationStats || !userGoals) return { current: 0, percentage: 0 };
    
    const current = gamificationStats.streakInfo.questionsToday;
    const target = userGoals.dailyQuestionGoal;
    
    return {
      current,
      target,
      percentage: Math.min((current / target) * 100, 100),
      isComplete: current >= target
    };
  };

  const getStreakProgress = () => {
    if (!gamificationStats || !userGoals) return { current: 0, percentage: 0 };
    
    const current = gamificationStats.streakInfo.dailyStreak;
    const target = userGoals.weeklyStreakGoal;
    
    return {
      current,
      target,
      percentage: Math.min((current / target) * 100, 100),
      isComplete: current >= target
    };
  };

  const dailyProgress = getDailyProgress();
  const streakProgress = getStreakProgress();

  const handleUpdateDaily = () => {
    const value = parseInt(dailyTarget);
    if (isNaN(value) || value < 1 || value > 50) {
      toast({
        title: "Invalid Goal",
        description: "Please enter a value between 1 and 50.",
        variant: "destructive",
      });
      return;
    }
    updateGoalsMutation.mutate({ dailyQuestionGoal: value });
  };

  const handleUpdateStreak = () => {
    const value = parseInt(streakTarget);
    if (isNaN(value) || value < 1 || value > 365) {
      toast({
        title: "Invalid Goal",
        description: "Please enter a value between 1 and 365.",
        variant: "destructive",
      });
      return;
    }
    updateGoalsMutation.mutate({ weeklyStreakGoal: value });
  };

  const applySuggestion = (suggestion: any) => {
    if (suggestion.type.includes("daily")) {
      updateGoalsMutation.mutate({ dailyQuestionGoal: suggestion.newValue });
    } else if (suggestion.type.includes("streak")) {
      updateGoalsMutation.mutate({ weeklyStreakGoal: suggestion.newValue });
    }
  };

  if (!userGoals || !gamificationStats) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="daily-goals">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Target className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Daily Goals
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your daily practice and streak targets
        </p>
      </div>

      {/* Current Goals */}
      <div className="grid gap-4">
        {/* Daily Questions Goal */}
        <Card className={cn(
          "p-4 transition-all",
          dailyProgress.isComplete 
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-white dark:bg-gray-800"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Daily Questions
                </h3>
                <p className="text-sm text-gray-500">
                  Target: {userGoals.dailyQuestionGoal} questions per day
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dailyProgress.isComplete && (
                <Badge className="bg-green-500 text-white">
                  Complete! 🎉
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDailyTarget(userGoals.dailyQuestionGoal.toString());
                  setIsEditingDaily(!isEditingDaily);
                }}
                data-testid="edit-daily-goal"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Today's Progress
              </span>
              <span className="text-sm text-gray-500">
                {dailyProgress.current} / {dailyProgress.target}
              </span>
            </div>
            <Progress value={dailyProgress.percentage} className="h-3" />
            <div className="text-center mt-1">
              <span className="text-xs text-gray-500">
                {Math.round(dailyProgress.percentage)}% complete
              </span>
            </div>
          </div>

          {/* Edit Mode */}
          {isEditingDaily && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Input
                type="number"
                min="1"
                max="50"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                placeholder="New target"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateDaily();
                }}
                data-testid="daily-goal-input"
              />
              <Button
                size="sm"
                onClick={handleUpdateDaily}
                disabled={updateGoalsMutation.isPending}
                data-testid="save-daily-goal"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingDaily(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Streak Goal */}
        <Card className={cn(
          "p-4 transition-all",
          streakProgress.isComplete 
            ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
            : "bg-white dark:bg-gray-800"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Streak Goal
                </h3>
                <p className="text-sm text-gray-500">
                  Target: {userGoals.weeklyStreakGoal} day streak
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {streakProgress.isComplete && (
                <Badge className="bg-orange-500 text-white">
                  Achieved! 🔥
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStreakTarget(userGoals.weeklyStreakGoal.toString());
                  setIsEditingStreak(!isEditingStreak);
                }}
                data-testid="edit-streak-goal"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Streak
              </span>
              <span className="text-sm text-gray-500">
                {streakProgress.current} / {streakProgress.target} days
              </span>
            </div>
            <Progress value={streakProgress.percentage} className="h-3" />
            <div className="text-center mt-1">
              <span className="text-xs text-gray-500">
                {Math.round(streakProgress.percentage)}% complete
              </span>
            </div>
          </div>

          {/* Edit Mode */}
          {isEditingStreak && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Input
                type="number"
                min="1"
                max="365"
                value={streakTarget}
                onChange={(e) => setStreakTarget(e.target.value)}
                placeholder="New target"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateStreak();
                }}
                data-testid="streak-goal-input"
              />
              <Button
                size="sm"
                onClick={handleUpdateStreak}
                disabled={updateGoalsMutation.isPending}
                data-testid="save-streak-goal"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingStreak(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Smart Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <TrendingUp className="w-5 h-5" />
            Smart Suggestions
          </h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border"
                data-testid={`suggestion-${suggestion.type}`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  💡 {suggestion.message}
                </p>
                <Button
                  size="sm"
                  onClick={() => applySuggestion(suggestion)}
                  disabled={updateGoalsMutation.isPending}
                  className={cn(
                    "bg-gradient-to-r text-white",
                    suggestion.color
                  )}
                  data-testid={`apply-suggestion-${suggestion.type}`}
                >
                  Apply Suggestion
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}