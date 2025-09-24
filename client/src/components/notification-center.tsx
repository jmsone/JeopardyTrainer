import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, X, Trophy, Star, Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { NotificationWithAction } from "@shared/schema";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery<NotificationWithAction[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleNotificationClick = (notification: NotificationWithAction) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type: string, icon?: string, message?: string) => {
    if (icon) return icon; // Use custom emoji icon if provided
    
    switch (type) {
      case "achievement":
        return "🏆";
      case "streak":
        // Enhanced flame icons based on streak value in message
        if (message?.includes("streak")) {
          const streakMatch = message.match(/(\d+)/);
          const streakValue = streakMatch ? parseInt(streakMatch[1]) : 1;
          if (streakValue >= 15) return "🔥🔥🔥🔥";
          if (streakValue >= 7) return "🔥🔥🔥";
          if (streakValue >= 3) return "🔥🔥";
          return "🔥";
        }
        return "🔥";
      case "milestone":
        return "⭐";
      case "reminder":
        return "⏰";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "from-yellow-400 to-orange-500";
    
    switch (type) {
      case "achievement":
        return "from-purple-400 to-pink-500";
      case "streak":
        return "from-red-400 to-orange-500";
      case "milestone":
        return "from-blue-400 to-cyan-500";
      case "reminder":
        return "from-green-400 to-teal-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 hover:bg-primary/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="notification-bell"
      >
        <Bell className="w-5 h-5 text-primary" />
        {unreadCount.count > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] p-0 text-xs bg-red-500 hover:bg-red-500 animate-pulse"
            data-testid="notification-badge"
          >
            {unreadCount.count > 99 ? "99+" : unreadCount.count}
          </Badge>
        )}
      </Button>

      {/* Slide-out Notification Drawer */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-purple-100 dark:from-primary/20 dark:to-purple-900">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-primary">Notifications</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="close-notifications"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No notifications yet!</p>
                  <p className="text-xs mt-1">Keep practicing to unlock achievements 🏆</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                        notification.isRead 
                          ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" 
                          : "bg-white dark:bg-gray-900 border-primary/20 shadow-sm"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-${notification.id}`}
                    >
                      {/* Colorful gradient accent */}
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full rounded-l-lg bg-gradient-to-b",
                        getNotificationColor(notification.type, notification.priority)
                      )} />
                      
                      <div className="flex items-start gap-3 ml-2">
                        {/* Icon */}
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type, notification.icon || undefined, notification.message)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              "text-sm font-medium truncate",
                              notification.isRead ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"
                            )}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className={cn(
                            "text-xs leading-relaxed",
                            notification.isRead ? "text-gray-500 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {notification.timeAgo}
                            </span>
                            
                            {notification.type === "achievement" && (
                              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                                <Trophy className="w-3 h-3" />
                                <span>Achievement!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}