import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AchievementBadge from "@/components/achievement-badge";
import { Trophy, Search, Filter, Crown, Target, Zap, Star, CheckCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementWithProgress, GamificationStats } from "@shared/schema";

type FilterCategory = "all" | "milestone" | "streak" | "mastery" | "speed" | "test";
type FilterStatus = "all" | "earned" | "unearned" | "in-progress";
type SortOption = "name" | "points" | "progress" | "category" | "earnedDate";

export default function AchievementGallery() {
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("category");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: achievements = [] } = useQuery<AchievementWithProgress[]>({
    queryKey: ["/api/achievements/progress"],
  });

  const { data: gamificationStats } = useQuery<GamificationStats>({
    queryKey: ["/api/gamification-stats"],
  });

  // Filter and sort achievements
  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = achievements.filter(achievement => {
      // Category filter
      if (filterCategory !== "all" && achievement.category !== filterCategory) {
        return false;
      }

      // Status filter  
      if (filterStatus === "earned" && !achievement.isEarned) return false;
      if (filterStatus === "unearned" && achievement.isEarned) return false;
      if (filterStatus === "in-progress" && (achievement.isEarned || achievement.progress === 0)) return false;

      // Search filter
      if (searchQuery && !achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "points":
          return b.points - a.points;
        case "progress":
          return b.progressPercent - a.progressPercent;
        case "category":
          return a.category.localeCompare(b.category);
        case "earnedDate":
          if (!a.earnedAt && !b.earnedAt) return 0;
          if (!a.earnedAt) return 1;
          if (!b.earnedAt) return -1;
          return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [achievements, filterCategory, filterStatus, sortBy, searchQuery]);

  const categoryStats = useMemo(() => {
    const stats = {
      all: { total: 0, earned: 0 },
      milestone: { total: 0, earned: 0 },
      streak: { total: 0, earned: 0 },
      mastery: { total: 0, earned: 0 },
      speed: { total: 0, earned: 0 },
      test: { total: 0, earned: 0 },
    };

    achievements.forEach(achievement => {
      stats.all.total++;
      if (achievement.isEarned) stats.all.earned++;

      const category = achievement.category as keyof typeof stats;
      if (stats[category]) {
        stats[category].total++;
        if (achievement.isEarned) stats[category].earned++;
      }
    });

    return stats;
  }, [achievements]);

  const getCategoryIcon = (category: FilterCategory) => {
    switch (category) {
      case "milestone": return <Target className="w-4 h-4" />;
      case "streak": return <Zap className="w-4 h-4" />;
      case "mastery": return <Crown className="w-4 h-4" />;
      case "speed": return <Star className="w-4 h-4" />;
      case "test": return <Trophy className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: FilterCategory) => {
    switch (category) {
      case "milestone": return "from-blue-500 to-cyan-500";
      case "streak": return "from-red-500 to-orange-500";
      case "mastery": return "from-purple-500 to-pink-500";
      case "speed": return "from-green-500 to-teal-500";
      case "test": return "from-indigo-500 to-blue-500";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="p-4 space-y-6" data-testid="achievement-gallery">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Achievement Gallery
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Unlock exciting badges as you master Jeopardy!
        </p>
      </div>

      {/* Stats Overview */}
      {gamificationStats && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Progress
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {gamificationStats.achievementsEarned} of {gamificationStats.totalAchievements} achievements earned
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {gamificationStats.totalPoints}
                </div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold px-3 py-1 rounded-full text-white bg-gradient-to-r",
                  gamificationStats.currentTier === "Platinum" ? "from-gray-300 to-gray-500" :
                  gamificationStats.currentTier === "Gold" ? "from-yellow-400 to-yellow-600" :
                  gamificationStats.currentTier === "Silver" ? "from-gray-400 to-gray-600" :
                  "from-orange-400 to-orange-600"
                )}>
                  {gamificationStats.currentTier}
                </div>
                <div className="text-xs text-gray-500 mt-1">Tier</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="achievement-search"
            />
          </div>

          {/* Category Filters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Categories
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "milestone", "streak", "mastery", "speed", "test"] as FilterCategory[]).map((category) => (
                <Button
                  key={category}
                  variant={filterCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className={cn(
                    "flex items-center gap-2",
                    filterCategory === category && category !== "all" && 
                    `bg-gradient-to-r text-white ${getCategoryColor(category)}`
                  )}
                  data-testid={`filter-${category}`}
                >
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category}</span>
                  <Badge variant="secondary" className="text-xs">
                    {categoryStats[category].earned}/{categoryStats[category].total}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Status and Sort */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>
              {(["all", "earned", "unearned", "in-progress"] as FilterStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  data-testid={`status-${status}`}
                >
                  {status === "earned" && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status === "unearned" && <Lock className="w-3 h-3 mr-1" />}
                  <span className="capitalize">{status.replace("-", " ")}</span>
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                data-testid="sort-select"
              >
                <option value="category">Category</option>
                <option value="name">Name</option>
                <option value="points">Points</option>
                <option value="progress">Progress</option>
                <option value="earnedDate">Earned Date</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size="medium"
            showProgress={true}
            data-testid={`badge-${achievement.key}`}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedAchievements.length === 0 && (
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No achievements found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? "Try a different search term" : "Start practicing to unlock your first achievement!"}
          </p>
        </Card>
      )}
    </div>
  );
}