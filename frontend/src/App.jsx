import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import StudentPage from "./pages/StudentPage";
import CreateSessionPage from "./pages/CreateSessionPage";
import MonitoringPage from "./pages/MonitoringPage";
import SessionReportPage from "./pages/SessionReportPage";
import SessionPage from "./pages/SessionPage";
import ReportHistoryPage from "./pages/ReportHistoryPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import ProfilePage from "./pages/ProfilePage";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("serinUser");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const user = localStorage.getItem("serinUser");

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mahasiswa"
          element={
            <ProtectedRoute>
              <StudentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buat-sesi"
          element={
            <ProtectedRoute>
              <CreateSessionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sesi-konseling"
          element={
            <ProtectedRoute>
              <SessionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <MonitoringPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/laporan-sesi"
          element={
            <ProtectedRoute>
              <SessionReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/riwayat-laporan"
          element={
            <ProtectedRoute>
              <ReportHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/detail-laporan/:id"
          element={
            <ProtectedRoute>
              <ReportDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;