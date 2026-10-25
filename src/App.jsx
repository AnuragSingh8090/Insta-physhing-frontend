import { Routes, Route, Navigate } from "react-router-dom";
import Login          from "./pages/login/login";
import Footer         from "./components/footer/Footer";
import Dashboard      from "./pages/dashboard/Dashboard";
import Monitor        from "./pages/monitor/Monitor";
import Database       from "./pages/database/Database";
import Forgot         from "./pages/forgot/Forgot";
import ChangePassword from "./pages/changepassword/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";

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
          {/* /dashboard → redirect to /dashboard/monitor */}
          <Route index element={<Navigate to="monitor" replace />} />
          <Route path="monitor"  element={<Monitor />} />
          <Route path="database" element={<Database />} />
        </Route>
        {/* Direct access to /monitor or /database also guarded */}
        <Route path="/monitor"  element={<Navigate to="/dashboard/monitor" replace />} />
        <Route path="/database" element={<Navigate to="/dashboard/database" replace />} />
      </Route>

      {/* Catch-all unknown routes redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
