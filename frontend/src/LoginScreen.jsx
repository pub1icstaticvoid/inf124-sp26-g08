import { useState } from "react";
import './LoginScreen.css'
import { apiPost } from "./api";



export default function LoginScreen({ onLogin, onCreateAccount }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // actually call the login endpoint
      const data = await apiPost("/auth/login", { email, password });
      // data.user = { id, username, email, settings }
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleCanvasLogin = () => {
    onLogin();
  };

  return (
    <div className="login-page">
      <h1 className="login-text">Login</h1>
      <form className="login-box" onSubmit={handleSubmit}>
        
        {/* show error message if login fails */}
        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
        )}



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

        {/* disable button while loading */}
        <button className="login-button" type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </button>

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
