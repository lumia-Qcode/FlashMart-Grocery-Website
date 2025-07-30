import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Wishlist.module.css"; // Import CSS Module
import { useNavigate } from "react-router-dom";

const WishlistCustomer = () => {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const customerId = decodedToken.id;

        const wishlistRes = await axios.get(
          `http://localhost:5000/api/getWishlist/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const wishlistItems = wishlistRes.data;

        const productDetails = await Promise.all(
          wishlistItems.map(async (item) => {
            try {
              const res = await axios.get(
                `http://localhost:5000/api/getProduct/${item.Product_ID}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              return res.data;
            } catch (err) {
              console.error(`Error fetching product ${item.Product_ID}:`, err);
              return null;
            }
          })
        );

        setWishlistProducts(productDetails.filter(p => p !== null));
      } catch (err) {
        console.error("Error fetching wishlist:", err);
        setError("Wishlist is empty.");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate]);

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const customerId = decodedToken.id;

      const addToCartRes = await axios.post(
        "http://localhost:5000/api/addToCart",
        {
          Customer_ID: parseInt(customerId), // Always use decoded ID
          Product_ID: parseInt(productId),
          Quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (addToCartRes.data.success) {
        // Remove from wishlist
        await axios.delete(
          `http://localhost:5000/api/deleteWishlist/${customerId}/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setWishlistProducts((prev) =>
          prev.filter((product) => product.Product_ID !== productId)
        );
        alert("Product moved to cart!");
      } else {
        alert("Failed to add to cart.");
      }
    } catch (err) {
      console.error("Error while adding to cart:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    const token = localStorage.getItem("token");
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const customerId = decodedToken.id;

    try {
      await axios.delete(
        `http://localhost:5000/api/deleteWishlist/${customerId}/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Remove the item from UI
      setWishlistProducts((prev) => prev.filter((p) => p.Product_ID !== productId));
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
      alert("Failed to remove product from wishlist.");
    }
  };

  if (loading) return <p>Loading your wishlist...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles["wishlist-container"]}>
      <h2>Your Wishlist</h2>
      <div className={styles["product-cards"]}>
        {wishlistProducts.length > 0 ? (
          wishlistProducts.map((product) => (
            <div key={product.Product_ID} className={styles["product-card"]}>
              <img
                src={`./images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`}
                alt={product.Product_Name}
                className={styles["product-image"]}
                onError={(e) => (e.target.src = "/images/default.jpeg")}
              />
              <h3>{product.Product_Name}</h3>
              <p>Price: Rs. {product.Product_Price}</p>
              <div className={styles["wishlist-buttons"]}>
                <button onClick={() => handleAddToCart(product.Product_ID)}>
                  Add to Cart
                </button>
                <button
                  className={styles["remove-button"]}
                  onClick={() => handleRemoveFromWishlist(product.Product_ID)}
                >
                  Remove from Wishlist
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>Your wishlist is currently empty.</p>
        )}
      </div>

 
    </div>
  );
};

export default WishlistCustomer;
