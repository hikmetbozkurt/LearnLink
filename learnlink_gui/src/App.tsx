import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignInPage from "./features/login/components/LoginPage.tsx";
import ForgotPasswordPage from "./features/login/components/ForgetPasswordPage.tsx";
import ResetPasswordPage from "./features/login/components/ResetPasswordPage.tsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />{" "}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </Router>
  );
};

export default App;
