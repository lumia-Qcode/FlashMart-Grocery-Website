// UpdateAdminPassword.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UpdateAdminPassword.css"; // Reuse or create new styles if needed

const UpdateAdminPassword = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const decoded = JSON.parse(atob(token.split(".")[1]));
    const identifier = decoded.id;

    try {
      const res = await axios.put(
        `http://localhost:5000/api/updateAdminPassword/${identifier}`,
        { Admin_Password: password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (res.data.success) {
        setSuccessMsg("Password updated successfully!");
        setError("");
      } else {
        setError("Update failed. Please try again.");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Error updating password.");
    }
  };

  return (
    <div className="change-password-container">
      <h2>Change Admin Password</h2>
      {error && <p className="error">{error}</p>}
      {successMsg && <p className="success">{successMsg}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          name="Admin_Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password"
          required
        />
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
};

export default UpdateAdminPassword;
