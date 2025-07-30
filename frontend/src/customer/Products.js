import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Products.module.css'; // Use CSS Module import

const ViewProducts = () => {
  const [viewType, setViewType] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [cartQuantities, setCartQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState(''); // Added state for search query

  const customerID = localStorage.getItem('customerId');

  const fetchData = async (option) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = option === 'categorySupplier'
        ? await axios.get('http://localhost:5000/api/productView', config)
        : await axios.get('http://localhost:5000/api/productDetail', config);

      if (response?.data?.sucess) {
        setProducts(response.data.customerData || response.data.orderDetailsData || []);
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    }
  };

  useEffect(() => {
    if (viewType) fetchData(viewType);
  }, [viewType]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const handleAddToWishlist = async (productID) => {
    try {
      await axios.post(
        'http://localhost:5000/api/insertWishlist',
        {
          Customer_ID: parseInt(customerID),
          Product_ID: parseInt(productID),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('Added to wishlist');
    } catch (err) {
      console.error(err);
      alert('Item already in wishlist');
    }
  };
  

  const handleAddToCart = async (productID) => {
    const quantity = cartQuantities[productID] || 1;
    try {
      await axios.post('http://localhost:5000/api/addToCart', {
        Customer_ID: parseInt(customerID),
        Product_ID: parseInt(productID),
        Quantity: quantity,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert('Added to cart');
    } catch (err) {
      console.error(err);
      alert('Failed to add to cart');
    }
  };

  const handleQuantityChange = (productID, delta) => {
    setCartQuantities((prev) => ({
      ...prev,
      [productID]: Math.max(1, (prev[productID] || 1) + delta),
    }));
  };

  // Filter products based on the search query
  const filteredProducts = products.filter((product) =>
    product.Product_Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.viewProductsContainer}>
      <h1 className={styles.viewProductsTitle}>View Products</h1>

      <div className={styles.viewOptions}>
        {[ 
          { label: 'Product View with Category & Supplier', value: 'categorySupplier' },
          { label: 'All Products', value: 'all' }
        ].map((option) => (
          <label key={option.value} className={styles.viewOption}>
            <input
              type="radio"
              name="productView"
              value={option.value}
              checked={viewType === option.value}
              onChange={(e) => setViewType(e.target.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {viewType === 'all' && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by product name"
            className={styles.searchBar}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {viewType === 'all' && filteredProducts.length > 0 ? (
        <div className={styles.cardProductView}>
          {filteredProducts.map((product, index) => (
            <div key={index} className={styles.productCard}>
              <img
                src={`./images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`}
                alt={product.Product_Name}
                className={styles.productImage}
                onError={(e) => e.target.src = '/images/default.jpeg'}
              />
              <div className={styles.productDetails}>
                <h3>{product.Product_Name}</h3>
                <p><strong>Price:</strong> Rs. {product.Product_Price}</p>
                {product.Description && <p><strong>Description:</strong> {product.Description}</p>}
                {product.Product_ExpiryDate && <p><strong>Expiry:</strong> {formatDate(product.Product_ExpiryDate)}</p>}
                <div className={styles.productActions}>
                  <div className={styles.quantitySelector}>
                    <button onClick={() => handleQuantityChange(product.Product_ID, -1)}>-</button>
                    <span>{cartQuantities[product.Product_ID] || 1}</span>
                    <button onClick={() => handleQuantityChange(product.Product_ID, 1)}>+</button>
                  </div>
                  <button className={styles.cartBtn} onClick={() => handleAddToCart(product.Product_ID)}>
                    Add to Cart
                  </button>
                  <button className={styles.cartBtn} onClick={() => handleAddToWishlist(product.Product_ID)}>
               Add to Wishlist
            </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewType === 'all' && filteredProducts.length === 0 ? (
        <p className={styles.noProducts}>No products found for this search.</p>
      ) : viewType === 'categorySupplier' && products.length > 0 ? (
        <div className={styles.tableContainer}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                {Object.keys(products[0]).map((key) => (
                  !key.toLowerCase().includes('id') && key !== 'Actions' && (
                    <th key={key}>{key.replace(/_/g, ' ')}</th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  {Object.entries(product)
                    .filter(([key]) => !key.toLowerCase().includes('id') && key !== 'Actions')
                    .map(([key, value], i) => (
                      <td key={i}>
                        {key.toLowerCase().includes('image') ? (
                          <img
                            src={`./images/${product.Product_Name.replace(/\s+/g, '')}.jpeg`}
                            alt={product.Product_Name}
                            className={styles.productImage}
                            onError={(e) => e.target.src = '/images/default.jpeg'}
                          />
                        ) : key.toLowerCase().includes('price') ? (
                          `Rs. ${value}`
                        ) : key.toLowerCase().includes('expiry') && value ? (
                          formatDate(value)
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewType && (
        <p className={styles.noProducts}>No products to display for this view.</p>
      )}
    </div>
  );
};

export default ViewProducts;
