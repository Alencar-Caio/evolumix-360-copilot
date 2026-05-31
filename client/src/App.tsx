import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Copilot from "./pages/Copilot";
import DiagnosticNew from "./pages/DiagnosticNew";
import DiagnosticDetail from "./pages/DiagnosticDetail";
import ApprovalsPanel from "./pages/ApprovalsPanel";
import AuditDashboard from "./pages/AuditDashboard";
import DocumentsManager from "./pages/DocumentsManager";
import { V2Home } from "./pages/V2Home";
import V2Dashboard from "./pages/V2Dashboard";
import V2Copilot from "./pages/V2Copilot";
import V2Diagnostics from "./pages/V2Diagnostics";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/copilot" component={Copilot} />
      <Route path="/diagnostics/new" component={DiagnosticNew} />
      <Route path="/diagnostics/:id" component={DiagnosticDetail} />
      <Route path="/approvals" component={ApprovalsPanel} />
      <Route path="/audit" component={AuditDashboard} />
      <Route path="/documents" component={DocumentsManager} />
      <Route path="/v2" component={V2Dashboard} />
      <Route path="/v2/home" component={V2Home} />
      <Route path="/v2/copilot" component={V2Copilot} />
      <Route path="/v2/diagnostics" component={V2Diagnostics} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
