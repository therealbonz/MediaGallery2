import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWAProvider } from "@/contexts/PWAContext";
import { InstallPrompt, OfflineNotice } from "@/components/PWAComponents";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import EditPage from "@/pages/edit";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile" component={Profile} />
      <Route path="/edit/:id" component={EditPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PWAProvider>
        <TooltipProvider>
          <OfflineNotice />
          <Toaster />
          <Router />
          <InstallPrompt />
        </TooltipProvider>
      </PWAProvider>
    </QueryClientProvider>
  );
}

export default App;
