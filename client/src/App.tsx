import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import CourseSearch from "@/pages/course-search";
import CourseDetail from "@/pages/course-detail";
import ProfessorDashboard from "@/pages/professor-dashboard";
import Professor from "@/pages/professor";
import ClassSession from "@/pages/class-session";
import UserStories from "@/pages/user-stories";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/submit" component={Submit} />
      <Route path="/course-search" component={CourseSearch} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/class-session" component={ClassSession} />
      <Route path="/professor" component={Professor} />
      <Route path="/professor/dashboard" component={ProfessorDashboard} />
      <Route path="/user-stories" component={UserStories} />
      <Route path="/admin" component={Admin} />
      <Route path="/track/:token" component={Submit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Toaster />
          <div className="flex-1">
            <Router />
          </div>
          <Footer />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
