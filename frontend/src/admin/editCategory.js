import React from "react";
import "./productsView.css"; // Import your modal styling

const CategoryEditModal = ({ category, onChange, onClose, onSubmit }) => {
  if (!category) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit Category</h3>
        <form onSubmit={onSubmit}>
          <label>Category Name:</label>
          <input
            type="text"
            value={category.Category_Name}
            onChange={(e) =>
              onChange({ ...category, Category_Name: e.target.value })
            }
          />

          <label>Category Description:</label>
          <textarea
            value={category.Category_Description}
            onChange={(e) =>
              onChange({ ...category, Category_Description: e.target.value })
            }
          />

          <label>Category Image URL:</label>
          <input
            type="text"
            value={category.Category_Image}
            onChange={(e) =>
              onChange({ ...category, Category_Image: e.target.value })
            }
          />

          <div className="modal-actions">
            <button className="save" type="submit">Save</button>
            <button
              type="button"
              className="cancel"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryEditModal;
