import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './supplierdetails.css';
import { jwtDecode } from 'jwt-decode';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add' | 'edit'
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    Supplier_Name: "",
    Supplier_PhoneNo: "",
    Supplier_Address: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    const isTokenExpired = (token) => {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
      } catch {
        return true;
      }
    };

    if (!token || isTokenExpired(token)) {
      navigate("/admin-login");
      return;
    }

    axios.get("http://localhost:5000/api/supplierDetails", {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(response => {
        setSuppliers(response.data.orderDetailsData);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch supplier details. Please try again later.");
        setLoading(false);
      });
  }, [navigate]);

  const handleAddClick = () => {
    setModalType("add");
    setFormData({ Supplier_Name: "", Supplier_PhoneNo: "", Supplier_Address: "" });
    setShowModal(true);
  };

  const handleEditClick = (supplier) => {
    setModalType("edit");
    setSelectedSupplier(supplier);
    setFormData({
      Supplier_Name: supplier.Supplier_Name,
      Supplier_PhoneNo: supplier.Supplier_PhoneNo,
      Supplier_Address: supplier.Supplier_Address,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (supplierId) => {
    const token = localStorage.getItem("token");
    axios.delete(`http://localhost:5000/api/deleteSupplier/${supplierId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    }).then(() => {
      setSuppliers(suppliers.filter(s => s.Supplier_ID !== supplierId));
      alert("Deleted SuccessFully!");
    }).catch(err => {
      alert("Failed to delete supplier");
    });
  };

  const handleModalSubmit = () => {
    const token = localStorage.getItem("token");

    const request = modalType === "add"
      ? axios.post("http://localhost:5000/api/insertSupplier", formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      : axios.put(`http://localhost:5000/api/updateSupplierDetails/${selectedSupplier.Supplier_ID}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });

    request.then(() => {
      alert("Action Successful!");
      window.location.reload(); // You can also refetch data instead of full reload
    }).catch(() => {
      alert("Failed to save changes");
    });
  };

  return (
    <div className="suppliers-container">
      <h2 className="customers-heading">Suppliers List</h2>

      <button className="add-category" onClick={handleAddClick}>
        + Add Supplier
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Supplier ID</th>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.Supplier_ID}>
                <td>{supplier.Supplier_ID}</td>
                <td>{supplier.Supplier_Name}</td>
                <td>{supplier.Supplier_PhoneNo}</td>
                <td>{supplier.Supplier_Address}</td>
                <td>
                  <button className="update-category" onClick={() => handleEditClick(supplier)}>
                    Update
                  </button>
                  <button className="delete-category" onClick={() => handleDeleteClick(supplier.Supplier_ID)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{modalType === "add" ? "Add Supplier" : "Update Supplier"}</h3>

            <label>Name</label>
            <input
              type="text"
              value={formData.Supplier_Name}
              onChange={(e) => setFormData({ ...formData, Supplier_Name: e.target.value })}
            />

            <label>Phone Number</label>
            <input
              type="text"
              value={formData.Supplier_PhoneNo}
              onChange={(e) => setFormData({ ...formData, Supplier_PhoneNo: e.target.value })}
            />

            <label>Address</label>
            <textarea
              value={formData.Supplier_Address}
              onChange={(e) => setFormData({ ...formData, Supplier_Address: e.target.value })}
            />

            <div className="modal-actions">
              <button className="save" onClick={handleModalSubmit}>Save</button>
              <button className="cancel" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
