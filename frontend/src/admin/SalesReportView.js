import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./viewcategories.css"; // Use your provided CSS for styling

const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("http://localhost:5000/api/salesreport", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      setSalesData(response.data.salesReportData || []);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching sales data:", error);
      setError("Error fetching sales report.");
      setLoading(false);
    });
  }, []);

  return (
    <div className="customers-container">
      <h2 className="customers-heading">Sales Report</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((product) => (
              <tr key={product.Product_ID}>
                <td>{product.Product_ID}</td>
                <td>{product.Product_Name}</td>
                <td>{parseFloat(product.TotalRevenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SalesReport;
