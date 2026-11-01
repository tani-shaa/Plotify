import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar  from "./components/Layout/Sidebar";
import TopBar   from "./components/Layout/TopBar";

import Landing              from "./pages/Landing";
import Login                from "./pages/Login";
import Register             from "./pages/Register";
import Dashboard            from "./pages/Dashboard";
import PropertySearch       from "./pages/PropertySearch";
import PropertyDetails      from "./pages/PropertyDetails";
import RegisterProperty     from "./pages/RegisterProperty";
import TransferRequests     from "./pages/TransferRequests";
import OwnershipHistory     from "./pages/OwnershipHistory";
import DocumentVerification from "./pages/DocumentVerification";
import Insights             from "./pages/Insights";
import PublicVerify         from "./pages/PublicVerify";

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function DashboardShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes — no sidebar */}
      <Route path="/"        element={<Landing />} />
      <Route path="/login"   element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/verify"  element={<PublicVerify />} />

      {/* Protected dashboard routes */}
      <Route path="/dashboard" element={
        <RequireAuth>
          <DashboardShell><Dashboard /></DashboardShell>
        </RequireAuth>
      } />
      <Route path="/properties" element={
        <RequireAuth>
          <DashboardShell><PropertySearch /></DashboardShell>
        </RequireAuth>
      } />
      <Route path="/properties/:id" element={
        <RequireAuth>
          <DashboardShell><PropertyDetails /></DashboardShell>
        </RequireAuth>
      } />
      <Route path="/register-land" element={
        <RequireAuth>
          <DashboardShell><RegisterProperty /></DashboardShell>
        </RequireAuth>
      } />
      <Route path="/transfers" element={
        <RequireAuth>
          <DashboardShell><TransferRequests /></DashboardShell>
        </RequireAuth>
      } />
      <Route path="/history" element={
        <RequireAuth>
          <DashboardShell><OwnershipHistory /></DashboardShell>
        </RequireAuth>
      } />
      <Route path="/documents" element={
        <RequireAuth>
          <DashboardShell><DocumentVerification /></DashboardShell>
        </RequireAuth>
      } />
      <Route path="/insights" element={
        <RequireAuth>
          <DashboardShell><Insights /></DashboardShell>
        </RequireAuth>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}
