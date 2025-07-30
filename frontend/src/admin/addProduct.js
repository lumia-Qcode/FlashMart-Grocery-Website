import React, { useState } from "react";
import axios from "axios";
import "./productsView.css"; // Add necessary CSS for modal

const ProductAddModal = ({ onClose, onAddProduct }) => {
  const [product, setProduct] = useState({
    Category_ID: "",
    Product_Name: "",
    Product_Price: "",
    Product_Quantity: "",
    Product_ExpiryDate: "",
    Product_Image: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Get token from localStorage

    try {
      const response = await axios.post(
        "http://localhost:5000/api/insertProduct",
        product,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        onAddProduct(); // Notify parent to add the product to the list
        onClose(); // Close the modal
      } else {
        alert("Error adding product: " + response.data.message);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Please try again.");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Add New Product</h3>
        <form onSubmit={handleSubmit}>
          <label>Category ID:</label>
          <input
            type="text"
            name="Category_ID"
            value={product.Category_ID}
            onChange={handleChange}
          />
          <label>Product Name:</label>
          <input
            type="text"
            name="Product_Name"
            value={product.Product_Name}
            onChange={handleChange}
          />
          <label>Price:</label>
          <input
            type="number"
            name="Product_Price"
            value={product.Product_Price}
            onChange={handleChange}
          />
          <label>Quantity:</label>
          <input
            type="number"
            name="Product_Quantity"
            value={product.Product_Quantity}
            onChange={handleChange}
          />
          <label>Expiry Date:</label>
          <input
            type="date"
            name="Product_ExpiryDate"
            value={product.Product_ExpiryDate}
            onChange={handleChange}
          />
          <label>Image URL:</label>
          <input
            type="text"
            name="Product_Image"
            value={product.Product_Image}
            onChange={handleChange}
          />

          <div className="modal-actions">
            <button className="save">Save</button>
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductAddModal;
