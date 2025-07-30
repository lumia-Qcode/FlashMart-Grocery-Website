const express = require('express');

const bcrypt = require("bcrypt"); //Import Bcrypt

const {sql,poolPromise} = require('./db');
const jwt = require("jsonwebtoken");

const { authenticateUser, authorizeRole } = require("./authMiddleware.js"); //Import the Authorization from authMiddleware.js

module.exports=function(app)
{
//------------------------- INSERT INTO CUSTOMER ------------------------------

//Anyone can register themselves as customer

app.post("/api/insertCustomer", async (req, res) => {
    try {
        const { Customer_Name, Customer_Email, Customer_PhoneNo, Customer_Address, Customer_Password } = req.body;

        // Validate inputs
        if (!Customer_Name || !Customer_Email || !Customer_PhoneNo || !Customer_Address || !Customer_Password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;

        // Check if the email already exists
        const emailCheckResult = await pool.request()
            .input("Customer_Email", sql.NVarChar, Customer_Email)
            .query("SELECT COUNT(*) as emailCount FROM Customer WHERE Customer_Email = @Customer_Email");

        if (emailCheckResult.recordset[0].emailCount > 0) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(Customer_Password, 10); // Hash the password

        // Insert new customer into the database
        const result = await pool.request()
            .input("Customer_Name", sql.NVarChar, Customer_Name)
            .input("Customer_Email", sql.NVarChar, Customer_Email)
            .input("Customer_PhoneNo", sql.NVarChar, Customer_PhoneNo)
            .input("Customer_Address", sql.NVarChar, Customer_Address)
            .input("Customer_Password", sql.NVarChar, hashedPassword)
            .query("INSERT INTO Customer (Customer_Name, Customer_Email, Customer_PhoneNo, Customer_Address, Customer_Password) VALUES (@Customer_Name, @Customer_Email, @Customer_PhoneNo, @Customer_Address, @Customer_Password)");

        // Check if rows were affected, indicating successful insertion
        if (result.rowsAffected > 0) {
            res.status(201).json({ success: true, message: "Customer registered successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to register customer" });
        }
    } catch (error) {
        console.error("Registration Error:", error.message);
        console.error("Stack Trace:", error.stack);
        res.status(500).json({ success: false, message: "Server error. Please try again." });
    }
});


//api to for the forget password functionality

app.post("/api/forgetPasswordVerify", async (req, res) => {
    try {
        const { Customer_Name, Customer_Email, Customer_PhoneNo } = req.body;

        if (!Customer_Name || !Customer_Email || !Customer_PhoneNo) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input("Customer_Name", sql.NVarChar, Customer_Name)
            .input("Customer_Email", sql.NVarChar, Customer_Email)
            .input("Customer_PhoneNo", sql.NVarChar, Customer_PhoneNo)
            .query(`
                SELECT Customer_ID 
                FROM Customer 
                WHERE Customer_Name = @Customer_Name 
                  AND Customer_Email = @Customer_Email 
                  AND Customer_PhoneNo = @Customer_PhoneNo
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found or info doesn't match" });
        }

        res.status(200).json({ success: true, customerId: result.recordset[0].Customer_ID });
    } catch (err) {
        console.error("Error verifying customer for password reset:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


//---------------------------INSERT INTO ADMIN--------------------------------

// Route: POST /api/forgetAdminPasswordVerify
app.post("/api/forgetAdminPasswordVerify", async (req, res) => {
    try {
        const { Admin_Name, Admin_Email, Admin_PhoneNo} = req.body; 

        // Check if required fields are provided
        if (!Admin_Email || !Admin_Name || !Admin_PhoneNo) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;
        console.log("Received body:", req.body);
        
        
        let result;
            // Verify admin information
        result = await pool.request()
                .input("Admin_Name", sql.NVarChar, Admin_Name)
                .input("Admin_Email", sql.NVarChar, Admin_Email)
                .input("Admin_PhoneNo", sql.NVarChar, Admin_PhoneNo)
                .query(`
                    SELECT Admin_ID 
                    FROM Admin 
                    WHERE Admin_Name = @Admin_Name 
                    AND Admin_Email = @Admin_Email 
                    AND Admin_PhoneNo = @Admin_PhoneNo
                `);
                console.log("Query result:", result.recordset);
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Information does not match any records" });
        }

        console.log(result.recordset[0].Admin_ID);
        // Return the respective ID of the found entity ( Admin)
        res.status(200).json({ success: true, adminId: result.recordset[0].Admin_ID });

    } catch (err) {
        console.error("Error verifying user for password reset:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// -----------------------------INSERT INTO SUPPLIER -----------------------------------------

//ONLY THE ADMIN HAS ACCESS

app.post("/api/insertSupplier",authenticateUser,authorizeRole("admin"), async (req, res) => {
    try {
        const { Supplier_Name, Supplier_PhoneNo, Supplier_Address } = req.body;

        if (!Supplier_Name || !Supplier_PhoneNo || !Supplier_Address) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;
        await pool.request()
            .input("Supplier_Name", sql.NVarChar, Supplier_Name)
            .input("Supplier_PhoneNo", sql.NVarChar, Supplier_PhoneNo)
            .input("Supplier_Address", sql.NVarChar, Supplier_Address)
            .query(" INSERT INTO SupplierDetails (Supplier_Name, Supplier_PhoneNo, Supplier_Address) VALUES (@Supplier_Name, @Supplier_PhoneNo, @Supplier_Address)");

        res.status(201).json({ success: true, message: "Supplier added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//-------------------------------INSERT INTO CATEGORY------------------------------------

//ONLY THE ADMIN HAS ACCESS

app.post("/api/insertCategory", authenticateUser,authorizeRole("admin"),async (req, res) => {
    try {
        const { Supplier_ID,Category_Name, Category_Description, Category_Image } = req.body;

        if (!Supplier_ID||!Category_Name || !Category_Description || !Category_Image) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;
        await pool.request()
            .input("Supplier_ID",sql.Int,Supplier_ID)
            .input("Category_Name", sql.NVarChar, Category_Name)
            .input("Category_Description", sql.NVarChar, Category_Description)
            .input("Category_Image", sql.NVarChar, Category_Image)
            .query("INSERT INTO Category (Supplier_ID,Category_Name, Category_Description, Category_Image)VALUES (@Supplier_ID,@Category_Name, @Category_Description, @Category_Image)");

        res.status(201).json({ success: true, message: "Category added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//---------------------------------INSERT INTO PRODUCT--------------------------------------

//ONLY THE ADMIN HAS ACCESS

app.post("/api/insertProduct", authenticateUser,authorizeRole("admin"),async (req, res) => {
    try {
        const {Category_ID, Product_Name, Product_Price, Product_Quantity, Product_ExpiryDate, Product_Image } = req.body;

        if (!Category_ID || !Product_Name || !Product_Price || !Product_Quantity || !Product_ExpiryDate || !Product_Image) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;
        await pool.request()
            .input("Category_ID",sql.Int,Category_ID)
            .input("Product_Name", sql.NVarChar, Product_Name)
            .input("Product_Price", sql.Decimal, Product_Price)
            .input("Product_Quantity", sql.Int, Product_Quantity)
            .input("Product_ExpiryDate", sql.Date, Product_ExpiryDate)
            .input("Product_Image", sql.NVarChar, Product_Image)
            .query(`
                INSERT INTO ProductDetail (Category_ID,Product_Name, Product_Price, Product_Quantity, Product_ExpiryDate, Product_Image)
                VALUES (@Category_ID,@Product_Name, @Product_Price, @Product_Quantity, @Product_ExpiryDate, @Product_Image)
            `);

        res.status(201).json({ success: true, message: "Product added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//-------------------------------------INSERT INTO ORDER-------------------------------------------

//THE ADMIN CAN PLACE ORDER IN CASE OF SOME ISSUE FOR THE CUSTOMER AND CUSTOMER CAN ONLY PLACE ORDER FOR THEMSELVES

app.post("/api/insertOrder", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { Customer_ID, OrderDate, OrderStatus, TotalPrice } = req.body;

        
        if (!Customer_ID || !OrderDate || !OrderStatus || !TotalPrice) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const loggedInUserId = req.user.id; // ID of the logged-in user
        const loggedInUserRole = req.user.role; // Role of the logged-in user

        // If the logged-in user is a customer, they can only place an order for themselves
        if (loggedInUserRole === "customer" && loggedInUserId !== Customer_ID) {
            return res.status(403).json({ success: false, message: "You can only place orders for yourself." });
        }

        const pool = await poolPromise;

        await pool.request()
            .input("Customer_ID", sql.Int, Customer_ID)
            .input("OrderDate", sql.NVarChar, OrderDate)
            .input("OrderStatus", sql.Char, OrderStatus)
            .input("TotalPrice", sql.Decimal, TotalPrice)
            .query("INSERT INTO Orders (Customer_ID, OrderDate, OrderStatus, TotalPrice)VALUES (@Customer_ID, @OrderDate, @OrderStatus, @TotalPrice)");

        res.status(201).json({ success: true, message: "Order added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//-----------------------------INSERT INTO DELIVERY-------------------------------------

//EITHER THE SYSTEM WILL DO IT ITSELF OR THE ADMIN WILL DO IT

app.post("/api/insertDelivery",authorizeRole("admin"), async (req, res) => {
    try {
        const { Order_ID,Delivery_Status, Estimated_Delivery } = req.body;

        if (!Order_ID || !Delivery_Status || !Estimated_Delivery) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;
        await pool.request()
            .input("Order_ID",sql.Int,Order_ID)
            .input("Delivery_Status", sql.NVarChar, Delivery_Status)
            .input("Estimated_Delivery", sql.Time, Estimated_Delivery)
            .query("INSERT INTO DeliveryDetails (Order_ID,Delivery_Status, Estimated_Delivery) VALUES (@Order_ID,@Delivery_Status, @Estimated_Delivery)");

        res.status(201).json({ success: true, message: "Delivery record added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//--------------------------------INSERT INTO REVIEW------------------------------------------

//ONLY THE CUSTOMER CAN INSERT A REVIEW FOR HIMSELF

app.post("/api/insertReview", authenticateUser, authorizeRole("customer"), async (req, res) => {
    try {
        const { Customer_ID, Product_ID, Rating, Comment } = req.body;
        const ReviewDate = new Date(); // Automatically set current date

        if (Customer_ID == null || Product_ID == null || Rating == null) {
            return res.status(400).json({
                success: false,
                message: "Customer ID, Product ID, and Rating are required"
            });
        }
        

        if (req.user.id !== Customer_ID) {
            return res.status(403).json({ success: false, message: "You are not authorized to add a review for another customer" });
        }

        const pool = await poolPromise;
        await pool.request()
            .input("Customer_ID", sql.Int, Customer_ID)
            .input("Product_ID", sql.Int, Product_ID)
            .input("Rating", sql.Int, Rating)
            .input("Comment", sql.NVarChar, Comment || null)
            .input("ReviewDate", sql.DateTime, ReviewDate)
            .query("INSERT INTO Reviews (Customer_ID, Product_ID, Rating, Comment, ReviewDate) VALUES (@Customer_ID, @Product_ID, @Rating, @Comment, @ReviewDate)");

        res.status(201).json({ success: true, message: "Review added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//-------------------------------INSERT INTO WISHLIST------------------------------------

//ONLY THE CUSTOMER CAN ADD PRODUCTS INTO HIS WISHLIST

app.post("/api/insertWishlist", authenticateUser, authorizeRole("customer"), async (req, res) => {
    try {
        const { Customer_ID, Product_ID } = req.body;

        if (!Customer_ID || !Product_ID) {
            return res.status(400).json({ success: false, message: "Customer ID and Product ID are required" });
        }

        if (parseInt(req.user.id) !== parseInt(Customer_ID)) {
            return res.status(403).json({ success: false, message: "You are not authorized to add a product to another customer's wishlist" });
        }

        const pool = await poolPromise;

        // Check if product already exists in wishlist
        const check = await pool.request()
            .input("Customer_ID", sql.Int, Customer_ID)
            .input("Product_ID", sql.Int, Product_ID)
            .query("SELECT * FROM Wishlist WHERE Customer_ID = @Customer_ID AND Product_ID = @Product_ID");

        if (check.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Product already exists in wishlist" });
        }

        await pool.request()
            .input("Customer_ID", sql.Int, Customer_ID)
            .input("Product_ID", sql.Int, Product_ID)
            .query("INSERT INTO Wishlist (Customer_ID, Product_ID) VALUES (@Customer_ID, @Product_ID)");

        res.status(201).json({ success: true, message: "Item added to wishlist successfully" });

    } catch (error) {
        console.error("Wishlist Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});


//--------------------------------INSERT INTO CART----------------------------------

// ONLY THE CUSTOMER CAN ADD PRODUCTS INTO HIS OWN CART

app.post("/api/addToCart", authenticateUser, authorizeRole("customer"), async (req, res) => {
    try {
        const { Customer_ID, Product_ID, Quantity } = req.body;

        if (!Customer_ID || !Product_ID || !Quantity) {
            return res.status(400).json({ success: false, message: "Customer ID, Product ID, and Quantity are required" });
        }

        if (parseInt(req.user.id) !== parseInt(Customer_ID)) {
            return res.status(403).json({ success: false, message: "You are not authorized to modify another customer's cart" });
        }

        const pool = await poolPromise;

        // Check if product is already in the cart
        const check = await pool.request()
            .input("Customer_ID", sql.Int, Customer_ID)
            .input("Product_ID", sql.Int, Product_ID)
            .query("SELECT Quantity FROM Cart WHERE Customer_ID = @Customer_ID AND Product_ID = @Product_ID");

        if (check.recordset.length > 0) {
            // Product exists — update quantity
            const existingQty = check.recordset[0].Quantity;
            const newQty = existingQty + Quantity;

            await pool.request()
                .input("Customer_ID", sql.Int, Customer_ID)
                .input("Product_ID", sql.Int, Product_ID)
                .input("Quantity", sql.Int, newQty)
                .query(`
                    UPDATE Cart
                    SET Quantity = @Quantity
                    WHERE Customer_ID = @Customer_ID AND Product_ID = @Product_ID
                `);
        } else {
            // Insert new cart item
            await pool.request()
                .input("Customer_ID", sql.Int, Customer_ID)
                .input("Product_ID", sql.Int, Product_ID)
                .input("Quantity", sql.Int, Quantity)
                .query(`
                    INSERT INTO Cart (Customer_ID, Product_ID, Quantity)
                    VALUES (@Customer_ID, @Product_ID, @Quantity)
                `);
        }

        res.status(201).json({ success: true, message: "Product added to cart successfully" });

    } catch (error) {
        console.error("Cart Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});


//----------------------------------INSERT INTO PAYMENTS-------------------------------------

//either the customer themself will do it or the admin

app.post("/api/insertPayment", authenticateUser,authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { Order_ID, PaymentMethod, PaymentStatus, Transaction_ID } = req.body;

        if (!Order_ID || !PaymentMethod || !PaymentStatus) {
            return res.status(400).json({ success: false, message: "Order ID, Payment Method, and Payment Status are required" });
        }

        // Ensure that the customer is inserting the payment for their own order, or the admin can insert for any order
        //const customerId = req.user.id;  // Assuming `req.user.id` holds the customer ID from the token
        //if (req.user.role !== "admin" && req.user.id !== Order_ID) {
        //    return res.status(403).json({ success: false, message: "You are not authorized to insert payment for this order." });
        //}

        const pool = await poolPromise;
        await pool.request()
            .input("Order_ID", sql.Int, Order_ID)
            .input("PaymentMethod", sql.NVarChar, PaymentMethod)
            .input("PaymentStatus", sql.Char, PaymentStatus)
            .input("Transaction_ID", sql.NVarChar, Transaction_ID || null)  // Transaction_ID is optional
            .query("INSERT INTO Payments (Order_ID, PaymentMethod, PaymentStatus, Transaction_ID) VALUES (@Order_ID, @PaymentMethod, @PaymentStatus, @Transaction_ID)");

        res.status(201).json({ success: true, message: "Payment record added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//---------------------------------INSERT INTO ORDER DETAILS----------------------------------------------

//EITHER THE ADMIN WILL DO IT OR THE SYSTEM WILL DO IT ITSELF 

app.post("/api/insertOrderDetails", authorizeRole("admin"),async (req, res) => {
    try {
        const { Orders_ID, Product_ID, OrderDetails_Quantity, OrderDetails_Price } = req.body;

        if (!Orders_ID || !Product_ID || !OrderDetails_Quantity || !OrderDetails_Price) {
            return res.status(400).json({ 
                success: false, 
                message: "Orders ID, Product ID, Quantity, and Price are required" 
            });
        }

        const pool = await poolPromise;
        await pool.request()
            .input("Orders_ID", sql.Int, Orders_ID)
            .input("Product_ID", sql.Int, Product_ID)
            .input("OrderDetails_Quantity", sql.Int, OrderDetails_Quantity)
            .input("OrderDetails_Price", sql.Decimal(10, 2), OrderDetails_Price)
            .query("INSERT INTO OrderDetails (Orders_ID, Product_ID, OrderDetails_Quantity, OrderDetails_Price)VALUES (@Orders_ID, @Product_ID, @OrderDetails_Quantity, @OrderDetails_Price)");

        res.status(201).json({ success: true, message: "Order details added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
};