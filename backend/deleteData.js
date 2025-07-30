const express = require('express');

const {sql,poolPromise} = require('./db');

const { authenticateUser, authorizeRole } = require("./authMiddleware"); //Import the Authorization from authMiddleware.js

module.exports=function(app){

    
//--------------------------------DELETE CUSTOMER---------------------------------------

//deleting a customer by their name or id
//either the admin can delete the customer or the customer can delete his own account

app.delete("/api/deleteCustomer/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifier } = req.params; // ID or Name from URL
        const pool = await poolPromise;
        let result;

        const loggedInUserId = req.user.id; // Logged-in User's ID
        const loggedInUserRole = req.user.role; // Logged-in User's Role
        
        // Restrict customers to delete only their own account
        if (loggedInUserRole === 'customer') {
            if (isNaN(identifier)) {
                // Identifier is a name, check if it belongs to logged-in user
                const nameCheck = await pool.request()
                    .input("Customer_ID", sql.Int, loggedInUserId)
                    .query("SELECT Customer_Name FROM Customer WHERE Customer_ID = @Customer_ID");

                if (!nameCheck.recordset.length || nameCheck.recordset[0].Customer_Name !== identifier) {
                    return res.status(403).json({ success: false, message: 'You are not authorized to delete this customer.' });
                }
            } else if (parseInt(identifier) !== loggedInUserId) {
                return res.status(403).json({ success: false, message: 'You are not authorized to delete this customer.' });
            }
        }

       
        if (!isNaN(identifier)) {
            result = await pool.request()
                .input("Customer_ID", sql.Int, identifier)
                .query("DELETE FROM Customer WHERE Customer_ID = @Customer_ID");
        } else {
            result = await pool.request()
                .input("Customer_Name", sql.NVarChar, identifier)
                .query("DELETE FROM Customer WHERE Customer_Name = @Customer_Name");
        }

       
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: "Customer not found or already deleted" });
        }

        res.status(200).json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//----------------------------DELETE SUPPLIER---------------------------------

// the identifier can only be id

//only the admin has access

app.delete("/api/deleteSupplier/:identifier", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { identifier } = req.params; // ID or Name from URL

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier",
            });
        }

        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) { // delete by id
            result = await pool.request()
                .input("Supplier_ID", sql.Int, identifier)
                .query("DELETE FROM SupplierDetails WHERE Supplier_ID=@Supplier_ID");
        } 
       
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Supplier deleted successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }

});

//---------------------------------DELETE CATEGORY---------------------------------------

// The identifier can be id or name  , iff no products of category exist 
//only the admin has access

app.delete("/api/deleteCategory/:identifier", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { identifier } = req.params; // ID or Name from URL

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier",
            });
        }

        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) { // If it's a number, delete by ID
            result = await pool.request()
                .input("Category_ID", sql.Int, identifier)
                .query("DELETE FROM Category WHERE Category_ID=@Category_ID");
        } 
        else { // If it's a string, delete by Category_Name
            result = await pool.request()
                .input("Category_Name", sql.NVarChar, identifier)
                .query("DELETE FROM Category WHERE Category_Name=@Category_Name");
        }

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//-----------------------------DELETE PRODUCT------------------------------------

//The identifier can be id  or name
//only the admin has access

app.delete("/api/deleteProduct/:identifier",authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
        const { identifier } = req.params; // ID or Name from URL

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier",
            });
        }

        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) { // If it's a number, delete by ID
            result = await pool.request()
                .input("Product_ID", sql.Int, identifier)
                .query("DELETE FROM ProductDetail WHERE Product_ID=@Product_ID");
        } 
        else { // If it's a string, delete by Product_Name
            result = await pool.request()
                .input("Product_Name", sql.NVarChar, identifier)
                .query("DELETE FROM ProductDetail WHERE Product_Name=@Product_Name");
        }

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//-----------------------------------DELETE CART------------------------------------------------------

//Delete from cart by id of customer and product 
//only the customer can delete something from their cart and the admin can

app.delete("/api/deleteCart/:customerId/:productId", authenticateUser,authorizeRole("customer","admin") ,async (req, res) => {
    try {
        const { customerId, productId } = req.params; // Extract Customer ID and Product ID from URL
        const loggedInUserId = req.user.id;  // ID of the logged-in user

        if (!customerId || !productId || isNaN(customerId) || isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Customer ID or Product ID",
            });
        }

        //The logged in customer can only remove items from his own cart
       
        if (parseInt(customerId) !== loggedInUserId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete items from your own cart",
            });
        }

        const pool = await poolPromise;

        
        const result = await pool.request()
            .input("Customer_ID", sql.Int, customerId)
            .input("Product_ID", sql.Int, productId)
            .query("DELETE FROM Cart WHERE Customer_ID=@Customer_ID AND Product_ID=@Product_ID");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart item deleted successfully",
            rowsAffected: result.rowsAffected,
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//--------------------------------DELETE ORDER------------------------------------------------


//Delete(UPDATE ORDERSTATUS) from ORDER by id of Customer and Order given that its status is pending 

//only the admin can delete the order since its part of the transaction history now

app.put("/api/deleteOrder/:orderId/:customerId",authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
        const { orderId, customerId } = req.params; // Extract Order ID and Customer ID

        if (!orderId || !customerId || isNaN(orderId) || isNaN(customerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID or Customer ID",
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("Order_ID", sql.Int, orderId)
            .input("Customer_ID", sql.Int, customerId)
            .query(`
                UPDATE Orders 
                SET OrderStatus='D'
                WHERE Order_ID = @Order_ID 
                AND Customer_ID = @Customer_ID 
                AND OrderStatus = 'P'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or not in pending status",
            });
        }

        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//------------------------------DELETE ORDER DETAILS------------------------------------------

//delete by orderID

//only the admin can delete the order details 

app.delete("/api/deleteOrderDetails/:orderId", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { orderId } = req.params; // Extract Order ID

        if (!orderId || isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID",
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("Orders_ID", sql.Int, orderId)
            .query("DELETE FROM OrderDetails WHERE Orders_ID=@Orders_ID");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "No order details found for the given Order ID",
            });
        }

        res.status(200).json({
            success: true,
            message: "Order details deleted successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//--------------------------------DELETE PAYMENT--------------------------------------------------------

//Deleting from  Payments as an update option, updating Payment Status to F

//only the admin can delete the payment

app.put("/api/deletePayment/:paymentId", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { paymentId } = req.params; // Extract Payment ID

        if (!paymentId || isNaN(paymentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Payment ID",
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("Payments_ID", sql.Int, paymentId)
            .query(`
                UPDATE Payments SET PaymentStatus = 'F' 
                WHERE Payments_ID = @Payments_ID
                AND PaymentStatus ='P' 
                `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "No pending payment found with the given Payment ID ",
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment Rolled back|| 'F' (Failed) successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//--------------------------------DELETE DELIVERY DETAILS------------------------------------------------

//deleting from delivery details too as an update operation , changing the status of the delievery to cancelled
//only the admin can delete the delivery details

app.put("/api/deleteDelivery/:orderId", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { orderId } = req.params; // Extract Order ID

        if (!orderId || isNaN(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID",
            });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("Order_ID", sql.Int, orderId)
            .query(`
                UPDATE DeliveryDetails 
                SET Delivery_Status = 'Delivery Canceled' 
                WHERE Order_ID = @Order_ID
                AND
                Delivery_Status!='Order Delivered'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "No delivery found for the given Order ID",
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery marked as 'Delivery Canceled' successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//---------------------------------DELETE WISHLIST---------------------------------------

//Deleting from Wishlist given customer id and Product id 
//the customer can delete his wishlist and the admin can delete his wishlist

app.delete("/api/deleteWishlist/:customerId/:productId", authenticateUser, authorizeRole("customer","admin"),async (req, res) => {
    try {
        const { customerId, productId } = req.params; // Extract Customer ID and Product ID
        const loggedInUserId = req.user.id; // Get logged-in user's customer ID

       
        if (!customerId || !productId || isNaN(customerId) || isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Customer ID or Product ID",
            });
        }

         //The logged in customer can only delete his wishlist
       
        if (parseInt(customerId) !== loggedInUserId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this item from another user's wishlist",
            });
        }

        const pool = await poolPromise;

       
        const result = await pool.request()
            .input("Customer_ID", sql.Int, customerId)
            .input("Product_ID", sql.Int, productId)
            .query("DELETE FROM Wishlist WHERE Customer_ID = @Customer_ID AND Product_ID = @Product_ID");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Wishlist item not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Wishlist item deleted successfully",
            rowsAffected: result.rowsAffected,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

//------------------------------------DELETE REVIEWS---------------------------------------------

//Deleting from Reviews based on reviews_id

//admin can delete a review and customer can delete their own review

app.delete("/api/deleteReview/:reviewId", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { reviewId } = req.params;
        const loggedInUserId = req.user.id;

        if (!reviewId || isNaN(reviewId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Review ID",
            });
        }

        const pool = await poolPromise;

        //Check if the review exists
        const result = await pool.request()
            .input("Reviews_ID", sql.Int, reviewId)
            .query("SELECT * FROM Reviews WHERE Reviews_ID = @Reviews_ID");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        const review = result.recordset[0];

        //  Check if the user is authorized
        if (review.Customer_ID !== loggedInUserId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this review",
            });
        }

        //  Delete the review
        const deleteResult = await pool.request()
            .input("Reviews_ID", sql.Int, reviewId)
            .query("DELETE FROM Reviews WHERE Reviews_ID = @Reviews_ID");

        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(500).json({
                success: false,
                message: "Review could not be deleted",
            });
        }

        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
}
