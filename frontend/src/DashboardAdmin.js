import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from './logo.jpeg';
import './DashboardAdmin.css';
import { FaBell, FaUserCircle } from 'react-icons/fa';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [orderSummary, setOrderSummary] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [bottomSellingProducts, setBottomSellingProducts] = useState([]);
  const [error, setError] = useState("");
  const [top5Customers, setTop5Customers] = useState([]);
  const [isMaxRevenueVisible, setIsMaxRevenueVisible] = useState(false);
  const [isMinRevenueVisible, setIsMinRevenueVisible] = useState(false);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [isTopSellingVisible, setIsTopSellingVisible] = useState(false);
  const [isBottomSellingVisible, setIsBottomSellingVisible] = useState(false);
  const [reviews, setReviews] = useState({});
  const [maxRevenueProduct, setMaxRevenueProduct] = useState(null);
  const [minRevenueProduct, setMinRevenueProduct] = useState(null);
  const [isTopCustomersVisible, setIsTopCustomersVisible] = useState(false);
  const [isOrderSummaryVisible, setIsOrderSummaryVisible] = useState(true); // State for Order Summary visibility

  const token = localStorage.getItem("token");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Token is missing");
      navigate("/login");
      return;
    }

    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const adminId = decodedToken.id;

    if (!adminId) {
      console.error("Admin ID is missing from the decoded token.");
      navigate("/login");
      return;
    }

    fetchTopSellingProducts(token);
    fetchBottomSellingProducts(token);
    fetchMaxRevenueProduct(token);
    fetchMinRevenueProduct(token);
    fetchTop5Customers(token);
    fetchOrderSummary(token); // Add this line
  }, [token]);

  const fetchTop5Customers = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/top5customersbyspendingView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTop5Customers(response.data.customerData);
      console.log("Top 5 customers fetched:", response.data.customerData);
    } catch (err) {
      console.error("Error fetching top 5 customers:", err);
      setError("Failed to load top 5 customers.");
    }
  };

  const fetchOrderSummary = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/ordersummaryView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrderSummary(response.data.customerData);
      console.log("Order summary fetched:", response.data.customerData);
    } catch (err) {
      console.error("Error fetching order summary:", err);
      setError("Failed to load order summary.");
    }
  };

  const fetchMaxRevenueProduct = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/productmaxrevenueView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaxRevenueProduct(response.data.customerData[0]);
      console.log("Max revenue product fetched:", response.data.customerData[0]);
    } catch (err) {
      console.error("Error fetching max revenue product:", err);
      setError("Failed to load max revenue product.");
    }
  };

  const fetchMinRevenueProduct = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/productminrevenueView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMinRevenueProduct(response.data.customerData[0]);
      console.log("Min revenue product fetched:", response.data.customerData[0]);
    } catch (err) {
      console.error("Error fetching min revenue product:", err);
      setError("Failed to load min revenue product.");
    }
  };

  const fetchTopSellingProducts = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/top5productsView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTopSellingProducts(response.data.customerData);
      console.log("Top selling products fetched:", response.data.customerData);
    } catch (err) {
      console.error("Error fetching top selling products:", err);
      setError("Failed to load top selling products.");
    }
  };

  const fetchBottomSellingProducts = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/bottom5productsView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBottomSellingProducts(response.data.customerData);
      console.log("Bottom selling products fetched:", response.data.customerData);
    } catch (err) {
      console.error("Error fetching bottom selling products:", err);
      setError("Failed to load bottom selling products.");
    }
  };

  const fetchProductReviews = async (productId) => {
    console.log(`Fetching reviews for product ID: ${productId}`);
    try {
      const response = await axios.get(`http://localhost:5000/api/getReviews/productid/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const firstReview = response.data[0];
      console.log(firstReview);
      const reviewText = firstReview?.Comment || 'No reviews available';

      setReviews((prevReviews) => ({
        ...prevReviews,
        [productId]: reviewText,
      }));

    } catch (err) {
      console.error("Error fetching product reviews:", err);
      setError("Failed to load reviews.");
    }
  };

  useEffect(() => {
    if (topSellingProducts.length > 0) {
      topSellingProducts.forEach((product) => {
        fetchProductReviews(product.Product_ID);
      });
    }
  }, [topSellingProducts]);

  useEffect(() => {
    if (bottomSellingProducts.length > 0) {
      bottomSellingProducts.forEach((product) => {
        fetchProductReviews(product.Product_ID);
      });
    }
  }, [bottomSellingProducts]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="admin-home-container">
      <div className="top-bar">
        <div className="logo-container">
          <img src={logo} alt="FlashMart Logo" className="image" />
          <div className="title">FlashMart Admin Dashboard</div>
        </div>
        <div className="top-bar-actions">
          <button className="notification-button">
            <FaBell size={20} />
          </button>
          <div
            className="profile-container"
            onMouseEnter={() => setShowProfileOptions(true)}
            onMouseLeave={() => setShowProfileOptions(false)}
          >
            <button className="profile-button">
              <FaUserCircle size={30} />
            </button>
            {showProfileOptions && (
              <div className="profile-dropdown">
                <button className="profile-dropdown-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content-area">
        <div className="sidebar">
          <button className="sidebar-button" onClick={() => navigate("/admin/suppliers")}>View Suppliers</button>
          <button className="sidebar-button" onClick={() => navigate("/admin/customers")}>View Customers</button>
          <button className="sidebar-button" onClick={() => navigate("/admin/products")}>All Products</button>
          <button className="sidebar-button" onClick={() => navigate("/admin/categories")}>All Categories</button>
          <button className="sidebar-button" onClick={() => navigate("/admin/reviews")}>Reviews</button>
          <button className="sidebar-button" onClick={() => navigate("/admin/payments")}>  Payments Status</button>
          <button className="sidebar-button" onClick={() => navigate("/admin/orders")}>Ongoing Orders</button>
          <button className="sidebar-button" onClick={() => navigate("/admin/salesreport")}>Sales Report</button>
          <button className="edit-profile-button" onClick={() => navigate("/admin/updateadminprofile")}>Edit Profile</button>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        {/* Main Content (Top and Bottom Selling Products) */}
        <div className="main-content">
          {/* Top Selling Products */}
          <div className="products-view" onClick={() => setIsTopSellingVisible(!isTopSellingVisible)}>
            <h2>📈 Top 5 Selling Products</h2>
            {isTopSellingVisible && (
              <div className="scrollable-product-list">
                <div>
                  {topSellingProducts.length > 0 ? (
                    <ul className="product-list">
                      {topSellingProducts.map((product) => (
                        <li key={product.Product_ID}>
                          <div className="product-item">
                            <img src={`/images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`} alt={product.Product_Name} className="product-image" />
                            <div className="product-details">
                              <h3>{product.Product_Name}</h3>
                              <p><strong>Price:</strong> ${product.Product_Price}</p>
                              <p><strong>Latest Review:</strong> {reviews[product.Product_ID] || 'Loading review...'}</p>
                            </div>
                          </div>

                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No top selling products found.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Selling Products */}
          <div className="products-view" onClick={() => setIsBottomSellingVisible(!isBottomSellingVisible)}>
            <h2>📉 Bottom 5 Selling Products</h2>
            {isBottomSellingVisible && (
              <div>
                {bottomSellingProducts.length > 0 ? (
                  <div className="scrollable-product-list">
                    <ul className="product-list">
                      {bottomSellingProducts.map((product) => (
                        <li key={product.Product_ID}>
                          <div className="product-item">
                            <img src={`/images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`} alt={product.Product_Name} className="product-image" />
                            <div className="product-details">
                              <h3>{product.Product_Name}</h3>
                              <p><strong>Price:</strong> ${product.Product_Price}</p>
                              <p><strong>Latest Review:</strong> {reviews[product.Product_ID] || 'Loading review...'}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                ) : (
                  <p>No bottom selling products found.</p>
                )}
              </div>


            )}
          </div>
          {/* Max Revenue Product */}
          <div className="products-view" onClick={() => setIsMaxRevenueVisible(!isMaxRevenueVisible)}>
            <h2>💰 Max Revenue Product</h2>
            {isMaxRevenueVisible && (
              <div>
                {maxRevenueProduct ? (
                  <div className="product-item">
                    <img src={`/images/${maxRevenueProduct.Product_Name.replace(/\s+/g, '')}.jpeg`} alt={maxRevenueProduct.Product_Name} className="product-image" />
                    <div className="product-details">
                      <h3>{maxRevenueProduct.Product_Name}</h3>
                      <p><strong>Price:</strong> ${maxRevenueProduct.Product_Price}</p>
                      <p><strong>Total Revenue:</strong> ${maxRevenueProduct.Total_Revenue}</p>
                    </div>
                  </div>
                ) : (
                  <p>No max revenue product found.</p>
                )}
              </div>
            )}
          </div>

          {/* Min Revenue Product */}
          <div className="products-view" onClick={() => setIsMinRevenueVisible(!isMinRevenueVisible)}>
            <h2>💸 Min Revenue Product</h2>
            {isMinRevenueVisible && (
              <div>
                {minRevenueProduct ? (
                  <div className="product-item">
                    <img src={`/images/${minRevenueProduct.Product_Name.replace(/\s+/g, '')}.jpeg`} alt={minRevenueProduct.Product_Name} className="product-image" />
                    <div className="product-details">
                      <h3>{minRevenueProduct.Product_Name}</h3>
                      <p><strong>Price:</strong> ${minRevenueProduct.Product_Price}</p>
                      <p><strong>Total Revenue:</strong> ${minRevenueProduct.Total_Revenue}</p>
                    </div>
                  </div>
                ) : (
                  <p>No min revenue product found.</p>
                )}
              </div>
            )}
          </div>

          <div className="products-view" onClick={() => setIsTopCustomersVisible(!isTopCustomersVisible)}>
            <h2>👥 Top 5 Customers</h2>
            {isTopCustomersVisible && (
              <div className="scrollable-product-list">
                <div>
                  {top5Customers.length > 0 ? (
                    <div className="customer-list-container">
                      <ul className="customer-list">
                        {top5Customers.map((customer) => (
                          <li key={customer.Customer_ID}>
                            <div className="customer-item">
                              <h3>{customer.Customer_Name}</h3>
                              <p><strong>Total Spend:</strong> ${customer.Total_Spending}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No top customers found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
