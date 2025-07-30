import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom"; // Import useNavigate for programmatic navigation

import "./LoginAdminorCustomer.css"; // Import the CSS file for Admin login

const LoginAdmin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Hook for redirecting

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/admin/login", {
        Admin_Email: email,
        Admin_Password: password,
      });

      if (response.data.success) {
        alert("Admin Login Successful!");
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("adminId", response.data.user.id); // <--- store admin ID
        navigate("/dashboardadmin"); // Redirect to Admin Dashboard
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      setError("Error logging in. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Admin Login</h2>
      {error && <p className="login-error">{error}</p>}
      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />
        <button type="submit" className="login-button">
          Login
        </button>
         <Link to="/forget-admin-password" className="forgot-password-link"> Forget Password?</Link>
      </form>
    </div>
  );
};

export default LoginAdmin;
