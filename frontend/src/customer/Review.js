import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Review.css';

// Function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(); // e.g., "4/17/2025"
};

const ViewReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState({});

  const token = localStorage.getItem('token');
  const customerID = localStorage.getItem('customerId');

  // Fetch customer reviews
  const fetchCustomerReviews = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/getReviews/customerid/${customerID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data);
    } catch (err) {
      console.error('Fetch Reviews Error:', err);
      setError("Failed to fetch your reviews.");
    } finally {
      setLoading(false);
    }
  }, [customerID, token]);

  // Fetch product details
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/productDetail', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const productMap = {};
      (response.data.orderDetailsData || []).forEach(prod => {
        productMap[prod.Product_ID] = prod.Product_Name;
      });

      setProducts(productMap);
    } catch (err) {
      console.error('Failed to fetch product names', err);
    }
  }, [token]);

  useEffect(() => {
    if (customerID) {
      fetchProducts();
      fetchCustomerReviews();
    } else {
      setError("Customer not logged in.");
      setLoading(false);
    }
  }, [customerID, fetchProducts, fetchCustomerReviews]);

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/deleteReview/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message || "Review deleted.");
      fetchCustomerReviews();
    } catch (err) {
      console.error('Delete Review Error:', err);
      setError("Failed to delete review.");
    }
  };

  return (
    <div className="review-container">
      <h2>Your Reviews</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {error && <p className="error">{error}</p>}

          {reviews.length > 0 ? (
            <ul className="review-list">
              {reviews.map((review) => {
                const productName = products[review.Product_ID] || `Product ID: ${review.Product_ID}`;
                const imageName = products[review.Product_ID]
                  ? products[review.Product_ID].replace(/\s+/g, '')
                  : 'default';

                return (
                  <li key={review.Reviews_ID} className="review-item">
                    <div className="review-content">
                      <img
                        src={`/images/${imageName}.jpeg`}
                        alt={productName}
                        className="review-image"
                        onError={(e) => { e.target.src = '/images/default.jpeg'; }}
                      />
                      <div>
                        <p><strong>Product:</strong> {productName}</p>
                        <p><strong>Rating:</strong> {review.Rating}</p>
                        <p><strong>Comment:</strong> {review.Comment}</p>
                        <p><strong>Date:</strong> {formatDate(review.ReviewDate)}</p>
                        <button onClick={() => handleDeleteReview(review.Reviews_ID)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>You haven't written any reviews yet.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ViewReviews;
