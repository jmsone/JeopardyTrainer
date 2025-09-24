import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trophy, Star, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AchievementWithProgress } from "@shared/schema";

interface AchievementToastProps {
  achievement: AchievementWithProgress | null;
  isVisible: boolean;
  onClose: () => void;
  onViewAll?: () => void;
}

export default function AchievementToast({ 
  achievement, 
  isVisible, 
  onClose, 
  onViewAll 
}: AchievementToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && achievement) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsAnimating(true), 10);
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      handleClose();
    }
  }, [isVisible, achievement]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 300); // Match animation duration
  };

  const getTierGradient = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return "from-gray-300 via-white to-gray-400";
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

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return <Crown className="w-6 h-6 text-white" />;
      case "gold":
        return <Trophy className="w-6 h-6 text-white" />;
      case "silver":
        return <Star className="w-6 h-6 text-white" />;
      case "bronze":
        return <Zap className="w-6 h-6 text-white" />;
      default:
        return <Trophy className="w-6 h-6 text-white" />;
    }
  };

  const getTierGlow = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return "shadow-2xl shadow-gray-300/50";
      case "gold":
        return "shadow-2xl shadow-yellow-400/50";
      case "silver":
        return "shadow-2xl shadow-gray-400/50";
      case "bronze":
        return "shadow-2xl shadow-orange-400/50";
      default:
        return "shadow-2xl shadow-gray-400/50";
    }
  };

  if (!shouldRender || !achievement) return null;

  const toastContent = (
    <div
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-[9998] w-full max-w-sm mx-4",
        "transition-all duration-300 ease-out",
        isAnimating 
          ? "translate-y-0 opacity-100 scale-100" 
          : "-translate-y-full opacity-0 scale-95"
      )}
      data-testid="achievement-toast"
    >
      <div className={cn(
        "relative p-6 rounded-2xl border-2 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95",
        `bg-gradient-to-br ${getTierGradient(achievement.tier)}`,
        getTierGlow(achievement.tier)
      )}>
        {/* Animated Border */}
        <div className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r p-[2px]",
          getTierGradient(achievement.tier)
        )}>
          <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-full bg-gradient-to-r",
                getTierGradient(achievement.tier)
              )}>
                {getTierIcon(achievement.tier)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Achievement Unlocked!
                </h3>
                <Badge className={cn(
                  "text-xs font-medium text-white bg-gradient-to-r",
                  getTierGradient(achievement.tier)
                )}>
                  {achievement.tier} • {achievement.points} pts
                </Badge>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              data-testid="close-achievement-toast"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Achievement Details */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-2 animate-bounce">
              {achievement.icon}
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {achievement.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {achievement.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="flex-1"
              data-testid="dismiss-toast"
            >
              Awesome!
            </Button>
            {onViewAll && (
              <Button
                size="sm"
                onClick={() => {
                  onViewAll();
                  handleClose();
                }}
                className={cn(
                  "flex-1 text-white bg-gradient-to-r",
                  getTierGradient(achievement.tier)
                )}
                data-testid="view-all-achievements"
              >
                View All
              </Button>
            )}
          </div>
        </div>

        {/* Pulse Animation */}
        <div className={cn(
          "absolute inset-0 rounded-2xl animate-ping opacity-20 bg-gradient-to-r",
          getTierGradient(achievement.tier)
        )} />
        
        {/* Sparkle Effects */}
        <div className="absolute top-2 right-2 text-yellow-400 animate-pulse text-xs">✨</div>
        <div className="absolute top-4 left-2 text-yellow-400 animate-pulse text-xs delay-500">✨</div>
        <div className="absolute bottom-2 right-4 text-yellow-400 animate-pulse text-xs delay-1000">✨</div>
        <div className="absolute bottom-4 left-4 text-yellow-400 animate-pulse text-xs delay-700">⭐</div>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
}

// Achievement celebration manager
interface CelebrationManagerProps {
  children: React.ReactNode;
}

export function CelebrationManager({ children }: CelebrationManagerProps) {
  const [celebrationQueue, setCelebrationQueue] = useState<AchievementWithProgress[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<AchievementWithProgress | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Process celebration queue
  useEffect(() => {
    if (!currentCelebration && celebrationQueue.length > 0) {
      const nextCelebration = celebrationQueue[0];
      setCelebrationQueue(prev => prev.slice(1));
      setCurrentCelebration(nextCelebration);
      setIsToastVisible(true);
    }
  }, [currentCelebration, celebrationQueue]);

  const handleToastClose = () => {
    setIsToastVisible(false);
    setCurrentCelebration(null);
  };

  // Expose celebration trigger function
  useEffect(() => {
    const triggerCelebration = (achievement: AchievementWithProgress) => {
      setCelebrationQueue(prev => [...prev, achievement]);
    };

    // Add to window for global access
    (window as any).triggerAchievementCelebration = triggerCelebration;

    return () => {
      delete (window as any).triggerAchievementCelebration;
    };
  }, []);

  return (
    <>
      {children}
      <AchievementToast
        achievement={currentCelebration}
        isVisible={isToastVisible}
        onClose={handleToastClose}
        onViewAll={() => {
          // Navigate to achievements gallery
          const event = new CustomEvent('navigate-to-achievements');
          window.dispatchEvent(event);
        }}
      />
    </>
  );
}