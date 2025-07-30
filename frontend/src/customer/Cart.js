import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Cart.css';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [total, setTotal] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);  // New state for payment success
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [transactionId, setTransactionId] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);


  const CouponModal = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm text-center">
          <h2 className="text-xl font-semibold mb-3 text-yellow-600">🎉 Congratulations!</h2>
          <p className="text-gray-700 mb-4">You've been awarded a coupon for your order over Rs 10,000 on your next order!</p>
          <button
            onClick={onClose}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition"
          >
            Got it
          </button>
        </div>
      </div>
    );
  };
  


  let largestOrderId = null;
  const customerId = localStorage.getItem("customerId");
  const token = localStorage.getItem("token");

  // Fetch cart data when component mounts or customerId/token change
  useEffect(() => {
    if (customerId && token) {
      fetchCartData(customerId, token);
    } else {
      alert("You need to login first.");
    }
  }, [customerId, token]);

  const orderId = localStorage.getItem("orderId");

  useEffect(() => {
    if (currentStep === 2 && customerId && token) {
      fetchCustomerData();
    }
  }, [currentStep]);

  useEffect(() => {
    if (cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) > 10000 && !couponApplied) {
      setShowCouponModal(true);
    }
  }, [cartItems, couponApplied]);
  
  

  const fetchCustomerData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/getCustomer/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomerData(res.data);
    } catch (err) {
      console.error("Error fetching customer info:", err);
    }
  };

  const handleApplyCoupon = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/getCoupon/customerid/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const coupon = response.data.data[0];
  
      if (coupon.HasCoupon == 'Yes') {
        // Apply discount logic here, e.g., 30% off
        const discount = total * 0.30;
        setTotal(total - discount);
        setCouponApplied(true);
  
        // Update coupon to mark it as used
        await axios.put(
          `http://localhost:5000/api/updateCoupon/${customerId}`,
          {
            Customer_ID: customerId,
            HasCoupon: 'No'
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );        
  
        alert('Coupon applied! You got a 30% discount.');
      } else {
        alert('YOU DO NOT HAVE A COUPON');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Failed to apply coupon. Please try again.');
    }
  };

  const fetchAndStoreLargestOrderId = async (customerId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/getOrder/customerid/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = response.data.data;  // Adjust this depending on your server response format
  
      if (orders && orders.length > 0) {
        const orderIds = orders.map(order => order.Order_ID);
        largestOrderId = Math.max(...orderIds);
        localStorage.setItem("orderId", largestOrderId);
      } else {
        throw new Error("No orders found for this customer.");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Error fetching your previous orders. Please try again later.");
    }
  };

  const decreaseProductStock = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/getProduct/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const product = response.data;
      

      const updatedProduct = {
        Product_Quantity: product.Product_Quantity - 1,
      };


      await axios.put(`http://localhost:5000/api/updateProductQuantity/${productId}`, updatedProduct, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Error decreasing product stock:', err.response?.data || err.message);
    }
  };

const increaseProductStock = async (productId) => {
  try {
    // Step 1: Fetch product data
    const response = await axios.get(`http://localhost:5000/api/getProduct/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const product = response.data;

    // Step 2: Prepare updated product with +1 stock
    const updatedProduct = {
      Product_Quantity: product.Product_Quantity + 1, // Increase stock
    };

    // Step 3: Send update request
    await axios.put(`http://localhost:5000/api/updateProductQuantity/${productId}`, updatedProduct, {
      headers: {
         Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Error increasing product stock:', err.response?.data || err.message);
  }
};

 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateCustomer = async () => {
    setIsUpdating(true);
    setUpdateMessage("");
    try {
      await axios.put(`http://localhost:5000/api/updateCustomer/${customerId}`, customerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpdateMessage("Customer details updated successfully.");
      setTimeout(() => nextStep(), 1000); // Auto-move to next step
    } catch (err) {
      console.error("Update failed:", err);
      setUpdateMessage("Failed to update customer.");
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchCartData = async (customerId, token) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/getCart/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const items = res.data;

      const updatedItems = await Promise.all(
        items.map(async (item) => {
          const prodRes = await axios.get(`http://localhost:5000/api/getProduct/${item.Product_ID}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          return {
            ...item,
            productName: prodRes.data.Product_Name,
            price: prodRes.data.Product_Price,
            quantity: item.Quantity || 1 // Default to 1 if not provided
          };
        })
      );

      setCartItems(updatedItems);
      calculateTotal(updatedItems);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setLoading(false);
    }
  };

  const cancelCartItem = async (customerId, productId) => {
    try {
      // Step 1: Fetch the product details to get the current stock
      const productResponse = await axios.get(`http://localhost:5000/api/getProduct/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const product = productResponse.data;
  
      // Step 2: Find the quantity of the product in the cart
      const cartItem = cartItems.find(item => item.Customer_ID === customerId && item.Product_ID === productId);
      const quantityInCart = cartItem ? cartItem.Quantity : 0;
  
      // Step 3: Update the stock based on the quantity in the cart
      const updatedProduct = {
        Product_Quantity: product.Product_Quantity + quantityInCart // Increase stock by the quantity in the cart
      };
  
      // Step 4: Send request to update product stock in the database
      await axios.put(`http://localhost:5000/api/updateProductQuantity/${productId}`, updatedProduct, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      // Step 5: Remove the canceled item from the cart
      const updatedItems = cartItems.filter(item =>
        !(item.Customer_ID === customerId && item.Product_ID === productId)
      );
  
      // Step 6: Delete the cart item from the database
      await axios.delete(`http://localhost:5000/api/deleteCart/${customerId}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      // Step 7: Update local state after removing item from cart
      setCartItems(updatedItems);
      calculateTotal(updatedItems);
      
    } catch (err) {
      alert("Error removing item from cart.");
      console.error(err);
    }
  };
  

  const handleCheckout = async () => {
    try {
      // Step 1: Insert the Order
      const orderPayload = {
        Customer_ID: parseInt(customerId),
        OrderDate: new Date().toISOString(),
        OrderStatus: 'P', // P for "Pending"
        TotalPrice: total
      };
  
      await axios.post("http://localhost:5000/api/insertOrder", orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      // Step 2: Fetch the largest Order ID to associate Delivery Details
      await fetchAndStoreLargestOrderId(customerId);
  
      if (!largestOrderId) {
        alert("Unable to fetch the largest order ID. Please try again later.");
        return;  // Abort the checkout process if no valid order ID is found
      }
  
      // Step 3: Handle Payment Insertion (Using POST)
      const paymentPayload = {
        Order_ID: largestOrderId, // Use the largest order ID for the payment record
        PaymentMethod: paymentMethod,
        PaymentStatus: 'S',  // S for "Success"
        Transaction_ID: paymentMethod === 'Online' ? transactionId : null
      };
  
      await axios.post("http://localhost:5000/api/insertPayment", paymentPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      // Step 4: Remove items from Cart
      await Promise.all(cartItems.map(item =>
        axios.delete(`http://localhost:5000/api/deleteCart/${customerId}/${item.Product_ID}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
  
      // Step 5: Show Success and Reset Cart
      alert("Order placed and payment recorded successfully!");
      setCartItems([]);
      setTotal(0);
      setPaymentSuccess(true); // Mark payment as successful
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout failed. Please try again.");
    }
  };
  
  const calculateTotal = (items) => {
    const totalPrice = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    setTotal(totalPrice);
  };


  const increaseQuantity = async (productId) => {
    try {
      // Step 1: Decrease product stock on backend
      await decreaseProductStock(productId);

      const updatedItems = cartItems.map(item =>
        item.Product_ID === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCartItems(updatedItems);
      calculateTotal(updatedItems);
    } catch (err) {
      console.error("Failed to increase quantity:", err.message);
    }
  };

  const decreaseQuantity = async (productId) => {
    try {
      // Step 1: Increase product stock on backend
      await increaseProductStock(productId);
  
      // Step 2: Update cart state
      const updatedItems = cartItems.map(item =>
        item.Product_ID === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => item.quantity > 0);
  
      // Step 3: Handle case when item reaches zero
      const removedItem = cartItems.find(item => item.Product_ID === productId && item.quantity === 1);
      if (removedItem) {
        cancelCartItem(removedItem.Customer_ID, removedItem.Product_ID);
      } else {
        setCartItems(updatedItems);
        calculateTotal(updatedItems);
      }
  
    } catch (err) {
      console.error("Failed to decrease quantity:", err.message);
    }
  };
  

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h2>Step 1: Confirm Your Order</h2>
            <div className="cart-items">
              {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.Product_ID} className="cart-item">
                    <div>
                      <strong>{item.productName}</strong> - Rs.{item.price} × {item.quantity} = Rs.{(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => decreaseQuantity(item.Product_ID)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => increaseQuantity(item.Product_ID)}>+</button>
                    </div>
                    <button
                      className="cancel-button"
                      onClick={() => cancelCartItem(item.Customer_ID, item.Product_ID)}
                    >
                      Cancel
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="total">Total: Rs.{total.toFixed(2)}</div>
  
            {/* New buttons */}
            <div className="extra-buttons">
  <button className="slim-button" onClick={() => window.location.href = "/wishlist"}>
    View Wishlist
  </button>
  <button className="slim-button" onClick={() => window.location.href = "/products"}>
    View Products
  </button>
</div>

          </>
        );
  

      case 2:
        return (
          <>
            <h2>Step 2: Confirm Delivery Address</h2>
            {customerData ? (
              <div className="address-form">
                <label>Name:
                  <input type="text" name="Customer_Name" value={customerData.Customer_Name} onChange={handleInputChange} />
                </label>
                <label>Email:
                  <input type="email" name="Customer_Email" value={customerData.Customer_Email} onChange={handleInputChange} />
                </label>
                <label>Phone:
                  <input type="text" name="Customer_PhoneNo" value={customerData.Customer_PhoneNo} onChange={handleInputChange} />
                </label>
                <label>Address:
                  <textarea name="Customer_Address" value={customerData.Customer_Address} onChange={handleInputChange} />
                </label>
                {updateMessage && <p>{updateMessage}</p>}
              </div>
            ) : (
              <p>Loading address details...</p>
            )}
          </>
        );

      case 3:
        return (
          <>
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="payment-option">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={handlePaymentMethodChange}
                />
                <label htmlFor="cod">Cash on Delivery (COD)</label>
              </div>
              <div className="payment-option">
                <input
                  type="radio"
                  id="online"
                  name="payment"
                  value="Online"
                  checked={paymentMethod === 'Online'}
                  onChange={handlePaymentMethodChange}
                />
                <label htmlFor="online">Online Payment</label>
              </div>

              {paymentMethod === 'Online' && (
                <div className="online-payment">
                  <label htmlFor="transaction-id">Transaction ID (if Online Payment):</label>
                  <input
                    type="text"
                    id="transaction-id"
                    name="transaction-id"
                    placeholder="Enter Transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <label htmlFor="amount">Amount Paid:</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    placeholder="Amount"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="order-summary">
              <h3>Order Summary:</h3>
              <ul>
                {cartItems.map((item) => (
                  <li key={item.Product_ID}>
                    {item.productName} - Rs.{item.price} × {item.quantity} = Rs.{(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
              {!couponApplied && (
                  <button onClick={handleApplyCoupon}>Apply Coupon</button>
            )}
            {showCouponModal && (
               <CouponModal onClose={() => setShowCouponModal(false)} />
            )}

              <div className="total">
                <strong>Total: Rs.{total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="next-buttons">
              <button onClick={() => window.location.href = '/dashboardcustomer'}>Continue Shopping</button>
              <button onClick={() => window.location.href = '/cart'}>View My Orders</button>
              <button onClick={handleCheckout}>Place Order</button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="cart-page">
      <h1>Your Shopping Cart</h1>
      {loading ? <p>Loading...</p> : renderStep()}
      <div className="step-buttons">
        {currentStep > 1 && <button onClick={prevStep}>Previous</button>}
        {currentStep === 2 && cartItems.length > 0 && (
          <button onClick={handleUpdateCustomer} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Save & Continue"}
          </button>
        )}
        {currentStep < 3 && currentStep !== 2 && cartItems.length > 0 && (
          <button onClick={nextStep}>Next</button>
        )}
      </div>
      <div className="footer">
        <p>Thank you for shopping with us!</p>
      </div>
      {/* Show this button only if payment was successful */}
      
    
    </div>
  );
};

export default CartPage;
