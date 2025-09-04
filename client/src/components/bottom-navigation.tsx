import { Button } from "@/components/ui/button";
import { Home, Brain, BarChart3, User } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  currentScreen: string;
  onScreenChange: (screen: string) => void;
}

export default function BottomNavigation({ currentScreen, onScreenChange }: BottomNavigationProps) {
  const [, setLocation] = useLocation();
  
  const navItems = [
    { id: "game", icon: Home, label: "Game", path: "/" },
    { id: "study", icon: Brain, label: "Study", path: "/study" },
    { id: "stats", icon: BarChart3, label: "Stats", path: "/" },
    { id: "profile", icon: User, label: "Profile", path: "/" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.id === "study") {
      setLocation(item.path);
    } else {
      onScreenChange(item.id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg" data-testid="bottom-navigation">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleNavClick(item)}
              className="flex-1 py-3 px-2 h-auto flex flex-col items-center hover:bg-muted transition-colors"
              data-testid={`nav-${item.id}`}
            >
              <Icon 
                className={`text-xl mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} 
                size={20}
              />
              <span 
                className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
