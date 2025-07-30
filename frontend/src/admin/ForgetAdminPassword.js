// ForgetPasswordAdmin.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ForgetAdminPassword.css";

const ForgetPasswordAdmin = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/forgetAdminPasswordVerify",
        {
          Admin_Name: name,
          Admin_Email: email,
          Admin_PhoneNo: phone,
        }
      );

      const { success, adminId } = response.data;
      console.log("Respomse: ", response.data);
      if (success && adminId) {
        setAdminId(adminId);
        setStep(2);
      } else {
        setError("Admin not found or info doesn't match.");
      }
    } catch (err) {
      console.error(err);
      setError("Error verifying admin.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Reset the admin's password
      await axios.put(
        `http://localhost:5000/api/resetAdminPassword/${adminId}`,
        { Admin_Password: newPassword }
      );

      // Log the admin in immediately
      const loginResponse = await axios.post("http://localhost:5000/admin/login", {
        Admin_Email: email,
        Admin_Password: newPassword,
      });

      if (loginResponse.data.token) {
        alert("Admin Login Successful!");
        localStorage.setItem("token", loginResponse.data.token);
        localStorage.setItem("adminId", loginResponse.data.user.id);
        navigate("/admin-login"); // auto redirect
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error(err);
      setError("Error resetting password or logging in.");
    }
  };

  return (
    <div className="forget-container">
      <h2 className="forget-title">Forgot Password</h2>
      {error && <p className="forget-error">{error}</p>}
      {success && <p className="forget-success">{success}</p>}

      {step === 1 && (
        <form onSubmit={handleVerify} className="forget-form">
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="forget-input"
          />
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="forget-input"
          />
          <input
            type="text"
            placeholder="Enter Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="forget-input"
          />
          <button type="submit" className="forget-button">
            Verify
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handlePasswordChange} className="forget-form">
          <input
            type="password"
            placeholder="Enter New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="forget-input"
          />
          <button type="submit" className="forget-button">
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgetPasswordAdmin;
