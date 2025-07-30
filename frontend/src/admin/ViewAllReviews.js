import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './viewcategories.css'; // Reuses the customer-style CSS

const ViewReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("http://localhost:5000/api/reviews", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      setReviews(response.data.orderDetailsData);
      setLoading(false);
    })
    .catch(() => {
      setError("Failed to load reviews.");
      setLoading(false);
    });
  }, []);

  const handleDelete = (Reviews_ID) => {
    const token = localStorage.getItem("token");

    axios.delete(`http://localhost:5000/api/deleteReview/${Reviews_ID}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      if (response.data.success) {
        setReviews(prev => prev.filter(r => r.Reviews_ID !== Reviews_ID));
        alert("Deletion Successful! ");
      } else {
        alert("Failed to delete review.");
      }
    })
    .catch(() => {
      alert("Error deleting review.");
    });
  };

  return (
    <div className="customers-container">
      <h2 className="customers-heading">All Reviews</h2>

      {loading ? (
        <p>Loading reviews...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Review ID</th>
              <th>Customer ID</th>
              <th>Product ID</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Review Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.Reviews_ID}>
                <td>{review.Reviews_ID}</td>
                <td>{review.Customer_ID}</td>
                <td>{review.Product_ID}</td>
                <td>{review.Rating}</td>
                <td>{review.Comment || "N/A"}</td>
                <td>{new Date(review.ReviewDate).toLocaleDateString()}</td>
                <td>
                  {/* Update is optional */}
                  <button className="delete-category" onClick={() => handleDelete(review.Reviews_ID)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewReviews;
