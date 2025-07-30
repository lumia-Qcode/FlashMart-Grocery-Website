import React, { useEffect, useState } from "react";
import jwtDecode from "jwt-decode";
import axios from "axios";
import "./viewpendingorder.css";

const ViewPendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [detailsMap, setDetailsMap] = useState({});
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const decodedToken = JSON.parse(atob(token.split(".")[1]));
  const customerId = decodedToken.id;

  useEffect(() => {
    if (!customerId || !token) {
      setError("Authentication required.");
      return;
    }

    const fetchPendingOrders = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/getPendingOrders/customerid/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setOrders(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch orders.");
      }
    };

    fetchPendingOrders();
  }, [customerId, token]);

  const fetchOrderDetails = async (orderId) => {
    if (detailsMap[orderId]) return; 

    try {
      const res = await axios.get(
        `http://localhost:5000/api/getOrderDetails/orderid/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDetailsMap((prev) => ({ ...prev, [orderId]: res.data.data }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to fetch order details.");
    }
  };

  return (
    <div className="pending-orders-container">
      <h2>Pending Orders</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order.Order_ID}>
            <p><strong>Date:</strong> {new Date(order.OrderDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {order.OrderStatus === 'P' ? 'Pending Order' : order.OrderStatus}</p>
            <p><strong>Total Price:</strong> { order.TotalPrice}</p>
            <button onClick={() => fetchOrderDetails(order.Order_ID)}>
              View Details
            </button>
            {detailsMap[order.Order_ID] && (
              <div className="order-details">
                <h4>Order Details:</h4>
                <ul>
                  {detailsMap[order.Order_ID].map((detail, index) => (
                    <li key={index}>
                      <strong>{detail.Product_Name}</strong><br />
                      Quantity: {detail.OrderDetails_Quantity}<br />
                      Price: ${detail.OrderDetails_Price}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewPendingOrders;
