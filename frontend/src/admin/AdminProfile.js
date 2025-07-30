import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./AdminProfile.css"

const AdminProfile = () => {
    // State variables for the form fields and error handling
    const [adminData, setAdminData] = useState({
        Admin_Name: '',
        Admin_Email: '',
        Admin_Password: '',
    });

    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false); // State to control the modal visibility

    const adminId = localStorage.getItem('adminId'); // Get logged-in admin ID from localStorage or context
    
    // Fetch the current admin profile when the component mounts
    useEffect(() => {
        const token = localStorage.getItem("token");
        const fetchAdminData = async () => {
            try {
                // Fetch admin profile data
                const response = await axios.get("http://localhost:5000/admin/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`, // Add token in headers for authentication
                    },
                });

                // Set the admin data received from the API
                setAdminData(response.data.user);  // Accessing the 'user' key from the response data
            } catch (err) {
                setError('Failed to fetch admin details');
            }
        };

        fetchAdminData();
    }, []);

    // Handle form submission for updating admin details
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { Admin_Name, Admin_Email, Admin_Password } = adminData;
            const response = await axios.put(`http://localhost:5000/api/updateAdmin/${adminId}`, {
                Admin_Name,
                Admin_Email,
                Admin_Password,
            });
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.response ? err.response.data.message : 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission for updating admin password
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { Admin_Password } = adminData;
            const response = await axios.put(`http://localhost:5000/api/updateAdminPassword/${adminId}`, {
                Admin_Name: adminData.Admin_Name,
                Admin_Email: adminData.Admin_Email,
                Admin_Password: newPassword || Admin_Password, // Use new password if provided
            });
            setSuccess('Password updated successfully!');
            setShowPasswordModal(false); // Close the modal after success
        } catch (err) {
            setError(err.response ? err.response.data.message : 'Error updating password');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAdminData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        setNewPassword(e.target.value);
    };

    return (
        <div className="admin-profile-container">
            <h2>Admin Profile</h2>

            {/* Display success message */}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Display error message */}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="profile-header">
                {/* Profile Picture (Sample PFP) */}
                <div className="profile-pic">
                    <img
                        src="https://www.example.com/sample-pfp.jpg" // Replace with the actual profile picture URL
                        alt="Profile"
                        className="profile-pic-img"
                    />
                </div>
                <div className="profile-info">
                    <p><strong>Name:</strong> {adminData.Admin_Name}</p>
                    <p><strong>Email:</strong> {adminData.Admin_Email}</p>
                    <button onClick={() => setShowPasswordModal(true)}>Change Password</button>
                </div>
            </div>

            <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                    <label htmlFor="Admin_Name">Name:</label>
                    <input
                        type="text"
                        id="Admin_Name"
                        name="Admin_Name"
                        value={adminData.Admin_Name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="Admin_Email">Email:</label>
                    <input
                        type="email"
                        id="Admin_Email"
                        name="Admin_Email"
                        value={adminData.Admin_Email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="Admin_Password">Current Password:</label>
                    <input
                        type="password"
                        id="Admin_Password"
                        name="Admin_Password"
                        value={adminData.Admin_Password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>

            {/* Password Update Modal */}
            {showPasswordModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-btn" onClick={() => setShowPasswordModal(false)}>&times;</span>
                        <h3>Update Password</h3>
                        <form onSubmit={handleUpdatePassword}>
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password:</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProfile;
