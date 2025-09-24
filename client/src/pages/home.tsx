import { useState } from "react";
import GameBoard from "@/components/game-board";
import QuestionView from "@/components/question-view";
import RapidFireMode from "@/components/rapid-fire-mode";
import RapidFireSettings from "@/components/rapid-fire-settings";
import StatsDashboard from "@/components/stats-dashboard";
import BottomNavigation from "@/components/bottom-navigation";
import FeedbackModal from "@/components/feedback-modal";
import { Trophy, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Screen = "game" | "question" | "rapid-fire" | "rapid-fire-settings" | "anytime-test" | "stats" | "profile";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("game");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    correct: boolean;
    answer: string;
    value: number;
  } | null>(null);
  const [rapidFireSettings, setRapidFireSettings] = useState<{
    selectedCategories: string[];
    questionCount: number;
  } | undefined>();

  const { data: overallStats } = useQuery({
    queryKey: ["/api/stats/overall"],
  });

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestion(questionId);
    setCurrentScreen("question");
  };

  const handleRapidFire = () => {
    setCurrentScreen("rapid-fire-settings");
  };

  const handleAnytimeTest = () => {
    setCurrentScreen("anytime-test");
  };

  const handleRapidFireStart = (settings: { selectedCategories: string[]; questionCount: number }) => {
    setRapidFireSettings(settings);
    setCurrentScreen("rapid-fire");
  };

  const handleAnswerSubmit = (correct: boolean, answer: string, value: number) => {
    setFeedbackData({ correct, answer, value });
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedQuestion(null);
    setCurrentScreen("game");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "game":
        return <GameBoard onQuestionSelect={handleQuestionSelect} onRapidFire={handleRapidFire} onAnytimeTest={handleAnytimeTest} />;
      case "question":
        return selectedQuestion ? (
          <QuestionView 
            questionId={selectedQuestion} 
            onAnswerSubmit={handleAnswerSubmit}
            onBack={() => setCurrentScreen("game")}
          />
        ) : null;
      case "rapid-fire-settings":
        return <RapidFireSettings onStart={handleRapidFireStart} onBack={() => setCurrentScreen("game")} />;
      case "rapid-fire":
        return <RapidFireMode settings={rapidFireSettings} onBack={() => setCurrentScreen("game")} />;
      case "anytime-test":
        return <RapidFireMode isAnytimeTest={true} onBack={() => setCurrentScreen("game")} />;
      case "stats":
        return <StatsDashboard />;
      default:
        return <GameBoard onQuestionSelect={handleQuestionSelect} onRapidFire={handleRapidFire} onAnytimeTest={handleAnytimeTest} />;
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="main-app">
      {/* Header */}
      <header className="jeopardy-gradient text-primary-foreground shadow-lg" data-testid="app-header">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="text-secondary text-2xl" data-testid="trophy-icon" />
              <div>
                <h1 className="text-lg font-bold" data-testid="app-title">Jeopardy Trainer</h1>
                <p className="text-sm text-primary-foreground/80" data-testid="user-level">
                  Level 12 • {overallStats?.totalQuestions || 0} pts
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-primary-foreground/80">Daily Streak</div>
                <div className="text-lg font-bold text-secondary" data-testid="daily-streak">
                  {overallStats?.currentStreak || 0}
                </div>
              </div>
              <button 
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                data-testid="button-settings"
              >
                <Settings className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentScreen={currentScreen} 
        onScreenChange={setCurrentScreen} 
      />

      {/* Feedback Modal */}
      {showFeedback && feedbackData && (
        <FeedbackModal
          isVisible={showFeedback}
          correct={feedbackData.correct}
          answer={feedbackData.answer}
          value={feedbackData.value}
          onNext={handleNextQuestion}
        />
      )}
    </div>
  );
}
