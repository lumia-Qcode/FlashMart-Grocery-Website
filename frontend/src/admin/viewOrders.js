import React, { useEffect, useState } from "react";
import axios from "axios";
import "./viewcategories.css"; // Use your provided CSS

const OngoingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //the token from localStorage or context
  const token = localStorage.getItem("token"); 

  // Fetch ongoing orders when the component mounts
  useEffect(() => {
    const fetchOngoingOrders = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/ongoingOrders", {
          headers: {
            Authorization: `Bearer ${token}`, // Send the token in the Authorization header
          },
        });

        if (response.data.success) {
          setOrders(response.data.ongoingOrders);
        } else {
          setError("No ongoing orders found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching ongoing orders.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOngoingOrders();
    } else {
      setError("No authorization token found.");
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="container">
      <h2 className="heading">Ongoing Orders</h2>
      {loading ? (
        <div className="loading-message">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Status</th>
              <th>Total Price</th>
              <th>Order Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.Order_ID}>
                <td>{order.Order_ID}</td>
                <td>{order.Customer_ID}</td>
                <td>{new Date(order.OrderDate).toLocaleDateString()}</td>
                <td>{order.OrderStatus === 'P' ? 'Pending' : 'Completed'}</td>
                <td>{order.TotalPrice}</td>
                <td>
                  <ul>
                    {orders
                      .filter(o => o.Order_ID === order.Order_ID)
                      .map((orderDetail) => (
                        <li key={orderDetail.OrderDetails_ID}>
                          Product ID: {orderDetail.Product_ID} | Quantity: {orderDetail.OrderDetails_Quantity} | Price: {orderDetail.OrderDetails_Price}
                        </li>
                      ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OngoingOrders;
