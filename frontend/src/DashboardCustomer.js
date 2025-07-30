import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import backgroundImage from './logo.jpeg';
import "./DashboardCustomer.css";

const DashboardCustomer = () => {
  const navigate = useNavigate();
  const [newReview, setNewReview] = useState({ rating: "", comment: "" });
  const [reviewSubmittingProductId, setReviewSubmittingProductId] = useState(null);
  const [top5Products, setTop5Products] = useState([]);
  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerNames, setCustomerNames] = useState([]);

  const [selectedProductReviews, setSelectedProductReviews] = useState([]);
  const [showReviewsForProductId, setShowReviewsForProductId] = useState(null);

  const fetchTop5Products = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/top5productsView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Top 5 Products:", response.data.customerData);
      setTop5Products(response.data.customerData || []);
    } catch (error) {
      console.error("Error fetching top 5 products:", error);
    }
  };

  const fetchBuyAgainProducts = async (token, customerId) => {
    try {
      const ordersResponse = await axios.get(
        `http://localhost:5000/api/getOrder/customerid/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderIDs = ordersResponse.data.data.map((order) => order.Order_ID);
      const productIdSet = new Set();

      for (let orderId of orderIDs) {
        const orderDetailsRes = await axios.get(
          `http://localhost:5000/api/getOrderDetails/orderid/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        for (let item of orderDetailsRes.data.data) {
          productIdSet.add(item.Product_ID);
        }
      }

      const productDetails = await Promise.all(
        Array.from(productIdSet).map(async (productId) => {
          try {
            const res = await axios.get(
              `http://localhost:5000/api/getProduct/${productId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
          } catch (err) {
            console.error(`Error fetching product ${productId}:`, err);
            return null;
          }
        })
      );

      setBuyAgainProducts(productDetails.filter(p => p !== null));
    } catch (err) {
      console.error("Error fetching 'Buy Again' products:", err);
      setError("Failed to load Buy Again products.");
    }
  };

  const fetchCategories = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/category", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.orderDetailsData || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchCategoryProducts = async (token, categoryId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/getProduct/categoryid/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategoryProducts((prev) => ({
        ...prev,
        [categoryId]: res.data.data,
      }));
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
    }
  };

  const fetchAllCustomerNames = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/getAllCustomerNames", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      //console.log("All Customer Names:", response.data);
      setCustomerNames(response.data);  // Save customer names in state
    } catch (error) {
      console.error("Error fetching customer names:", error);
    }
  };

  const fetchReviews = async (productId, token) => {
    try {
      // First fetch all customer names to map them to reviews
      //fetchAllCustomerNames(token);
  
      const response = await axios.get(
        `http://localhost:5000/api/getReviews/productid/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const reviews = response.data;
  
      if (reviews && reviews.length > 0) {
        // Map over the reviews and add customer name by matching Customer_ID
        const enhancedReviews = reviews.map((review) => {
          const customer = customerNames.find((cust) => cust.Customer_ID === review.Customer_ID);
          const customerName = customer ? customer.Customer_Name : "Unknown Customer";
  
          return { ...review, Customer_Name: customerName };
        });
  
        setSelectedProductReviews(enhancedReviews); // Update state with enhanced reviews
      } else {
        setSelectedProductReviews([]); // No reviews available
      }
  
      setShowReviewsForProductId(productId);
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      setSelectedProductReviews([]); // Handle error gracefully
      setShowReviewsForProductId(productId); // still show section with "No reviews"
    }
  };

  const handleSubmitReview = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
  
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const customerId = decodedToken.id;
  
    try {
       await axios.post("http://localhost:5000/api/insertReview", {
        Customer_ID: customerId,
        Product_ID: productId,
        Rating: parseInt(newReview.rating),
        Comment: newReview.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      alert("Review submitted successfully!");
      setNewReview({ rating: "", comment: "" });
      setReviewSubmittingProductId(null);
      fetchReviews(productId, token); // Refresh reviews
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };
  

  const toggleCategory = (categoryId, token) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null); // collapse
    } else {
      setExpandedCategory(categoryId);
      if (!categoryProducts[categoryId]) {
        fetchCategoryProducts(token, categoryId);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Token is missing");
      navigate("/login");
      return;
    }

    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const customerId = decodedToken.id;

    if (!customerId) {
      console.error("Customer ID is missing from the decoded token.");
      navigate("/login");
      return;
    }

    fetchTop5Products(token); 
    fetchAllCustomerNames(token);
    fetchBuyAgainProducts(token, customerId);
    fetchCategories(token);
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="customer-home-container">
      {/* Welcome */}
      <div className="welcome-banner" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="welcome-text">
          <h1>Welcome to FlashMart, Your Grocery Hub!</h1>
          <p>Find your favorites and discover fresh flavors!</p>
        </div>
      </div>


      {/* All Categories */}
      <div className="top-products-container">
        <h2>All Categories</h2>
        <div className="product-cards">
          {categories.map((cat) => (
            <div key={cat.Category_ID} className="product-card">
              <img
                src={`./images/${cat.Category_Name.replace(/\s+/g, '')}.jpeg`} 
                alt={cat.Category_Name}
                className="product-image category-image"
                onClick={() => toggleCategory(cat.Category_ID, localStorage.getItem("token"))}
                onError={(e) => e.target.src = '/images/default.jpeg'}
              />
              <h3>{cat.Category_Name}</h3>

              {/* Expandable Category Products */}
              {expandedCategory === cat.Category_ID && categoryProducts[cat.Category_ID] && (
                <div className="category-products-dropdown">
                  {categoryProducts[cat.Category_ID].map((product) => (
                    <div key={product.Product_ID} className="category-product-card">
                      <img
                        src={`./images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`}
                        alt={product.Product_Name}
                        className="product-image"
                        onClick={() => fetchReviews(product.Product_ID, localStorage.getItem("token"))}
                        onError={(e) => e.target.src = '/images/default.jpeg'}
                      />
                      <h4>{product.Product_Name}</h4>
                      <p>Price: Rs.{product.Product_Price}</p>
                      {showReviewsForProductId === product.Product_ID && (
                        <div className="reviews-section">
                          <h5>Reviews:</h5>
                          {selectedProductReviews.length > 0 ? (
                           <ul>
                           {selectedProductReviews.map((review, idx) => {
                             const formattedDate = new Date(review.ReviewDate).toLocaleDateString("en-GB"); // DD/MM/YYYY format
                         
                             return (
                               <li key={idx} className="review-item">
                                 <p>
                                   <strong>{review.Customer_Name}</strong> rated it <strong>{review.Rating}/5</strong>
                                 </p>
                                 <p className="review-date">
                                   <em>Reviewed on: {formattedDate}</em>
                                 </p>
                                 <p>{review.Comment ? review.Comment : "No review text provided."}</p>
                               </li>
                             );
                           })}
                         </ul>
                         
                          ) : (
                            <p>No reviews found for this product.</p>
                          )}
                          <div className="submit-review-form">
  <h5>Submit Your Review:</h5>
  <input
    type="number"
    min="1"
    max="5"
    placeholder="Rating (1-5)"
    value={newReview.rating}
    onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
  />
  <textarea
    placeholder="Write a comment (optional)"
    value={newReview.comment}
    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
  />
  <button onClick={() => handleSubmitReview(product.Product_ID)}>Submit Review</button>
</div>

                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Best Selling */}
      <div className="top-products-container">
        <h2>Top 5 Best Selling Products</h2>
        <div className="product-cards">
          {top5Products.length > 0 ? top5Products.map((product) => (
            <div key={product.Product_ID} className="product-card">
              <img
                src={`./images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`}
                alt={product.Product_Name}
                className="product-image"
                onError={(e) => e.target.src = '/images/default.jpeg'}
              />
              <h3>{product.Product_Name}</h3>
            </div>
          )) : <p>Loading top products...</p>}
        </div>
      </div>

      {/* Buy Again Section */}
      <div className="top-products-container">
        <h2>Buy Again</h2>
        <div className="product-cards">
          {buyAgainProducts.length > 0 ? buyAgainProducts.map((product) => (
            <div key={product.Product_ID} className="product-card">
              <img
                src={`./images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`} 
                alt={product.Product_Name}
                className="product-image"
                onError={(e) => e.target.src = '/images/default.jpeg'}
              />
              <h3>{product.Product_Name}</h3>
            </div>
          )) : <p>You haven't purchased anything yet.</p>}
        </div>
      </div>

     
     
    </div>
  );
};

export default DashboardCustomer;
 