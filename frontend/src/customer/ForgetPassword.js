import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ForgetPassword.css";

const ForgetPassword = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate(); 

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/forgetPasswordVerify",
        {
          Customer_Name:name,
          Customer_Email:email,
          Customer_PhoneNo:phone,
        }
      );

      const { success, customerId } = response.data;

      if (success && customerId) {
        setCustomerId(customerId);
        setStep(2);
      } else {
        setError("Customer not found or info doesn't match.");
      }      
    } catch (err) {
      console.error(err);
      setError("Error verifying customer.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
  
    try {
      // 1. Reset the password
      await axios.put(
        `http://localhost:5000/api/resetPassword/${customerId}`,
        { 
            Customer_Password: newPassword
        }
      );
  
      // 2. Log the customer in immediately
      const loginResponse = await axios.post("http://localhost:5000/customer/login", {
        Customer_Email: email,
        Customer_Password: newPassword,
      });
  
      if (loginResponse.data.token) {
        alert("Customer Login Successful!");
        localStorage.setItem("token", loginResponse.data.token);
        localStorage.setItem("customerId", loginResponse.data.user.id);
        navigate("/customer-login"); //  auto redirect
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

export default ForgetPassword;
