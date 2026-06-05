//import { useState } from "react";
import './LoginScreen.css'
import { apiPost } from "./api";

export default function CreateAccountScreen({ onAccountCreated, onBackToLogin }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
 
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      //call signup endpoint — server hashes the password and saves the user
      await apiPost("/auth/signup", { username: name, email, password });
 
      //auto-login immediately after signup so we get the full user object
      const loginData = await apiPost("/auth/login", { email, password });
      onAccountCreated(loginData.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="login-page">
      <h1 className="login-text">Create Account</h1>
      <form className="login-box" onSubmit={handleCreateAccount}>
 
        {/*show error message if signup fails */}
        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
        )}
 
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
 
        <input
          type="email"
          placeholder="School Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
 
        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
 
        {/*disable while loading */}
        <button className="login-button" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Account"}
        </button>
 
        <button type="button" onClick={onBackToLogin}>Back to Login</button>
      </form>
    </div>
  );
}
