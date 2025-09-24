import { useState } from "react";
import { Flame, TrendingUp, Calendar, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StreakIndicatorProps {
  streakValue: number;
  streakType?: "daily" | "weekly" | "monthly";
  goalProgress?: number; // 0-100 percentage
  maxValue?: number; // for progress ring calculation
  size?: "small" | "medium" | "large";
  showProgress?: boolean;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function StreakIndicator({
  streakValue,
  streakType = "daily",
  goalProgress = 0,
  maxValue,
  size = "medium",
  showProgress = true,
  showLabel = true,
  animated = true,
  className,
  onClick
}: StreakIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return {
          container: "w-16 h-16",
          flame: "text-2xl",
          text: "text-xs font-bold",
          subtext: "text-xs",
          progress: "stroke-[3]"
        };
      case "large":
        return {
          container: "w-24 h-24",
          flame: "text-5xl",
          text: "text-xl font-bold",
          subtext: "text-sm",
          progress: "stroke-[4]"
        };
      default: // medium
        return {
          container: "w-20 h-20",
          flame: "text-3xl",
          text: "text-lg font-bold",
          subtext: "text-sm",
          progress: "stroke-[3]"
        };
    }
  };

  const getStreakColor = () => {
    if (streakValue === 0) return "text-gray-400";
    if (streakValue < 3) return "text-orange-500";
    if (streakValue < 7) return "text-red-500";
    if (streakValue < 15) return "text-red-600";
    return "text-red-700";
  };

  const getFlameEmoji = () => {
    if (streakValue === 0) return "🌫️";
    if (streakValue < 3) return "🔥";
    if (streakValue < 7) return "🔥🔥";
    if (streakValue < 15) return "🔥🔥🔥";
    return "🔥🔥🔥🔥";
  };

  const getProgressRingColor = () => {
    if (streakValue === 0) return "#9CA3AF";
    if (streakValue < 3) return "#F97316";
    if (streakValue < 7) return "#EF4444";
    if (streakValue < 15) return "#DC2626";
    return "#B91C1C";
  };

  const sizeClasses = getSizeClasses();
  
  // Calculate progress ring percentage
  const progressPercent = maxValue 
    ? Math.min((streakValue / maxValue) * 100, 100)
    : goalProgress;

  const circumference = 2 * Math.PI * 30; // radius of 30
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
        animated && isHovered && "scale-110",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`streak-indicator-${streakType}`}
    >
      {/* Progress Ring */}
      {showProgress && (
        <div className={cn("relative", sizeClasses.container)}>
          <svg
            className="transform -rotate-90 w-full h-full"
            viewBox="0 0 70 70"
          >
            {/* Background ring */}
            <circle
              cx="35"
              cy="35"
              r="30"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress ring */}
            <circle
              cx="35"
              cy="35"
              r="30"
              stroke={getProgressRingColor()}
              strokeWidth="3"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-500 ease-out",
                animated && "animate-pulse"
              )}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Flame emoji */}
            <div className={cn(sizeClasses.flame, "leading-none mb-1")}>
              {getFlameEmoji()}
            </div>
            
            {/* Streak number */}
            <div className={cn(sizeClasses.text, getStreakColor(), "leading-none")}>
              {streakValue}
            </div>
          </div>
        </div>
      )}

      {/* Without progress ring (simple version) */}
      {!showProgress && (
        <div className={cn("flex items-center gap-2", sizeClasses.container)}>
          <span className={cn(sizeClasses.flame, "leading-none")}>
            {getFlameEmoji()}
          </span>
          <span className={cn(sizeClasses.text, getStreakColor())}>
            {streakValue}
          </span>
        </div>
      )}

      {/* Label */}
      {showLabel && (
        <div className="text-center mt-2">
          <div className={cn(sizeClasses.subtext, "text-gray-600 dark:text-gray-400 capitalize font-medium")}>
            {streakType} Streak
          </div>
          {goalProgress > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(goalProgress)}% to goal
            </div>
          )}
        </div>
      )}

      {/* Hover effects */}
      {isHovered && animated && streakValue > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-20" />
          <div className="animate-pulse absolute inset-0 rounded-full bg-orange-400 opacity-30" />
        </div>
      )}
    </div>
  );
}

// Enhanced Streak Card Component
interface StreakCardProps {
  dailyStreak: number;
  weeklyStreak: number;
  monthlyStreak: number;
  longestStreak: number;
  goalProgress: number;
  questionsToday: number;
  todayComplete: boolean;
}

export function StreakCard({
  dailyStreak,
  weeklyStreak,
  monthlyStreak,
  longestStreak,
  goalProgress,
  questionsToday,
  todayComplete
}: StreakCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Streak Overview
          </h3>
        </div>
        {todayComplete && (
          <Badge className="bg-green-500 text-white">
            Goal Complete! 🎉
          </Badge>
        )}
      </div>

      {/* Main streak indicators */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StreakIndicator
          streakValue={dailyStreak}
          streakType="daily"
          goalProgress={goalProgress}
          size="medium"
          animated={true}
        />
        <StreakIndicator
          streakValue={weeklyStreak}
          streakType="weekly"
          size="medium"
          animated={true}
        />
        <StreakIndicator
          streakValue={monthlyStreak}
          streakType="monthly"
          size="medium"
          animated={true}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {longestStreak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Longest Streak
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {questionsToday}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Questions Today
          </div>
        </div>
      </div>

      {/* Progress to daily goal */}
      {!todayComplete && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Daily Goal Progress
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(goalProgress)}%
            </span>
          </div>
          <Progress value={goalProgress} className="h-2 bg-gray-200 dark:bg-gray-700" />
        </div>
      )}
    </Card>
  );
}