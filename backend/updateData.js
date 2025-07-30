const express = require('express');
const { sql, poolPromise } = require('./db');

const bcrypt = require("bcrypt"); //Import Bcrypt

const { authenticateUser, authorizeRole } = require("./authMiddleware"); //Import the Authorization from authMiddleware.js

module.exports = function (app) {
    
    //-------------------------------UPDATE THE CUSTOMER-----------------------------------


    // The identifier can be the name of the customer or the id of the customer
    //the customer can change his own details and the admin can edit the details of a customer

    app.put("/api/updateCustomer/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
        try {
            const { identifier } = req.params;
            const { Customer_Name, Customer_Email, Customer_PhoneNo, Customer_Address, Customer_Password } = req.body;
    
            if (!identifier || !Customer_Name || !Customer_Email || !Customer_PhoneNo || !Customer_Address || !Customer_Password) {
                return res.status(400).json({ success: false, message: "All fields are required" });
            }
    
            const loggedInUserId = req.user.id;  // Logged-in user ID
            const loggedInUserRole = req.user.role;  // Logged-in user role
    
            const pool = await poolPromise;
            let result;
    
            
            let customer;
            if (!isNaN(identifier)) { //by customer id
                
                customer = await pool.request()
                    .input("Customer_ID", sql.Int, identifier)
                    .query("SELECT Customer_ID, Customer_Name FROM Customer WHERE Customer_ID = @Customer_ID");
            } else { //by customer name
                
                customer = await pool.request()
                    .input("Customer_Name", sql.NVarChar, identifier)
                    .query("SELECT Customer_ID, Customer_Name FROM Customer WHERE Customer_Name = @Customer_Name");
            }
    
            if (!customer.recordset.length) {
                return res.status(404).json({ success: false, message: "Customer not found" });
            }
    
            const foundCustomer = customer.recordset[0];
    
            // Customers can only update their own details (whether by ID or Name)
            if (loggedInUserRole === 'customer' && foundCustomer.Customer_ID !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: "You can only update your own details"
                });
            }
    
        
    
            
            result = await pool.request()
                .input("Customer_ID", sql.Int, foundCustomer.Customer_ID)
                .input("Customer_Name", sql.NVarChar, Customer_Name)
                .input("Customer_Email", sql.NVarChar, Customer_Email)
                .input("Customer_PhoneNo", sql.NVarChar, Customer_PhoneNo)
                .input("Customer_Address", sql.NVarChar, Customer_Address)
                .input("Customer_Password", sql.NVarChar, Customer_Password)
                .query(`
                    UPDATE Customer 
                    SET Customer_Name=@Customer_Name, 
                        Customer_Email=@Customer_Email, 
                        Customer_PhoneNo=@Customer_PhoneNo, 
                        Customer_Address=@Customer_Address, 
                        Customer_Password=@Customer_Password 
                    WHERE Customer_ID=@Customer_ID
                `);
    
            res.status(200).json({
                success: true,
                message: "Customer updated successfully",
                rowsAffected: result.rowsAffected
            });
    
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });


    // The identifier can be the name of the customer or the id of the customer
    //the customer can change his own password and the admin can edit the password of a customer

    app.put("/api/updateCustomerPassword/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
        try {
            console.log("Request Body:", req.body);  // Log the incoming request body
            
            const { identifier } = req.params;
            const { Customer_Password } = req.body;
    
            if (!Customer_Password) {
                return res.status(400).json({ success: false, message: "Password is required" });
            }
    
            const loggedInUserId = req.user.id;  // Logged-in user ID
            const loggedInUserRole = req.user.role;  // Logged-in user role
    
            const pool = await poolPromise;
            let result;
    
            let customer;
            if (!isNaN(identifier)) { // by customer id
                customer = await pool.request()
                    .input("Customer_ID", sql.Int, identifier)
                    .query("SELECT Customer_ID, Customer_Name FROM Customer WHERE Customer_ID = @Customer_ID");
            } else { // by customer name
                customer = await pool.request()
                    .input("Customer_Name", sql.NVarChar, identifier)
                    .query("SELECT Customer_ID, Customer_Name FROM Customer WHERE Customer_Name = @Customer_Name");
            }
    
            if (!customer.recordset.length) {
                return res.status(404).json({ success: false, message: "Customer not found" });
            }
    
            const foundCustomer = customer.recordset[0];
    
            // Customers can only update their own details
            if (loggedInUserRole === 'customer' && foundCustomer.Customer_ID !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: "You can only update your own details"
                });
            }
    
            const hashedPassword = await bcrypt.hash(Customer_Password, 10);
    
            result = await pool.request()
                .input("Customer_ID", sql.Int, foundCustomer.Customer_ID)
                .input("Customer_Password", sql.NVarChar, hashedPassword)
                .query(`
                    UPDATE Customer 
                    SET Customer_Password=@Customer_Password
                    WHERE Customer_ID=@Customer_ID
                `);
    
            res.status(200).json({
                success: true,
                message: "Customer password updated successfully",
                rowsAffected: result.rowsAffected
            });
    
        } catch (error) {
            console.error("Update error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    });


    //API to reset password in case of password forgot

    // Route: PUT /api/resetPassword/:id
app.put("/api/resetPassword/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {Customer_Password} = req.body;
        console.log("Body received:", req.body);


        if (!Customer_Password) {
            return res.status(400).json({ success: false, message: "New password is required" });
        }

        const hashedPassword = await bcrypt.hash(Customer_Password, 10);
        const pool = await poolPromise;

        const result = await pool.request()
            .input("Customer_ID", sql.Int, id)
            .input("Customer_Password", sql.NVarChar, hashedPassword)
            .query(`
                UPDATE Customer
                SET Customer_Password = @Customer_Password
                WHERE Customer_ID = @Customer_ID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

    

     //-------------------------------UPDATE THE ADMIN-----------------------------------


    // The identifier can be the name of the admi  or the id of the admin
    //the admin can change his own details and the admin can edit the details of another admin

    app.put("/api/updateAdmin/:identifier", authenticateUser, authorizeRole("admin"), async (req, res) => {
        try {
            const { identifier } = req.params;
            const { Admin_Name, Admin_Email, Admin_Password,Admin_PhoneNo } = req.body;
    
            if (!identifier || !Admin_Name || !Admin_Email || !Admin_Password || !Admin_PhoneNo) {
                return res.status(400).json({ success: false, message: "All fields are required" });
            }
    
            const loggedInUserId = req.user.id;
            const loggedInUserRole = req.user.role;
    
            const pool = await poolPromise;
            let admin;
    
            if (!isNaN(identifier)) {
                admin = await pool.request()
                    .input("Admin_ID", sql.Int, identifier)
                    .query("SELECT Admin_ID FROM Admin WHERE Admin_ID = @Admin_ID");
            } else {
                admin = await pool.request()
                    .input("Admin_Name", sql.NVarChar, identifier)
                    .query("SELECT Admin_ID FROM Admin WHERE Admin_Name = @Admin_Name");
            }
    
            if (!admin.recordset.length) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }
    
            const foundAdmin = admin.recordset[0];
    
            if (loggedInUserRole === 'admin' && foundAdmin.Admin_ID !== loggedInUserId) {
                return res.status(403).json({ success: false, message: "You can only update your own profile" });
            }
    
            const result = await pool.request()
                .input("Admin_ID", sql.Int, foundAdmin.Admin_ID)
                .input("Admin_Name", sql.NVarChar, Admin_Name)
                .input("Admin_Email", sql.NVarChar, Admin_Email)
                .input("Admin_Password", sql.NVarChar, Admin_Password)
                .input("Admin_PhoneNo",sql.NVarChar,Admin_PhoneNo)
                .query(`
                    UPDATE Admin
                    SET Admin_Name = @Admin_Name,
                        Admin_Email = @Admin_Email,
                        Admin_Password = @Admin_Password,
                        Admin_PhoneNo=@Admin_PhoneNo
                    WHERE Admin_ID = @Admin_ID
                `);
    
            res.status(200).json({ success: true, message: "Admin updated successfully", rowsAffected: result.rowsAffected });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    
    // The identifier can be the name of the admin or the id of the admin
    //the admin can change his own password and the admin can edit the password of another admin

    app.put("/api/updateAdminPassword/:identifier", authenticateUser, authorizeRole("admin"), async (req, res) => {
        try {
            const { identifier } = req.params;
            const { Admin_Password } = req.body;
    
            if (!identifier || !Admin_Password) {
                return res.status(400).json({ success: false, message: "Password is required" });
            }
    
            const loggedInUserId = req.user.id;
            const loggedInUserRole = req.user.role;
    
            const pool = await poolPromise;
    
            const admin = await pool.request()
                .input("Admin_ID", sql.Int, identifier)
                .query("SELECT Admin_ID FROM Admin WHERE Admin_ID = @Admin_ID");
    
            if (!admin.recordset.length) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }
    
            const foundAdmin = admin.recordset[0];
    
            if (loggedInUserRole === 'admin' && foundAdmin.Admin_ID !== loggedInUserId) {
                return res.status(403).json({ success: false, message: "You can only update your own password" });
            }
    
            const hashedPassword = await bcrypt.hash(Admin_Password, 10);
    
            const result = await pool.request()
                .input("Admin_ID", sql.Int, foundAdmin.Admin_ID)
                .input("Admin_Password", sql.NVarChar, hashedPassword)
                .query(`
                    UPDATE Admin
                    SET Admin_Password = @Admin_Password
                    WHERE Admin_ID = @Admin_ID
                `);
    
            res.status(200).json({ success: true, message: "Password updated successfully", rowsAffected: result.rowsAffected });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

 //Reset Admin password in case of Forget Password
 
    // Route: PUT /api/resetAdminPassword/:id
app.put("/api/resetAdminPassword/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { Admin_Password } = req.body;  // Admin's new password
        console.log("Body received:", req.body);

        // Check if password is provided
        if (!Admin_Password) {
            return res.status(400).json({ success: false, message: "New password is required" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(Admin_Password, 10);
        const pool = await poolPromise;

        // Update the Admin table with the new password
        const result = await pool.request()
            .input("Admin_ID", sql.Int, id)  // Admin ID
            .input("Admin_Password", sql.NVarChar, hashedPassword)  // Hashed password

            .query(`
                UPDATE Admin
                SET Admin_Password = @Admin_Password
                WHERE Admin_ID = @Admin_ID
            `);

        // If no rows were affected, the admin ID wasn't found
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


    

// --------------------------------UPDATE THE SUPPLIER----------------------------

// The identifier can be the name of the supplier or the id of the supplier

//only the admin has access

app.put("/api/updateSupplierDetails/:identifier",authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
        const { identifier } = req.params; // ID or Name from URL
        const { Supplier_Name, Supplier_PhoneNo, Supplier_Address } = req.body;

        if (!identifier || !Supplier_Name || !Supplier_PhoneNo || !Supplier_Address) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) { // If it's a number, update by Supplier_ID
            result = await pool.request()
                .input("Supplier_ID", sql.Int, identifier)
                .input("Supplier_Name", sql.NVarChar, Supplier_Name)
                .input("Supplier_PhoneNo", sql.NVarChar, Supplier_PhoneNo)
                .input("Supplier_Address", sql.NVarChar, Supplier_Address)
                .query("UPDATE SupplierDetails SET Supplier_Name=@Supplier_Name, Supplier_PhoneNo=@Supplier_PhoneNo, Supplier_Address=@Supplier_Address WHERE Supplier_ID=@Supplier_ID");
        } else { // If it's a string, update by Supplier_Name
            result = await pool.request()
                .input("Supplier_Name", sql.NVarChar, Supplier_Name)
                .input("Supplier_PhoneNo", sql.NVarChar, Supplier_PhoneNo)
                .input("Supplier_Address", sql.NVarChar, Supplier_Address)
                .query("UPDATE SupplierDetails SET Supplier_PhoneNo=@Supplier_PhoneNo, Supplier_Address=@Supplier_Address WHERE Supplier_Name=@Supplier_Name");
        }

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        res.status(200).json({ success: true, message: "Supplier Updated", rowsAffected: result.rowsAffected });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//----------------------------------------UPDATE THE CATEGORY-----------------------------------------

// The identifier can be the name of the category or the id of the category

//only the admin has access

app.put("/api/updateCategory/:identifier", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { identifier } = req.params; // ID or Name from URL
        const { Supplier_ID, Category_Name, Category_Description, Category_Image } = req.body;

        if (!identifier || !Supplier_ID || !Category_Name || !Category_Description || !Category_Image) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) { // If it's a number, update by Category_ID
            result = await pool.request()
                .input("Category_ID", sql.Int, identifier)
                .input("Supplier_ID", sql.Int, Supplier_ID)
                .input("Category_Name", sql.NVarChar, Category_Name)
                .input("Category_Description", sql.NVarChar, Category_Description)
                .input("Category_Image", sql.NVarChar, Category_Image)
                .query("UPDATE Category SET Supplier_ID=@Supplier_ID, Category_Name=@Category_Name, Category_Description=@Category_Description, Category_Image=@Category_Image WHERE Category_ID=@Category_ID");
        } else { // If it's a string, update by Category_Name
            result = await pool.request()
                .input("Supplier_ID", sql.Int, Supplier_ID)
                .input("Category_Name", sql.NVarChar, Category_Name)
                .input("Category_Description", sql.NVarChar, Category_Description)
                .input("Category_Image", sql.NVarChar, Category_Image)
                .query("UPDATE Category SET Supplier_ID=@Supplier_ID, Category_Description=@Category_Description, Category_Image=@Category_Image WHERE Category_Name=@Category_Name");
        }

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Category Updated",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//-------------------------------------UPDATE THE PRODUCTS--------------------------------

// The identifier can be the name of the product or the id of the product

//only the admin has access

app.put("/api/updateProductDetail/:identifier", authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
        const { identifier } = req.params;
        const { Category_ID, Product_Name, Product_Price, Product_Quantity, Product_ExpiryDate, Product_Image } = req.body;

        console.log("Updating product:", req.body, "Identifier:", identifier);

        if (!identifier || !Category_ID || !Product_Name || !Product_Price || !Product_Quantity || !Product_ExpiryDate) {
            return res.status(400).json({
                success: false,
                message: "All fields except Product_Image are required",
            });
        }

        const pool = await poolPromise;
        const request = pool.request();

        // Shared fields
        request.input("Category_ID", sql.Int, Category_ID);
        request.input("Product_Name", sql.NVarChar, Product_Name);
        request.input("Product_Price", sql.Decimal, Product_Price);
        request.input("Product_Quantity", sql.Int, Product_Quantity);
        request.input("Product_ExpiryDate", sql.Date, Product_ExpiryDate);

        let result;
        let query;

        const isBuffer = Buffer.isBuffer(Product_Image) || (typeof Product_Image === "string" && Product_Image.length > 0);

        if (!isNaN(identifier)) {
            request.input("Product_ID", sql.Int, identifier);

            if (isBuffer) {
                request.input("Product_Image", sql.VarBinary, Buffer.from(Product_Image, "base64")); // or directly if it's already a buffer
                query = `
                    UPDATE ProductDetail 
                    SET Category_ID=@Category_ID, Product_Name=@Product_Name, Product_Price=@Product_Price, 
                        Product_Quantity=@Product_Quantity, Product_ExpiryDate=@Product_ExpiryDate, Product_Image=@Product_Image 
                    WHERE Product_ID=@Product_ID
                `;
            } else {
                query = `
                    UPDATE ProductDetail 
                    SET Category_ID=@Category_ID, Product_Name=@Product_Name, Product_Price=@Product_Price, 
                        Product_Quantity=@Product_Quantity, Product_ExpiryDate=@Product_ExpiryDate 
                    WHERE Product_ID=@Product_ID
                `;
            }

        } else {
            // Update by Product_Name
            if (isBuffer) {
                request.input("Product_Image", sql.VarBinary, Buffer.from(Product_Image, "base64")); // adjust encoding if needed
                query = `
                    UPDATE ProductDetail 
                    SET Category_ID=@Category_ID, Product_Price=@Product_Price, 
                        Product_Quantity=@Product_Quantity, Product_ExpiryDate=@Product_ExpiryDate, Product_Image=@Product_Image 
                    WHERE Product_Name=@Product_Name
                `;
            } else {
                query = `
                    UPDATE ProductDetail 
                    SET Category_ID=@Category_ID, Product_Price=@Product_Price, 
                        Product_Quantity=@Product_Quantity, Product_ExpiryDate=@Product_ExpiryDate 
                    WHERE Product_Name=@Product_Name
                `;
            }
        }

        result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product Updated",
            rowsAffected: result.rowsAffected,
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --------------------------------- UPDATE THE CART----------------------------------------

//updation of cart on basis of customer id and product id

//only the customer is allowed to update his own cart

app.put("/api/updateCart/:customerid/:productid", authenticateUser, authorizeRole("customer"),async (req, res) => {
    try {
        const { customerid, productid } = req.params; // Extract Customer_ID and Product_ID from URL
        const { Cart_ID, Customer_ID, Product_ID, Quantity } = req.body; // Only quantity needs to be updated

        // Check if required fields are provided
        if (!Cart_ID || !Customer_ID || !Product_ID || !Quantity) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

       //The logged in customer can update his own cart only
        const loggedInUserId = req.user.id;  // ID of the logged-in user
        if (loggedInUserId !== parseInt(customerid)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this cart"
            });
        }

        const pool = await poolPromise;

        
        const result = await pool.request()
            .input("Cart_ID", sql.Int, Cart_ID)
            .input("Customer_ID", sql.Int, customerid)
            .input("Product_ID", sql.Int, productid)
            .input("Quantity", sql.Int, Quantity)
            .query("UPDATE Cart SET Quantity=@Quantity WHERE Customer_ID=@Customer_ID AND Product_ID=@Product_ID");

        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found or no changes made"
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart Updated",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --------------------------------------UPDATE THE ORDERS----------------------------------

//update the orders by the order id
//the customer can update his own order while the admin can update anyones order

app.put("/api/updateOrder/:orderid", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { orderid } = req.params;
        const { Customer_ID, OrderDate, OrderStatus, TotalPrice } = req.body;

       
        const loggedInUserId = req.user.id;  // Get the logged-in user ID
        const loggedInUserRole = req.user.role;  // Get the logged-in user role

        // The logged in customer can update only his own order
        if (loggedInUserRole !== "admin" && loggedInUserId !== parseInt(Customer_ID)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this order"
            });
        }

        if (!orderid || !Customer_ID || !OrderDate || !OrderStatus || !TotalPrice) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const pool = await poolPromise;
        let result;

        result = await pool.request()
            .input("Order_ID", sql.Int, orderid)
            .input("Customer_ID", sql.Int, Customer_ID)
            .input("OrderDate", sql.Date, OrderDate)
            .input("OrderStatus", sql.Char, OrderStatus)
            .input("TotalPrice", sql.Decimal, TotalPrice)
            .query("UPDATE Orders SET Customer_ID=@Customer_ID, OrderDate=@OrderDate, OrderStatus=@OrderStatus, TotalPrice=@TotalPrice WHERE Order_ID=@Order_ID"
            );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order Updated",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ------------------------UPDATE THE ORDER DETAILS---------------------------------------

// update order details on basis of  order id

//the admins can do it or the system can do it

app.put("/api/updateOrderDetails/:orderid", authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
        const { orderid } = req.params; // Extract Orders_ID from URL
        const { Product_ID, OrderDetails_Quantity, OrderDetails_Price } = req.body;

        if (!orderid || !Product_ID || !OrderDetails_Quantity || !OrderDetails_Price) {
            return res.status(400).json({
                success: false,
                message: "Orders_ID, Product_ID, OrderDetails_Quantity, and OrderDetails_Price are required"
            });
        }

        const loggedInUserId = req.user.id; // Logged-in user's ID
        const loggedInUserRole = req.user.role; // Logged-in user's role

        const pool = await poolPromise;

        
        const orderResult = await pool.request()
            .input("Order_ID", sql.Int, orderid)
            .query("SELECT * FROM Orders WHERE Order_ID = @Order_ID");

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const order = orderResult.recordset[0];


        // Update the OrderDetails
        let result = await pool.request()
            .input("Order_ID", sql.Int, orderid)  // Using Orders_ID from URL
            .input("Product_ID", sql.Int, Product_ID)
            .input("OrderDetails_Quantity", sql.Int, OrderDetails_Quantity)
            .input("OrderDetails_Price", sql.Decimal, OrderDetails_Price)
            .query(
                "UPDATE OrderDetails SET Product_ID=@Product_ID, OrderDetails_Quantity=@OrderDetails_Quantity, OrderDetails_Price=@OrderDetails_Price WHERE Orders_ID=@Order_ID AND Product_ID=@Product_ID"
            );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching Order Details found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Order Details Updated",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// -------------------------------UPDATE THE PAYMENTS--------------------------------------------
// The identifier type is orderid or paymentid

//only access to admins and the customer themself

app.put("/api/updatePayment/:identifierType/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifierType, identifier } = req.params; // Extract type and value from URL
        const { PaymentMethod, PaymentStatus, Transaction_ID } = req.body;
        const userId = req.user.id; // Assuming `authenticateUser` middleware attaches the user info to `req.user`.

        if (!identifier || !PaymentMethod || !PaymentStatus) {
            return res.status(400).json({
                success: false,
                message: "Identifier, PaymentMethod, and PaymentStatus are required"
            });
        }

        const pool = await poolPromise;
        let result;

        // Verify if the identifierType is valid
        if (identifierType === "paymentid") {
            // Fetch the payment details to check if the user is authorized to update it
            const paymentDetails = await pool.request()
                .input("Payments_ID", sql.Int, identifier)
                .query("SELECT Customer_ID FROM Payments WHERE Payments_ID = @Payments_ID");

            if (paymentDetails.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No matching payment details found"
                });
            }

            const paymentOwnerId = paymentDetails.recordset[0].Customer_ID;

            // If the user is a customer, they can only update their own payment status
            if (req.user.role === 'customer' && paymentOwnerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this payment"
                });
            }

            // Proceed to update the payment status
            result = await pool.request()
                .input("Payments_ID", sql.Int, identifier)
                .input("PaymentMethod", sql.NVarChar, PaymentMethod)
                .input("PaymentStatus", sql.Char, PaymentStatus)
                .input("Transaction_ID", sql.NVarChar, Transaction_ID)
                .query("UPDATE Payments SET PaymentMethod = @PaymentMethod,  PaymentStatus = @PaymentStatus, Transaction_ID = @Transaction_ID WHERE Payments_ID = @Payments_ID");

        } else if (identifierType === "orderid") {
            // Fetch the order details to check if the user is authorized to update it
            const orderDetails = await pool.request()
                .input("Order_ID", sql.Int, identifier)
                .query("SELECT Customer_ID FROM Orders WHERE Order_ID = @Order_ID");

            if (orderDetails.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No matching order details found"
                });
            }

            const orderOwnerId = orderDetails.recordset[0].Customer_ID;

            // If the user is a customer, they can only update their own order status
            if (req.user.role === 'customer' && orderOwnerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this order's payment status"
                });
            }

            // Proceed to update the payment status
            result = await pool.request()
                .input("Order_ID", sql.Int, identifier)
                .input("PaymentMethod", sql.NVarChar, PaymentMethod)
                .input("PaymentStatus", sql.Char, PaymentStatus)
                .input("Transaction_ID", sql.NVarChar, Transaction_ID)
                .query("UPDATE Payments SET PaymentMethod = @PaymentMethod, PaymentStatus = @PaymentStatus, Transaction_ID = @Transaction_ID WHERE Order_ID = @Order_ID");
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid identifierType. Use 'paymentid' or 'orderid'"
            });
        }

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching payment details found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment details updated successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});



// --------------------------------- UPDATE THE DELIVERY DETAILS--------------------------------
// The identifier type is deliveryid or orderid
//only the admin or the system can do it

app.put("/api/updateDeliveryDetails/:identifierType/:identifier", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { identifierType, identifier } = req.params; // Extract type and value from URL
        const { Delivery_Status, Estimated_Delivery } = req.body;

        if (!identifier || !Delivery_Status || !Estimated_Delivery) {
            return res.status(400).json({
                success: false,
                message: "Identifier, Delivery_Status, and Estimated_Delivery are required"
            });
        }

        const pool = await poolPromise;
        let result;

        if (identifierType === "deliveryid") {
            result = await pool.request()
                .input("Delivery_ID", sql.Int, identifier)
                .input("Delivery_Status", sql.NVarChar, Delivery_Status)
                .input("Estimated_Delivery", sql.Time, Estimated_Delivery)
                .query(`
                    UPDATE DeliveryDetails 
                    SET Delivery_Status = @Delivery_Status, 
                        Estimated_Delivery = @Estimated_Delivery
                    WHERE Delivery_ID = @Delivery_ID
                `);
        } else if (identifierType === "orderid") {
            result = await pool.request()
                .input("Order_ID", sql.Int, identifier)
                .input("Delivery_Status", sql.NVarChar, Delivery_Status)
                .input("Estimated_Delivery", sql.Time, Estimated_Delivery)
                .query(`
                    UPDATE DeliveryDetails 
                    SET Delivery_Status = @Delivery_Status, 
                        Estimated_Delivery = @Estimated_Delivery
                    WHERE Order_ID = @Order_ID
                `);
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid identifierType. Use 'Delivery_ID' or 'Order_ID'"
            });
        }

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching delivery details found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Delivery details updated successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// ------------------------------------UPDATE THE WISHLIST------------------------------------
// updation on basis of customerid and productid
//only the customer can update his own wishlist

app.put("/api/updateWishList/:customerid/:productid", authenticateUser, authorizeRole("customer"),async (req, res) => {
    try {
        const { customerid, productid } = req.params; // Extract Customer_ID and Product_ID from URL
        const { Quantity } = req.body; // Only quantity needs to be updated

       
        if (!Quantity) {
            return res.status(400).json({
                success: false,
                message: "Quantity is required"
            });
        }

        //The logged in customer can only update his own wishlist
        if (parseInt(customerid) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own wishlist"
            });
        }

        const pool = await poolPromise;

        
        const result = await pool.request()
            .input("Customer_ID", sql.Int, customerid)
            .input("Product_ID", sql.Int, productid)
            .input("Quantity", sql.Int, Quantity)
            .query(
                "UPDATE WishList SET Quantity = @Quantity WHERE Customer_ID = @Customer_ID AND Product_ID = @Product_ID"
            );

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Wishlist item not found or no changes made"
            });
        }

        res.status(200).json({
            success: true,
            message: "Wishlist updated successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



// -------------------------------UPDATE THE REVIEWS---------------------------------
// updation on basis of customer id and product id
//only the customer has access to update his own review

app.put("/api/updateReviews/:customerid/:productid",authenticateUser, authorizeRole("customer"), async (req, res) => {
    try {
        const { customerid, productid } = req.params; // Extract Customer_ID and Product_ID from URL
        const { Rating, Comment, ReviewDate } = req.body;

        
        if (!Rating || !Comment || !ReviewDate) {
            return res.status(400).json({
                success: false,
                message: "Rating, Comment, and ReviewDate are required"
            });
        }

        //the logged in customer can only update his own reviews
        
        if (parseInt(customerid) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own review"
            });
        }

        const pool = await poolPromise;

       
        const result = await pool.request()
            .input("Customer_ID", sql.Int, customerid)
            .input("Product_ID", sql.Int, productid)
            .input("Rating", sql.Int, Rating)
            .input("Comment", sql.NVarChar, Comment)
            .input("ReviewDate", sql.Date, ReviewDate)
            .query(`
                UPDATE Reviews 
                SET Rating = @Rating, 
                    Comment = @Comment, 
                    ReviewDate = @ReviewDate
                WHERE Customer_ID = @Customer_ID AND Product_ID = @Product_ID
            `);

       
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "No matching review found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            rowsAffected: result.rowsAffected
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//-------------------------UPDATE COUPON-----------------------------
app.put("/api/updateCoupon/:customerid", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { customerid } = req.params;
        const { HasCoupon } = req.body;

        if (!customerid || !HasCoupon) {
            return res.status(400).json({
                success: false,
                message: "Valid customerid and hasCoupon ('Yes' or 'No') are required"
            });
        }

        const pool = await poolPromise;

        // Check if the customer exists in the Coupon table
        const couponCheck = await pool.request()
            .input("Customer_ID", sql.Int, customerid)
            .query("SELECT * FROM Coupon WHERE Customer_ID = @Customer_ID");

        if (couponCheck.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No coupon record found for the provided customer ID"
            });
        }

        // Update HasCoupon field
        const updateResult = await pool.request()
            .input("Customer_ID", sql.Int, customerid)
            .input("HasCoupon", sql.VarChar(20), HasCoupon)
            .query("UPDATE Coupon SET HasCoupon = @HasCoupon WHERE Customer_ID = @Customer_ID");

        if (updateResult.rowsAffected[0] === 0) {
            return res.status(400).json({
                success: false,
                message: "Coupon status not updated"
            });
        }

        res.status(200).json({
            success: true,
            message: "Coupon status updated successfully",
            rowsAffected: updateResult.rowsAffected
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



}
