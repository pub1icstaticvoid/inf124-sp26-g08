import { useState } from "react";
import './LoginScreen.css'
import App from "./App";
import CreateAccount from "./CreateAccount";


export default function LoginScreen({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  const handleCanvasLogin = () => {
    onLogin();
  };

  return (
    <div className="login-page">
      <h1 className="login-text">Login</h1>
      <form className="login-box" onSubmit={handleSubmit}>
        

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" type="submit">Log In</button>
        <button type="button" onClick={handleCanvasLogin}>Log In with Canvas</button>

        <p className="signup-text">
          Don't have an account?{" "}
          <span className="signup-link" onClick={onCreateAccount}>
            Sign up
          </span>
        </p>

      </form>
    </div>
  );
}