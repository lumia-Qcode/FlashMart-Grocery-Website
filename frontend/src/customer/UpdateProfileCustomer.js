import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UpdateProfileCustomer.css"; // Create if needed

const UpdateProfileCustomer = () => {
  const [formData, setFormData] = useState({
    Customer_Name: "",
    Customer_Email: "",
    Customer_PhoneNo: "",
    Customer_Address: "",
    Customer_Password: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return navigate("/login");
        }

        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const customerId = decodedToken.id;

        const { data } = await axios.get(
          `http://localhost:5000/api/getCustomer/${customerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setFormData({
          Customer_Name: data.Customer_Name,
          Customer_Email: data.Customer_Email,
          Customer_PhoneNo: data.Customer_PhoneNo,
          Customer_Address: data.Customer_Address,
          Customer_Password: data.Customer_Password,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching customer:", error);
        setMessage("Failed to load profile.");
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      const customerId = decodedToken.id;

      await axios.put(
        `http://localhost:5000/api/updateCustomer/${customerId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Update failed. Please try again.");
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="update-profile-container">
      <h2>Update Your Profile</h2>
      {message && <p className="status-message">{message}</p>}
      <form onSubmit={handleUpdate}>
        <label>
          Name:
          <input
            type="text"
            name="Customer_Name"
            value={formData.Customer_Name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="Customer_Email"
            value={formData.Customer_Email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Phone Number:
          <input
            type="text"
            name="Customer_PhoneNo"
            value={formData.Customer_PhoneNo}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Address:
          <input
            type="text"
            name="Customer_Address"
            value={formData.Customer_Address}
            onChange={handleChange}
            required
          />
        </label>
        <button type="button" onClick={() => navigate("/change-password")}>
            Change Password
        </button>
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default UpdateProfileCustomer;
