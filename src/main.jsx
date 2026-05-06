import  React  from 'react';
import  ReactDOM   from 'react-dom/client';
import { useState } from "react";
import './index.css';
import App from './App';
import LoginScreen from "./LoginScreen";
import CreateAccount from "./CreateAccount";

function Root() {
  const [screen, setScreen] = useState("login");

  return (
    <>
      {screen === "login" && (
        <LoginScreen
          onLogin={() => setScreen("app")}
          onCreateAccount={() => setScreen("create")}
        />
      )}

      {screen === "create" && (
        <CreateAccount
          onAccountCreated={() => setScreen("app")}
          onBackToLogin={() => setScreen("login")}
        />
      )}

      {screen === "app" && (
        <App onLogout={() => setScreen("login")} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);