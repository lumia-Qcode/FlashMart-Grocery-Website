import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UpdateAdminProfile.css"; // You can style this as needed

const UpdateAdminProfile = () => {
  const [formData, setFormData] = useState({
    Admin_Name: "",
    Admin_Email: "",
    Admin_PhoneNo:"",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return navigate("/login");
        }

        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const adminId = decodedToken.id;

        const { data } = await axios.get(
          `http://localhost:5000/api/getAdmin/${adminId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setFormData({
          Admin_Name: data.Admin_Name,
          Admin_Email: data.Admin_Email,
          Admin_PhoneNo:data.Admin_PhoneNo,
          Admin_Password: data.Admin_Password // Add this line
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin:", error);
        setMessage("Failed to load profile.");
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      const adminId = decodedToken.id;

      await axios.put(
        `http://localhost:5000/api/updateAdmin/${adminId}`,
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
      <h2>Update Admin Profile</h2>
      {message && <p className="status-message">{message}</p>}
      <form onSubmit={handleUpdate}>
        <label>
          Name:
          <input
            type="text"
            name="Admin_Name"
            value={formData.Admin_Name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="Admin_Email"
            value={formData.Admin_Email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Phone No:
          <input
            type="text"
            name="Admin_PhoneNo"
            value={formData.Admin_PhoneNo}
            onChange={handleChange}
            required
          />
        </label>

        <div className="button-group">
          <button type="submit">Update Profile</button>
          <button
            type="button"
            className="password-button"
            onClick={() => navigate("/admin/updateadminpassword")}
          >
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateAdminProfile;
