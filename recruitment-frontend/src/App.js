import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./components/AdminDashboard";
import RecruiterDashboard from "./components/RecruiterDashboard";
import CandidateDashboard from "./components/CandidateDashboard";
import ProtectedRoute from "./ProtectedRoute"; // ✅ use relative import

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidate"
          element={
            <ProtectedRoute allowedRole="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
