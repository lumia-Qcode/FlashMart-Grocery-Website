import React, { useState } from "react";
import axios from "axios";
import "./SignupCustomer.css";

function SignupCustomer() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhoneNo, setCustomerPhoneNo] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhoneNo || !customerAddress || !customerPassword) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/insertCustomer", {
        Customer_Name: customerName,
        Customer_Email: customerEmail,
        Customer_PhoneNo: customerPhoneNo,
        Customer_Address: customerAddress,
        Customer_Password: customerPassword,
      });

      if (response.status === 201) {
        window.location.href = "/customer-login";
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <h2 className="signup-title">Sign Up as Customer</h2>

      <div className="signup-container">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div>
            <label htmlFor="customerName">Name</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="customerEmail">Email</label>
            <input
              type="email"
              id="customerEmail"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="customerPhoneNo">Phone Number</label>
            <input
              type="text"
              id="customerPhoneNo"
              value={customerPhoneNo}
              onChange={(e) => setCustomerPhoneNo(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label htmlFor="customerAddress">Address</label>
            <input
              type="text"
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter your address"
            />
          </div>

          <div>
            <label htmlFor="customerPassword">Password</label>
            <input
              type="password"
              id="customerPassword"
              value={customerPassword}
              onChange={(e) => setCustomerPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>

      <p className="signup-login-text">
        Already have an account? <a href="/customer-login">Login here</a>
      </p>
    </div>
  );
}

export default SignupCustomer;
