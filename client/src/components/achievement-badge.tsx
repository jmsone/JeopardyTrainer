import { useState } from "react";
import { Crown, Lock, Star, Target, Trophy, Zap, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AchievementWithProgress } from "@shared/schema";

interface AchievementBadgeProps {
  achievement: AchievementWithProgress;
  size?: "small" | "medium" | "large";
  showProgress?: boolean;
  onClick?: () => void;
}

export default function AchievementBadge({ 
  achievement, 
  size = "medium", 
  showProgress = true, 
  onClick 
}: AchievementBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return "from-gray-300 via-gray-200 to-gray-400";
      case "gold": 
        return "from-yellow-300 via-yellow-200 to-yellow-400";
      case "silver":
        return "from-gray-400 via-gray-300 to-gray-500";
      case "bronze":
        return "from-orange-400 via-orange-300 to-orange-500";
      default:
        return "from-gray-400 via-gray-300 to-gray-500";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "milestone":
        return "from-blue-500 to-cyan-500";
      case "streak":
        return "from-red-500 to-orange-500";
      case "mastery":
        return "from-purple-500 to-pink-500";
      case "speed":
        return "from-green-500 to-teal-500";
      case "test":
        return "from-indigo-500 to-blue-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "milestone":
        return <Target className="w-4 h-4" />;
      case "streak":
        return <Zap className="w-4 h-4" />;
      case "mastery":
        return <Crown className="w-4 h-4" />;
      case "speed":
        return <Star className="w-4 h-4" />;
      case "test":
        return <Trophy className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return {
          card: "p-3 min-h-[120px]",
          icon: "text-3xl",
          title: "text-sm font-semibold",
          description: "text-xs",
          progress: "h-2",
          badge: "text-xs px-2 py-1"
        };
      case "large":
        return {
          card: "p-6 min-h-[200px]",
          icon: "text-6xl",
          title: "text-lg font-bold",
          description: "text-sm",
          progress: "h-3",
          badge: "text-sm px-3 py-1"
        };
      default: // medium
        return {
          card: "p-4 min-h-[160px]",
          icon: "text-4xl",
          title: "text-base font-semibold",
          description: "text-sm",
          progress: "h-2.5",
          badge: "text-xs px-2 py-1"
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-300 overflow-hidden",
        sizeClasses.card,
        achievement.isEarned 
          ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2"
          : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-dashed opacity-75",
        isHovered && "scale-105 shadow-lg",
        onClick && "hover:shadow-lg"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`achievement-${achievement.key}`}
    >
      {/* Tier Gradient Border */}
      {achievement.isEarned && (
        <div className={cn(
          "absolute inset-0 p-[2px] bg-gradient-to-r rounded-lg",
          getTierColor(achievement.tier)
        )}>
          <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Category Badge */}
        <div className="flex items-center justify-between mb-2">
          <Badge 
            className={cn(
              "text-white font-medium bg-gradient-to-r",
              getCategoryColor(achievement.category),
              sizeClasses.badge
            )}
          >
            <span className="mr-1">{getCategoryIcon(achievement.category)}</span>
            {achievement.category}
          </Badge>
          
          {achievement.isEarned && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Earned!
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-3">
          <div className={cn(
            "relative",
            achievement.isEarned ? "grayscale-0" : "grayscale opacity-50"
          )}>
            <span className={sizeClasses.icon}>
              {achievement.icon}
            </span>
            {!achievement.isEarned && (
              <Lock className="absolute top-0 right-0 w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center mb-3 flex-grow">
          <h3 className={cn(
            sizeClasses.title,
            achievement.isEarned 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-500 dark:text-gray-400"
          )}>
            {achievement.name}
          </h3>
          <p className={cn(
            sizeClasses.description,
            "text-gray-600 dark:text-gray-300 mt-1 leading-relaxed"
          )}>
            {achievement.description}
          </p>
        </div>

        {/* Progress Section */}
        {showProgress && !achievement.isEarned && (
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Progress
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
            <Progress 
              value={achievement.progressPercent} 
              className={cn("bg-gray-200 dark:bg-gray-700", sizeClasses.progress)}
            />
            <div className="text-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(achievement.progressPercent)}% complete
              </span>
            </div>
          </div>
        )}

        {/* Points Badge */}
        <div className="flex justify-center mt-3">
          <Badge variant="outline" className="text-xs">
            <Trophy className="w-3 h-3 mr-1 text-yellow-500" />
            {achievement.points} pts
          </Badge>
        </div>

        {/* Earned Date */}
        {achievement.isEarned && achievement.earnedAt && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-400">
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      {isHovered && achievement.isEarned && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 dark:to-black/10 pointer-events-none" />
      )}
    </Card>
  );
}