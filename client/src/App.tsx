import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CelebrationProvider } from "@/components/celebration-system";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Study from "@/pages/study";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/study" component={Study} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CelebrationProvider>
          <Toaster />
          <Router />
        </CelebrationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
