import { useQuery } from "@tanstack/react-query";
import { Target, GraduationCap, User, LogOut, ChevronDown } from "lucide-react";
import NotificationCenter from "@/components/notification-center";
import StreakIndicator from "@/components/streak-indicator";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ReadinessScore, GamificationStats } from "@shared/schema";

export default function Header() {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: readinessData } = useQuery<ReadinessScore>({
    queryKey: ["/api/readiness"],
  });

  const { data: overallStats } = useQuery<{
    totalQuestions: number;
    overallAccuracy: number;
    currentStreak: number;
    totalStudyTime: number;
  }>({
    queryKey: ["/api/stats/overall"],
  });

  const { data: gamificationStats } = useQuery<GamificationStats>({
    queryKey: ["/api/gamification-stats"],
  });

  const getGradeColor = (grade: string, score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-600";
    if (score >= 80) return "from-blue-500 to-cyan-600";
    if (score >= 70) return "from-yellow-500 to-orange-500";
    if (score >= 60) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-500";
  };

  const score = readinessData?.overallScore || 0;
  const grade = readinessData?.letterGrade || "F";

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: App Title and Readiness */}
          <div className="flex items-center gap-4">
            {/* App Icon & Title */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  The Daily Double Down
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Train for Trivia Excellence
                </p>
              </div>
            </div>

            {/* Readiness Score - Compact */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-full px-3 py-2 border">
              <Target className="w-4 h-4 text-primary" />
              
              {/* Score with Grade */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r",
                  getGradeColor(grade, score)
                )}>
                  {grade}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {score.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    Ready
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={cn(
                "w-2 h-2 rounded-full",
                score >= 80 ? "bg-green-500 animate-pulse" : 
                score >= 70 ? "bg-yellow-500" : "bg-red-500"
              )} />
            </div>
          </div>

          {/* Right: Stats and Notification */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {/* Enhanced Streak Indicator */}
              {overallStats?.currentStreak !== undefined && (
                <StreakIndicator
                  streakValue={overallStats.currentStreak}
                  streakType="daily"
                  goalProgress={gamificationStats?.streakInfo.goalProgress || 0}
                  size="small"
                  animated={true}
                  showProgress={false}
                  showLabel={false}
                  className="hover:scale-110 transition-transform"
                />
              )}
              
              {overallStats?.totalQuestions && overallStats.totalQuestions > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-500">📝</span>
                  <span className="font-medium">{overallStats.totalQuestions}</span>
                </div>
              )}
              
              {overallStats?.overallAccuracy && overallStats.overallAccuracy > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-green-500">✅</span>
                  <span className="font-medium">{overallStats.overallAccuracy.toFixed(0)}%</span>
                </div>
              )}
            </div>

            {/* User Profile & Notification Center */}
            <div className="flex items-center gap-3">
              {user && <NotificationCenter />}
              
              {/* User Profile Dropdown or Sign In Button */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-2 py-1 transition-colors" data-testid="dropdown-user-profile">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || "User"} />
                      <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                        {getUserInitials(user.firstName, user.lastName, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-username">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-email">
                        {user.email}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex items-center gap-2" data-testid="menu-profile">
                      <User className="w-4 h-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-red-600 dark:text-red-400" 
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => window.location.href = "/api/login"}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  data-testid="button-login"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}