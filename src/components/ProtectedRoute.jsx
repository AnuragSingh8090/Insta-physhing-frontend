import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

/**
 * ProtectedRoute Guard
 *
 * Ensures /dashboard and its sub-routes are ONLY accessible when:
 * sessionStorage.getItem("adminAccess") === "true"
 *
 * If:
 * 1. The user manually navigates to /dashboard without adminAccess
 * 2. adminAccess is "false", null, or anything other than "true"
 * 3. The user was on /dashboard, changed adminAccess to "false" in console/storage, and refreshed
 * 4. The user changes adminAccess to "false" while actively on /dashboard
 *
 * -> In all cases, immediately redirect to "/" (Home/Login).
 */
export default function ProtectedRoute() {
  const location = useLocation();

  const checkAccess = () => {
    return sessionStorage.getItem("adminAccess") === "true";
  };

  const [hasAccess, setHasAccess] = useState(checkAccess);

  useEffect(() => {
    // Re-verify immediately on mount or location change
    if (!checkAccess()) {
      setHasAccess(false);
      return;
    }

    // Storage event for cross-tab or storage dispatches
    const handleStorage = () => {
      setHasAccess(checkAccess());
    };
    window.addEventListener("storage", handleStorage);

    // Live poller (every 300ms) to immediately catch any manual modification
    // made via DevTools console or Application tab in the current tab
    const interval = setInterval(() => {
      if (!checkAccess()) {
        setHasAccess(false);
      }
    }, 300);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [location.pathname]);

  if (!hasAccess || !checkAccess()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
