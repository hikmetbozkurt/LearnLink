import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignInPage from "./features/login/components/LoginPage";
import ForgotPasswordPage from "./features/login/components/ForgetPasswordPage";
import ResetPasswordPage from "./features/login/components/ResetPasswordPage";
import Dashboard from './features/login/components/Dashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />{" "}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
