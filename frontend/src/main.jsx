import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from "react";
import './index.css';
import App from './App';
import LoginScreen from "./LoginScreen";
import CreateAccount from "./CreateAccount";

function Root() {
  const [screen, setScreen] = useState("login");
  // hold the logged-in user object in state so we can pass it down.
  // The user object comes from the login/signup API responses and looks like:
  //   { id, username, email, settings: { theme, accentIndex, notifications } }
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setScreen("app");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setScreen("login");
  };

  return (
    <>
      {screen === "login" && (
        <LoginScreen
          onLogin={handleLogin}
          onCreateAccount={() => setScreen("create")}
        />
      )}

      {screen === "create" && (
        <CreateAccount
          onAccountCreated={handleLogin}
          onBackToLogin={() => setScreen("login")}
        />
      )}

      {screen === "app" && (
        //  pass currentUser down so App (and its children) know who is logged in.
        <App currentUser={currentUser} onLogout={handleLogout} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);