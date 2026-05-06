import { useState } from "react";
import './LoginScreen.css'

export default function CreateAccountScreen({
  onAccountCreated,
  onBackToLogin,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreateAccount = (e) => {
    e.preventDefault();
    onAccountCreated();
  };

  return (
    <div className="login-page">
      <h1 className="login-text">Create Account</h1>
      <form className="login-box" onSubmit={handleCreateAccount}>

        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="School Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="login-button" type="submit">Create Account</button>

        <button type="button" onClick={onBackToLogin}>Back to Login</button>
      </form>
    </div>
  );
}