import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderHistory.css";

const CustomerOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const customerId = localStorage.getItem("customerId");

  useEffect(() => {
    if (!token || !customerId) return;

    axios
      .get(`http://localhost:5000/api/getOrder/customerid/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load orders.");
        setLoading(false);
      });
  }, [token, customerId]);

  const viewOrderDetails = (orderId) => {
    setSelectedOrderDetails([]); // reset
    axios
      .get(`http://localhost:5000/api/getOrderDetails/orderid/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSelectedOrderDetails(res.data.data);
      })
      .catch((err) => {
        setError("Failed to load order details.");
      });
  };

  if (loading) return <p>Loading order history...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="order-history-container">
      <h2>Your Order History</h2>
      <div className="order-list">
        {orders.map((order) => (
          <div key={order.Order_ID} className="order-card">
            <p><strong>Date:</strong> {new Date(order.OrderDate).toLocaleDateString()}</p>
            <p><strong>Total:</strong> Rs. {order.TotalPrice}</p>
            <button onClick={() => viewOrderDetails(order.Order_ID)}>View Details</button>
          </div>
        ))}
      </div>

      {selectedOrderDetails.length > 0 && (
        <div className="order-details">
          <h3>Order Details</h3>
          <table>
            <thead>
              <tr>
                <th>Product Image</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrderDetails.map((detail) => (
                <tr key={detail.Product_ID}>
                  <td>
                    <img
                      src={`./images/${detail.Product_Name.replace(/\s+/g, '')}.jpeg`}
                      alt={detail.Product_Name}
                      className="product-image"
                      onError={(e) => (e.target.src = '/images/default.jpeg')}  // Fallback image if the image is not found
                    />
                  </td>
                  <td>{detail.Product_Name}</td>
                  <td>{detail.OrderDetails_Quantity}</td>
                  <td>{detail.OrderDetails_Price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderHistory;
