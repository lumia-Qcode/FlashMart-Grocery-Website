import React, { useState, useEffect } from "react";
import axios from "axios";
import './paymentstatus.css';

const PaymentStatus = () => {
  const [paymentStatusData, setPaymentStatusData] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      console.error("Token is missing");
      return;
    }

    fetchPaymentStatus(token);
  }, [token]);

  const fetchPaymentStatus = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/paymentstatusView", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentStatusData(response.data.customerData);
      console.log("Payment status fetched:", response.data.customerData);
    } catch (err) {
      console.error("Error fetching payment status:", err);
      setError("Failed to load payment status.");
    }
  };

  return (
    <div className="delivery-status-container">
      <h1>Payment Status</h1>
      {error && <p className="error">{error}</p>}
      {paymentStatusData.length > 0 ? (
        <div className="delivery-status-table">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Customer Email</th>
                <th>Customer Phone No</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {paymentStatusData.map((payment) => (
                <tr key={payment.Payments_ID}>
                  <td>{payment.Payments_ID}</td>
                  <td>{payment.Order_ID}</td>
                  <td>{payment.Customer_ID}</td>
                  <td>{payment.Customer_Name}</td>
                  <td>{payment.Customer_Email}</td>
                  <td>{payment.Customer_PhoneNo}</td>
                  <td>{payment.PaymentMethod}</td>
                  <td>{payment.PaymentStatus}</td>
                  <td>{payment.Transaction_ID}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No payment status found.</p>
      )}
    </div>
  );
};

export default PaymentStatus;
