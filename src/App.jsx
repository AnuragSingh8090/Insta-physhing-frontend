import { Routes, Route, Navigate } from "react-router-dom";
import Login    from "./pages/login/login";
import Footer   from "./components/footer/Footer";
import Dashboard from "./pages/dashboard/Dashboard";
import Monitor   from "./pages/dashboard/Monitor";
import Database  from "./pages/database/Database";
import Forgot    from "./pages/forgot/Forgot";

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

      {/* Dashboard layout with nested routes */}
      <Route path="/dashboard" element={<Dashboard />}>
        {/* /dashboard → redirect to /dashboard/monitor */}
        <Route index element={<Navigate to="monitor" replace />} />
        <Route path="monitor"  element={<Monitor />} />
        <Route path="database" element={<Database />} />
      </Route>
    </Routes>
  );
}

export default App;
