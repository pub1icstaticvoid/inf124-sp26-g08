import  React  from 'react';
import  ReactDOM   from 'react-dom/client';
import { useState } from "react";
import './index.css';
import App from './App';
import LoginScreen from "./LoginScreen";

function Root() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  return isLoggedIn ? (
    <App onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
