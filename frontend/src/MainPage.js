import React from "react";
import { Link } from "react-router-dom";
import logo from './logo.jpeg';
import "./MainPage.css";

function MainPage() {
  return (
    <div className="main-container">
      <div className="content-box">
        {/* Logo on top */}
        <div className="logo-container">
          <img src={logo} alt="FlashMart Logo" className="image" />
        </div>

        <div className="main-title">
          <h2>Welcome To Flashmart, Your Grocery Hub!</h2>
        </div>

        <div className="sub-title">
          <h3>Please Select Login Type</h3>
        </div>

        <div className="buttons-container">
          <Link to="/customer-login">
            <button className="login-button">Login as Customer</button>
          </Link>

          <Link to="/admin-login">
            <button className="login-button">Login as Admin</button>
          </Link>

          <div className="signup-link-container">
            <Link to="/signup-customer" className="signup-link">
              Don't have an account? <u>Sign up as Customer</u>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
