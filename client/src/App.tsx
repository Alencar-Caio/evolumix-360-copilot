import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
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
import UsersManagement from "./pages/UsersManagement";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"="} component={Home} />
      <Route path={"/dashboard"} component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path={"/copilot"} component={() => <ProtectedRoute component={Copilot} />} />
      <Route path={"/diagnostics/new"} component={() => <ProtectedRoute component={DiagnosticNew} />} />
      <Route path={"/diagnostics/:id"} component={() => <ProtectedRoute component={DiagnosticDetail} />} />
      <Route path={"/approvals"} component={() => <ProtectedRoute component={ApprovalsPanel} />} />
      <Route path={"/audit"} component={() => <ProtectedRoute component={AuditDashboard} />} />
      <Route path={"/documents"} component={() => <ProtectedRoute component={DocumentsManager} />} />
      <Route path={"/users"} component={() => <ProtectedRoute component={UsersManagement} />} />
      <Route path={"/404"} component={NotFound} />
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
