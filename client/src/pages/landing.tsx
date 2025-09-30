import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            The Daily Double Down
          </CardTitle>
          <CardDescription className="text-lg">
            Master trivia with spaced repetition and gamification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="font-semibold text-blue-900 dark:text-blue-100">🎯 Smart Learning</div>
                <div className="text-blue-700 dark:text-blue-300">Spaced repetition algorithm</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="font-semibold text-green-900 dark:text-green-100">🏆 Gamification</div>
                <div className="text-green-700 dark:text-green-300">Achievements & streaks</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <div className="font-semibold text-purple-900 dark:text-purple-100">📊 Analytics</div>
                <div className="text-purple-700 dark:text-purple-300">Track your progress</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <div className="font-semibold text-orange-900 dark:text-orange-100">🎮 Game Modes</div>
                <div className="text-orange-700 dark:text-orange-300">Classic & rapid-fire</div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secure authentication powered by Replit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}