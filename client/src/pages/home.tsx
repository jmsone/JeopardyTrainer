import { useState } from "react";
import GameBoard from "@/components/game-board";
import QuestionView from "@/components/question-view";
import RapidFireMode from "@/components/rapid-fire-mode";
import RapidFireSettings from "@/components/rapid-fire-settings";
import StatsDashboard from "@/components/stats-dashboard";
import AchievementGallery from "@/components/achievement-gallery";
import BottomNavigation from "@/components/bottom-navigation";
import FeedbackModal from "@/components/feedback-modal";
import Header from "@/components/header";
import { GraduationCap, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Screen = "game" | "question" | "rapid-fire" | "rapid-fire-settings" | "anytime-test" | "stats" | "achievements";

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

  const { data: readinessData } = useQuery({
    queryKey: ["/api/readiness"],
  });

  const handleQuestionSelect = (questionId: string) => {
    console.log("🎯 Question selected:", questionId);
    setSelectedQuestion(questionId);
    setCurrentScreen("question");
    console.log("🔄 Screen changed to question");
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

  const handleScreenChange = (screen: string) => {
    setCurrentScreen(screen as Screen);
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
      case "achievements":
        return <AchievementGallery />;
      default:
        return <GameBoard onQuestionSelect={handleQuestionSelect} onRapidFire={handleRapidFire} onAnytimeTest={handleAnytimeTest} />;
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="main-app">
      {/* New Header with Notification Center */}
      <Header />

      {/* Main Content */}
      <main className="pb-20">
        {renderScreen()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentScreen={currentScreen} 
        onScreenChange={handleScreenChange} 
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
