import { useQuery } from "@tanstack/react-query";
import { Target, GraduationCap } from "lucide-react";
import NotificationCenter from "@/components/notification-center";
import { cn } from "@/lib/utils";
import type { ReadinessScore } from "@shared/schema";

export default function Header() {
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

  const getGradeColor = (grade: string, score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-600";
    if (score >= 80) return "from-blue-500 to-cyan-600";
    if (score >= 70) return "from-yellow-500 to-orange-500";
    if (score >= 60) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-500";
  };

  const score = readinessData?.overallScore || 0;
  const grade = readinessData?.letterGrade || "F";

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
                  Jeopardy Training
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Master the Anytime! Test
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
              {overallStats?.currentStreak && overallStats.currentStreak > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-orange-500">🔥</span>
                  <span className="font-medium">{overallStats.currentStreak}</span>
                </div>
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

            {/* Notification Center */}
            <NotificationCenter />
          </div>
        </div>
      </div>
    </header>
  );
}