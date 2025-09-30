import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AchievementToast from "@/components/achievement-toast";
import Confetti, { BronzeConfetti, SilverConfetti, GoldConfetti, PlatinumConfetti } from "@/components/confetti";
import type { AchievementWithProgress, GamificationStats } from "@shared/schema";

interface CelebrationState {
  achievement: AchievementWithProgress | null;
  isToastVisible: boolean;
  isConfettiActive: boolean;
}

export default function CelebrationSystem() {
  const [celebrationQueue, setCelebrationQueue] = useState<AchievementWithProgress[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationState>({
    achievement: null,
    isToastVisible: false,
    isConfettiActive: false
  });
  
  const lastEarnedCountRef = useRef<number>(0);
  const processedAchievementsRef = useRef<Set<string>>(new Set());

  // Monitor achievements for new unlocks - COST OPTIMIZED: Only poll after user actions
  const { data: achievements = [] } = useQuery<AchievementWithProgress[]>({
    queryKey: ["/api/achievements/progress"],
    refetchInterval: false, // Only refetch manually after progress
    staleTime: 30000, // Consider fresh for 30 seconds
  });

  const { data: gamificationStats } = useQuery<GamificationStats>({
    queryKey: ["/api/gamification-stats"],
    refetchInterval: false, // Only refetch manually after progress
    staleTime: 30000, // Consider fresh for 30 seconds
  });

  // Detect new achievements
  useEffect(() => {
    if (!achievements || !achievements.length || !gamificationStats) return;

    const earnedAchievements = achievements.filter(a => a.isEarned);
    const currentEarnedCount = earnedAchievements.length;

    // Initialize on first load
    if (lastEarnedCountRef.current === 0) {
      lastEarnedCountRef.current = currentEarnedCount;
      // Mark all existing achievements as processed
      earnedAchievements.forEach(achievement => {
        processedAchievementsRef.current.add(achievement.id);
      });
      return;
    }

    // Check for new achievements
    if (currentEarnedCount > lastEarnedCountRef.current) {
      const newAchievements = earnedAchievements.filter(achievement => 
        !processedAchievementsRef.current.has(achievement.id)
      );

      if (newAchievements.length > 0) {
        // Add new achievements to celebration queue
        setCelebrationQueue(prev => [...prev, ...newAchievements]);
        
        // Mark as processed
        newAchievements.forEach(achievement => {
          processedAchievementsRef.current.add(achievement.id);
        });
      }

      lastEarnedCountRef.current = currentEarnedCount;
    }
  }, [achievements, gamificationStats]);

  // Process celebration queue
  useEffect(() => {
    if (!currentCelebration.achievement && celebrationQueue.length > 0) {
      const nextAchievement = celebrationQueue[0];
      setCelebrationQueue(prev => prev.slice(1));
      
      // Start celebration
      setCurrentCelebration({
        achievement: nextAchievement,
        isToastVisible: true,
        isConfettiActive: true
      });
    }
  }, [currentCelebration.achievement, celebrationQueue]);

  // Handle toast close
  const handleToastClose = () => {
    setCurrentCelebration(prev => ({
      ...prev,
      isToastVisible: false
    }));
  };

  // Handle confetti complete
  const handleConfettiComplete = () => {
    setCurrentCelebration(prev => ({
      ...prev,
      isConfettiActive: false
    }));
    
    // Clear current celebration after a short delay
    setTimeout(() => {
      setCurrentCelebration({
        achievement: null,
        isToastVisible: false,
        isConfettiActive: false
      });
    }, 500);
  };

  // Handle navigation to achievements
  const handleViewAllAchievements = () => {
    const event = new CustomEvent('navigate-to-achievements');
    window.dispatchEvent(event);
  };

  // Global celebration trigger (for manual testing or other integrations)
  useEffect(() => {
    const triggerCelebration = (achievement: AchievementWithProgress) => {
      setCelebrationQueue(prev => [...prev, achievement]);
    };

    (window as any).triggerAchievementCelebration = triggerCelebration;

    return () => {
      delete (window as any).triggerAchievementCelebration;
    };
  }, []);

  // Render tier-appropriate confetti
  const renderConfetti = () => {
    if (!currentCelebration.isConfettiActive || !currentCelebration.achievement) return null;

    const tier = currentCelebration.achievement.tier.toLowerCase();
    const confettiProps = {
      isActive: true,
      onComplete: handleConfettiComplete
    };

    switch (tier) {
      case "platinum":
        return <PlatinumConfetti {...confettiProps} />;
      case "gold":
        return <GoldConfetti {...confettiProps} />;
      case "silver":
        return <SilverConfetti {...confettiProps} />;
      case "bronze":
        return <BronzeConfetti {...confettiProps} />;
      default:
        return <Confetti {...confettiProps} />;
    }
  };

  return (
    <>
      {/* Achievement Toast */}
      <AchievementToast
        achievement={currentCelebration.achievement}
        isVisible={currentCelebration.isToastVisible}
        onClose={handleToastClose}
        onViewAll={handleViewAllAchievements}
      />

      {/* Tier-appropriate Confetti */}
      {renderConfetti()}
    </>
  );
}

// Achievement celebration provider for the app
interface CelebrationProviderProps {
  children: React.ReactNode;
}

export function CelebrationProvider({ children }: CelebrationProviderProps) {
  const [shouldShowCelebrations, setShouldShowCelebrations] = useState(true);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigateToAchievements = () => {
      // This would trigger navigation to achievements gallery
      // In a real app, you'd use your router here
      const achievementsButton = document.querySelector('[data-testid="nav-achievements"]') as HTMLElement;
      if (achievementsButton) {
        achievementsButton.click();
      }
    };

    window.addEventListener('navigate-to-achievements', handleNavigateToAchievements);

    return () => {
      window.removeEventListener('navigate-to-achievements', handleNavigateToAchievements);
    };
  }, []);

  return (
    <>
      {children}
      {shouldShowCelebrations && <CelebrationSystem />}
    </>
  );
}

// Testing utilities for development
export const celebrationTestUtils = {
  triggerTestCelebration: (tier: "bronze" | "silver" | "gold" | "platinum" = "gold") => {
    const testAchievement: AchievementWithProgress = {
      id: `test-${Date.now()}`,
      key: "test_achievement",
      name: "Test Achievement!",
      description: "This is a test achievement to showcase the celebration system",
      icon: "🎉",
      category: "milestone",
      tier,
      points: tier === "platinum" ? 100 : tier === "gold" ? 50 : tier === "silver" ? 25 : 10,
      requirements: "Test achievement",
      isHidden: false,
      isEarned: true,
      earnedAt: new Date(),
      progress: 100,
      maxProgress: 100,
      progressPercent: 100
    };

    if ((window as any).triggerAchievementCelebration) {
      (window as any).triggerAchievementCelebration(testAchievement);
    }
  }
};