import React, { useState } from "react";
import axios from "axios";
import "./LoginAdminorCustomer.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom"; // Import useNavigate for programmatic navigation

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Hook for redirecting

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await axios.post("http://localhost:5000/customer/login", {
        Customer_Email: email,
        Customer_Password: password,
      });

      console.log("Login response:", response.data); // DEBUG

      if (response.data.token) {
        alert("Customer Login Successful!");
        // Save token to localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("customerId", response.data.user.id); // <--- store customer ID
       
        navigate("/dashboardcustomer");
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err); // DEBUG
      setError("Error logging in. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Customer Login</h2>
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
        <Link to="/forget-password-customer" className="forgot-password-link"> Forget Password?</Link>
      </form>
    </div>
  );
};

export default Login;
