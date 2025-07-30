import React, { useState } from "react";
import axios from "axios";
import "./productsView.css"; // For modal styling

const CategoryAddModal = ({ onClose, onAddCategory }) => {
  const [category, setCategory] = useState({
    Supplier_ID: "",
    Category_Name: "",
    Category_Description: "",
    Category_Image: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/insertCategory",
        category,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        onAddCategory(); // Notify parent to update category list
        onClose(); // Close modal
      } else {
        alert("Error adding category: " + response.data.message);
      }
    } catch (error) {
      console.error("Add category error:", error);
      alert("Error adding category. Please try again.");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Add New Category</h3>
        <form onSubmit={handleSubmit}>
          <label>Supplier ID:</label>
          <input
            type="text"
            name="Supplier_ID"
            value={category.Supplier_ID}
            onChange={handleChange}
          />

          <label>Category Name:</label>
          <input
            type="text"
            name="Category_Name"
            value={category.Category_Name}
            onChange={handleChange}
          />

          <label>Category Description:</label>
          <textarea
            name="Category_Description"
            value={category.Category_Description}
            onChange={handleChange}
          />

          <label>Category Image URL:</label>
          <input
            type="text"
            name="Category_Image"
            value={category.Category_Image}
            onChange={handleChange}
          />

          <div className="modal-actions">
            <button className="save">Save</button>
            <button type="button" className="cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryAddModal;
