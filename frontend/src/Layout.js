import React from 'react';
import { Link, Outlet } from 'react-router-dom'; 
import "./Layout.css";

const Layout = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="app-container">
      <nav className="customer-navbar">
        <div className="nav-logo">FlashMart</div>
        <div className="nav-links">
          <Link to="/dashboardcustomer" className="nav-link">Home Page</Link>
          <Link to="/update-profile" className="nav-link">Update Profile</Link>
          <Link to="/order-history" className="nav-link">Order History</Link>
          <Link to="/cart" className="nav-link">View Cart</Link>
          <Link to="/wishlist" className="nav-link">View Wishlist</Link>
          <Link to="/products" className="nav-link">Place Order</Link>
          <Link to="/reviews" className="nav-link">Your Reviews</Link>
          <Link to="/pending-orders" className="nav-link">Pending Orders</Link>
          <button className="nav-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;
