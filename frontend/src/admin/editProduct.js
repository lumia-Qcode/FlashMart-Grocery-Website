import React from "react";
import "./productsView.css"; 

const ProductEditModal = ({ product, onChange, onClose, onSubmit }) => {
  if (!product) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit Product</h3>
        <form onSubmit={onSubmit}>
          <label>Name:</label>
          <input
            type="text"
            value={product.Product_Name}
            onChange={(e) =>
              onChange({ ...product, Product_Name: e.target.value })
            }
          />
          <label>Price:</label>
          <input
            type="number"
            value={product.Product_Price}
            onChange={(e) =>
              onChange({ ...product, Product_Price: e.target.value })
            }
          />
          <label>Quantity:</label>
          <input
            type="number"
            value={product.Product_Quantity}
            onChange={(e) =>
              onChange({ ...product, Product_Quantity: e.target.value })
            }
          />

          <div className="modal-actions">
            <button className="save">Save</button>
            <button className="cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditModal;
