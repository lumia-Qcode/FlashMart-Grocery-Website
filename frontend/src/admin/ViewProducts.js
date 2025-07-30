import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import ProductEditModal from "./editProduct";
import ProductAddModal from "./addProduct";

import './productsView.css'; // Import the CSS

const ProductsView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false); 

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token"); // Get token from localStorage

        axios
            .get("http://localhost:5000/api/productDetail", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                setProducts(response.data.orderDetailsData);
                setLoading(false);
            })
            .catch((error) => {
                setError("Error fetching products.");
                setLoading(false);
            });
    }, []);


    const handleUpdateProduct = (productIdorName) => {
        setProductToEdit(productIdorName);
        setShowModal(true);
    };

    //to update accordingly 
    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
       // Clone and sanitize product data
    // Sanitize before sending, do not update product image 
    const {Product_Image,...safeData } = productToEdit;
        axios
            .put(
                `http://localhost:5000/api/updateProductDetail/${productToEdit.Product_ID}`,
                safeData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((response) => {
                if (response.data.success) {
                    // Update product locally
                    setProducts((prev) =>
                        prev.map((prod) =>
                            prod.Product_ID === productToEdit.Product_ID ? productToEdit : prod
                        )
                    );
                    setShowModal(false); // Close modal
                    alert("Updated Successfully! ");
                } else {
                    alert("Update failed: " + response.data.message);
                }
            })
            .catch((error) => {
                console.error("Error updating product:", error);
                alert("Server error: " + (error.response?.data?.error || error.message));
            });
    };
    


    const handleAddProduct = () => {
        setShowAddModal(true); // Show the modal for adding a product
    };

    const handleAddProductSubmit = (newProduct) => {
        const token = localStorage.getItem("token");

        axios
            .post("http://localhost:5000//api/insertProduct", newProduct, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.data.success) {
                    setProducts((prev) => [...prev, newProduct]);
                    setShowAddModal(false); // Close modal after adding the product
                } else {
                    alert("Product addition failed: " + response.data.message);
                }
            })
            .catch((error) => {
                console.error("Error adding product:", error);
                alert("Server error: " + (error.response?.data?.error || error.message));
            });
    };

    const handleDeleteProduct = (productIdorName) => {
        const token = localStorage.getItem("token");

        axios
            .delete(`http://localhost:5000/api/deleteProduct/${productIdorName}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.data.success) {
                    // If deletion is successful, update the product list
                    setProducts(products.filter((product) => {
                        return product.Product_ID !== productIdorName && product.Product_Name !== productIdorName;
                    }));
                } else {
                    setError("Product deletion failed. Please try again.");
                }
            })
            .catch((error) => {
                setError("Error deleting the product.");
            });
    };


    // Function to format date without time
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
    };


    return (
        <div className="products-container">
            {/* Content Header with Add New Product Button */}
            <div className="content-header">
                <h2>All Products</h2>
                <button
        onClick={handleAddProduct}
        className="add-product" >
        Add Product
      </button>
            </div>

            {/* Product List Table */}
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Category ID</th>
                            <th>Product Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Expiry Date</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.Product_ID}>
                                <td>{product.Product_ID}</td>
                                <td>{product.Category_ID}</td>
                                <td>{product.Product_Name}</td>
                                <td>{product.Product_Price}</td>
                                <td>{product.Product_Quantity}</td>
                                <td>{formatDate(product.Product_ExpiryDate)}</td>
                                <td>
                                <img
                               src={`/images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`}
                               alt={product.Product_Name}
                               width="50"
                               height="50"
                                />
                                </td>

                                <td>
                                    <button className="update-product" onClick={() => handleUpdateProduct(product)}>Update</button>
                                    <button className="delete-product" onClick={() => handleDeleteProduct(product.Product_ID)}>Delete</button>
                                </td>



                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {showModal && (
                <ProductEditModal
                    product={productToEdit}
                    onChange={setProductToEdit}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleUpdateSubmit}
                />
            )}

             {showAddModal && (
                <ProductAddModal
                    onClose={() => setShowAddModal(false)}
                    onAddProduct={handleAddProduct}
                    onSubmit={handleAddProductSubmit}
                />
            )}
        </div>
    );
};


export default ProductsView;
