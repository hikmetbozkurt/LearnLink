import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import ChatroomsPage from "./pages/ChatroomsPage";
import NotificationsPage from "./pages/NotificationsPage";
import CoursesPage from "./pages/CoursesPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import EventsPage from "./pages/EventsPage";
import ProgressPage from "./pages/ProgressPage";
import SupportPage from "./pages/SupportPage";
import RouteGuard from './components/RouteGuard';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes - No Layout */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes - With Layout */}
        <Route element={
          <RouteGuard>
            <Layout />
          </RouteGuard>
        }>
          <Route path="/home" element={<HomePage />} />
          <Route path="/chatrooms" element={<ChatroomsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
