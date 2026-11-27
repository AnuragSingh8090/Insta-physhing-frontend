import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login          from "./pages/login/login";
import Footer         from "./components/footer/Footer";
import Dashboard      from "./pages/dashboard/Dashboard";
import Forgot         from "./pages/forgot/Forgot";
import ChangePassword from "./pages/changepassword/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load dashboard pages — socket.io only connects when the page is visited
const Monitor      = lazy(() => import("./pages/monitor/Monitor"));
const Database     = lazy(() => import("./pages/database/Database"));
const ControlPanel = lazy(() => import("./pages/controlpannel/ControlPanelNew"));

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col bg-white text-[#262626] font-sans">
            <Login />
            <Footer />
          </div>
        }
      />

      {/* Forgot password */}
      <Route path="/forgot" element={<Forgot />} />

      {/* Change password */}
      <Route path="/changepassword" element={<ChangePassword />} />

      {/* Protected routes: /dashboard and its sub-routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="monitor" replace />} />
          <Route path="monitor"  element={<Suspense fallback={null}><Monitor /></Suspense>} />
          <Route path="database" element={<Suspense fallback={null}><Database /></Suspense>} />
          <Route path="control-panel" element={<Suspense fallback={null}><ControlPanel /></Suspense>} />
        </Route>
        {/* Direct access to /monitor, /database, or /control-panel also guarded */}
        <Route path="/monitor"  element={<Navigate to="/dashboard/monitor" replace />} />
        <Route path="/database" element={<Navigate to="/dashboard/database" replace />} />
        <Route path="/control-panel" element={<Navigate to="/dashboard/control-panel" replace />} />
      </Route>

      {/* Catch-all unknown routes redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
