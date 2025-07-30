import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./viewcategories.css";

// Modal Components
import CategoryEditModal from "./editCategory";
import CategoryAddModal from "./addCategory";

const ViewCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/api/category", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setCategories(response.data.orderDetailsData);
        setLoading(false);
      })
      .catch((error) => {
        setError("Error fetching categories.");
        setLoading(false);
      });
  };

  const handleDeleteCategory = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this category?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    axios
      .delete(`http://localhost:5000/api/deleteCategory/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.data.success) {
          setCategories((prev) => prev.filter((category) => category.Category_ID !== id));
          alert("Category deleted successfully!");
        } else {
          alert("Failed to delete category.");
        }
      })
      .catch((error) => {
        console.error("Error deleting category:", error);
        alert("Server error: " + (error.response?.data?.error || error.message));
      });
  };

  const handleUpdateCategory = (category) => {
    setCategoryToEdit(category);
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (updatedCategory) => {
    const token = localStorage.getItem("token");

    axios
      .put(`http://localhost:5000/api/updateCategory/${updatedCategory.Category_ID}`, updatedCategory, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.data.success) {
          setCategories((prev) =>
            prev.map((category) =>
              category.Category_ID === updatedCategory.Category_ID ? updatedCategory : category
            )
          );
          setShowEditModal(false);
          alert("Category updated successfully!");
        } else {
          alert("Update failed: " + response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error updating category:", error);
        alert("Server error: " + (error.response?.data?.error || error.message));
      });
  };

  const handleAddCategory = () => {
    setShowAddModal(true);
  };

  const handleAddSubmit = () => {
    fetchCategories();  // Refetch categories after adding a new one
  };

  return (
    <div className="customers-container">
      <h2 className="customers-heading">All Categories</h2>
      <button onClick={handleAddCategory} className="add-category">
        Add Category
      </button>

      {loading ? (
        <p>Loading categories...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className="customers-table">
          <thead>
            <tr>
              <th>Category ID</th>
              <th>Supplier ID</th>
              <th>Category Name</th>
              <th>Category Description</th>
              <th>Category Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.Category_ID}>
                <td>{category.Category_ID}</td>
                <td>{category.Supplier_ID}</td>
                <td>{category.Category_Name}</td>
                <td>{category.Category_Description}</td>
                <td>
                  <img
                    src={`/images/${category.Category_Name.replace(/\s+/g, '')}.jpeg`}
                    alt={category.Category_Name}
                    style={{ width: "60px", height: "60px", objectFit: "cover" }}
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleUpdateCategory(category)}
                    className="update-category"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.Category_ID)}
                    className="delete-category"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Update Category Modal */}
      {showEditModal && (
        <CategoryEditModal
          category={categoryToEdit}
          onChange={setCategoryToEdit}
          onClose={() => setShowEditModal(false)}
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateSubmit(categoryToEdit);  // Pass the updated category
          }}
        />
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <CategoryAddModal
          onClose={() => setShowAddModal(false)}
          onAddCategory={handleAddSubmit}
        />
      )}
    </div>
  );
};

export default ViewCategories;
