import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './customersview.css';

const CustomersView = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); 


  useEffect(() => {
    const token = localStorage.getItem("token"); // Get token from localStorage
  
    axios.get("http://localhost:5000/api/customer", {
      headers: {
        Authorization: `Bearer ${token}`, // Pass the token in the header
      },
    })
    .then((response) => {
      setCustomers(response.data.customerData);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching customers:", error);
      setLoading(false);
    });
  }, [navigate]); 

  return (
    <div className="suppliers-container">
      <h2>Customers List</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.Customer_ID}>
                <td>{customer.Customer_ID}</td>
                <td>{customer.Customer_Name}</td>
                <td>{customer.Customer_Email}</td>
                <td>{customer.Customer_PhoneNo}</td>
                <td>{customer.Customer_Address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomersView;
