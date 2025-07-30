const express = require('express');

const {sql,poolPromise} = require('./db');

const { authenticateUser, authorizeRole } = require("./authMiddleware"); //Import the Authorization from authMiddleware.js

module.exports=function(app){

//-------------------------------GET CUSTOMER---------------------------------

//API FOR SELECTING ALL CUSTOMERS .. RESTRICTED TO ADMINS ONLY

app.get("/api/customer",authenticateUser,authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM Customer");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              customerData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

// API FOR GETTING CUSTOMER BY ID OR BY NAME.. THE CUSTOMER CAN VIEW HIS OWN DETAILS AND THE ADMIN CAN VIEW DETAILS OF ANY CUSTOMER

app.get("/api/getCustomer/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifier } = req.params;
        const pool = await poolPromise;
        let result;

        const loggedInUserId = req.user.id;  // ID of the logged-in user
        const loggedInUserRole = req.user.role;  // Role of the logged-in user 
        
        // If the logged-in user is a customer and they are trying to access someone else's details, restrict access
        if (!isNaN(identifier)) { // If customer id is the identifier
            if (loggedInUserRole !== 'admin' && loggedInUserId !== parseInt(identifier)) {
                return res.status(403).json({ success: false, message: 'You are not authorized to view this customer.' });
            }
        }


        // If the identifier is a number (customer ID)
        if (!isNaN(identifier)) {
            result = await pool.request()
                .input("Customer_ID", sql.Int, identifier)
                .query("SELECT * FROM Customer WHERE Customer_ID = @Customer_ID");
        } else { // If it is a string, check for customer name
            result = await pool.request()
                .input("Customer_Name", sql.NVarChar, identifier)
                .query("SELECT * FROM Customer WHERE Customer_Name = @Customer_Name");

            // If the user is a customer, ensure they are only viewing their own name or their own id
            if (loggedInUserRole === 'customer' && result.recordset.length > 0) {
                const customer = result.recordset[0];
                
                if (customer.Customer_Name !== identifier || loggedInUserId !== customer.Customer_ID) {
                    return res.status(403).json({ success: false, message: 'You are not authorized to view this customer.' });
                }
            }
        }

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//API FOR GETTING ALL CUSTOMER NAMES WHICH BOTH THE ADMIN AND CUSTOMER HAS ACCESS TO
app.get("/api/getAllCustomerNames", authenticateUser, authorizeRole("admin", "customer"),async (req, res) => {
    try {
        const pool = await poolPromise;

        // Allow any authenticated user (both customer and admin) to access customer names
        const result = await pool.request()
            .query("SELECT Customer_ID, Customer_Name FROM Customer");

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "No customers found" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//-------------------------------GET ADMIN---------------------------------

app.get("/api/getAdmin/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifier } = req.params;
        const pool = await poolPromise;
        let result;

        const loggedInUserId = req.user.id;  // ID of the logged-in user
        const loggedInUserRole = req.user.role;  // Role of the logged-in user 
        
        // If the logged-in user is a customer and they are trying to access someone else's details, restrict access
        if (!isNaN(identifier)) { // If customer id is the identifier
            if (loggedInUserRole !== 'admin' && loggedInUserId !== parseInt(identifier)) {
                return res.status(403).json({ success: false, message: 'You are not authorized to view this customer.' });
            }
        }


        // If the identifier is a number (customer ID)
        if (!isNaN(identifier)) {
            result = await pool.request()
                .input("Admin_ID", sql.Int, identifier)
                .query("SELECT * FROM Admin WHERE Admin_ID= @Admin_ID");
        } else { // If it is a string, check for customer name
            result = await pool.request()
                .input("Admin_Name", sql.NVarChar, identifier)
                .query("SELECT * FROM Admin WHERE Admin_Name = @Admin_Name");

            // If the user is a admin, ensure they are only viewing their own name or their own id
            if (loggedInUserRole === 'admin' && result.recordset.length > 0) {
                const admin = result.recordset[0];
                
                if (admin.Admin_Name !== identifier || loggedInUserId !== admin.Admin_ID) {
                    return res.status(403).json({ success: false, message: 'You are not authorized to view this customer.' });
                }
            }
        }

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



//--------------------------------GET ORDER--------------------------------

//API FOR SELECTING ALL ORDERS ..RESTRICTED TO ADMINS ONLY

app.get("/api/orders",authenticateUser,authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM Orders");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              ordersData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

// API for getting orders by either Customer ID or Order ID .. THE CUSTOMER CAN VIEW HIS ORDER WHILE ADMIN CAN VIEW EVERYONES ORDERS
// identifierType can be "customerid" or "orderid"

app.get("/api/getOrder/:identifierType/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifierType, identifier } = req.params;
        const pool = await poolPromise;
        let result;
        let query = "";

        // Validate identifier type
        if (identifierType !== "orderid" && identifierType !== "customerid") {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier type. Use 'orderid' or 'customerid'"
            });
        }

        // ✅ Validate identifier value is a number
        const identifierInt = parseInt(identifier);
        if (isNaN(identifierInt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier value. Must be a valid number."
            });
        }

        const loggedInUserId = req.user.id;
        const loggedInUserRole = req.user.role;

        console.log("Request Debug Info:", {
            loggedInUserId,
            loggedInUserRole,
            identifierType,
            identifierInt
        });

        // Role-based access
        if (loggedInUserRole === 'customer' && identifierType === 'customerid') {
            if (identifierInt !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to view this customer\'s orders.'
                });
            }
        }

        // Set query
        if (identifierType === "orderid") {
            query = "SELECT * FROM Orders WHERE Order_ID = @Identifier";
        } else if (identifierType === "customerid") {
            query = "SELECT * FROM Orders WHERE Customer_ID = @Identifier";
        }

        // Execute query
        result = await pool.request()
            .input("Identifier", sql.Int, identifierInt)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Additional access check when querying by orderid
        if (loggedInUserRole === 'customer' && identifierType === 'orderid') {
            if (result.recordset[0].Customer_ID !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to view this order.'
                });
            }
        }

        res.status(200).json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("Error in getOrder route:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// api to get order where status is 'pending'
app.get("/api/getPendingOrders/:identifierType/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifierType, identifier } = req.params;
        const pool = await poolPromise;
        let result;
        let query = "";

        // Validate identifier type
        if (identifierType !== "orderid" && identifierType !== "customerid") {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier type. Use 'orderid' or 'customerid'"
            });
        }

        // ✅ Validate identifier value is a number
        const identifierInt = parseInt(identifier);
        if (isNaN(identifierInt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier value. Must be a valid number."
            });
        }

        const loggedInUserId = req.user.id;
        const loggedInUserRole = req.user.role;

        console.log("Request Debug Info:", {
            loggedInUserId,
            loggedInUserRole,
            identifierType,
            identifierInt
        });

        // Role-based access
        if (loggedInUserRole === 'customer' && identifierType === 'customerid') {
            if (identifierInt !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to view this customer\'s orders.'
                });
            }
        }

        // Set query
        if (identifierType === "orderid") {
            query = "SELECT * FROM Orders WHERE Order_ID = @Identifier AND OrderStatus = 'P'";
        } else if (identifierType === "customerid") {
            query = "SELECT * FROM Orders WHERE Customer_ID = @Identifier AND OrderStatus = 'P'";
        }

        // Execute query
        result = await pool.request()
            .input("Identifier", sql.Int, identifierInt)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Additional access check when querying by orderid
        if (loggedInUserRole === 'customer' && identifierType === 'orderid') {
            if (result.recordset[0].Customer_ID !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to view this order.'
                });
            }
        }

        res.status(200).json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("Error in getOrder route:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});




//--------------------------------GET ORDER DETAIL--------------------------------

//API FOR SELECTING ALL ORDERS DETAILS .. RESTRICTED TO ADMINS ONLY

app.get("/api/orderDetails",authenticateUser,authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM OrderDetails");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              ordersData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});


// API for getting order details by either Order ID or Product ID.. THE CUSTOMER CAN VIEW HIS OWN ORDER DETAILS WHILE ADMIN CAN VIEW EVERYONES ORDER DETAILS
// identifierType can be "orderid" or "productid"

app.get("/api/getOrderDetails/:identifierType/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifierType, identifier } = req.params;
        const pool = await poolPromise;

        const loggedInUserId = req.user.id;
        const loggedInUserRole = req.user.role;

        let query = "";
        let validationQuery = "";

        // Validate identifier type
        if (identifierType === "orderid") {
            query = `
                SELECT 
                    od.Product_ID,
                    p.Product_Name,
                    od.OrderDetails_Quantity,
                    od.OrderDetails_Price
                FROM OrderDetails od
                INNER JOIN ProductDetail p ON od.Product_ID = p.Product_ID
                WHERE od.Orders_ID = @Identifier
            `;

            // If customer, ensure it's their order
            if (loggedInUserRole === 'customer') {
                validationQuery = `
                    SELECT Customer_ID FROM Orders WHERE Order_ID = @Identifier
                `;
                const validationResult = await pool.request()
                    .input("Identifier", sql.Int, identifier)
                    .query(validationQuery);

                if (validationResult.recordset.length === 0) {
                    return res.status(404).json({ success: false, message: "Order not found" });
                }

                const customerId = validationResult.recordset[0].Customer_ID;
                if (customerId !== loggedInUserId) {
                    return res.status(403).json({ success: false, message: "You are not authorized to view this order's details" });
                }
            }

        } else if (identifierType === "productid") {
            query = `
                SELECT 
                    od.Product_ID,
                    p.Product_Name,
                    p.Product_ImageURL,
                    od.OrderDetails_Quantity,
                    od.OrderDetails_Price
                FROM OrderDetails od
                INNER JOIN ProductDetail p ON od.Product_ID = p.Product_ID
                WHERE od.Product_ID = @Identifier
            `;

            // For customer, verify they’ve ordered this product
            if (loggedInUserRole === 'customer') {
                validationQuery = `
                    SELECT TOP 1 o.Customer_ID
                    FROM Orders o
                    JOIN OrderDetails od ON o.Order_ID = od.Orders_ID
                    WHERE od.Product_ID = @Identifier AND o.Customer_ID = @CustomerID
                `;
                const validationResult = await pool.request()
                    .input("Identifier", sql.Int, identifier)
                    .input("CustomerID", sql.Int, loggedInUserId)
                    .query(validationQuery);

                if (validationResult.recordset.length === 0) {
                    return res.status(403).json({ success: false, message: "You are not authorized to view this product's order details" });
                }
            }

        } else {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid identifier type. Use 'orderid' or 'productid'" 
            });
        }

        // Execute main query
        const result = await pool.request()
            .input("Identifier", sql.Int, identifier)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Order details not found" });
        }

        res.status(200).json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("Order details API error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//------------------------------------GET SUPPLIER--------------------------------

//API FOR SELECTING ALL SUPPLIER DETAILS WHICH ONLY THE ADMIN HAS ACCESS TO

app.get("/api/supplierDetails",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM SupplierDetails");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

//API FOR GETTING SUPPLIER BY NAME OR BY ID WHICH ONLY THE ADMIN HAS ACCESS TO

app.get("/api/getSupplier/:identifier", authenticateUser, authorizeRole("admin"),async (req, res) => {
    try {
        const { identifier } = req.params;
        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) { //if number then check for supplier id
            result = await pool.request()
                .input("Supplier_ID", sql.Int, identifier)
                .query("SELECT * FROM SupplierDetails WHERE Supplier_ID = @Supplier_ID");
        } else { //if string then check for supplier name
            result = await pool.request()
                .input("Supplier_Name", sql.NVarChar, identifier)
                .query("SELECT * FROM SupplierDetails WHERE Supplier_Name = @Supplier_Name");
        }

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Supplier not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//------------------------------GET CATEGORY-------------------------------

//API FOR SELECTING ALL CATEGORIES WHICH BOTH THE ADMIN AND THE CUSTOMER HAVE ACCESS TO

app.get("/api/category",authenticateUser, authorizeRole("admin", "customer"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM Category");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

//GET CATEGORY BY ID OR BY NAME WHICH BOTH THE ADMIN AND THE CUSTOMER HAVE ACCESS TO

app.get("/api/getCategory/:identifier",authenticateUser, authorizeRole("admin", "customer") ,async (req, res) => {
    try {
        const { identifier } = req.params;
        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) { //if number check for category id
            result = await pool.request()
                .input("Category_ID", sql.Int, identifier)
                .query("SELECT * FROM Category WHERE Category_ID = @Category_ID");
        } else { //if string check for category name
            result = await pool.request()
                .input("Category_Name", sql.NVarChar, identifier)
                .query("SELECT * FROM Category WHERE Category_Name = @Category_Name");
        }

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//----------------------------------GET PRODUCT----------------------------------------

//API FOR SELECTING ALL PRODUCT DETAILS WHICH BOTH THE ADMIN AND THE CUSTOMER HAVE ACCESS TO

app.get("/api/productDetail",authenticateUser, authorizeRole("admin", "customer"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM ProductDetail");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});


//API FOR GETTING PRODUCT DETAILS BY ID OR BY NAME WHICH BOTH THE ADMIN AND THE CUSTOMER HAVE ACCESS TO

app.get("/api/getProduct/:identifier",authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifier } = req.params;
        const pool = await poolPromise;
        let result;

        if (!isNaN(identifier)) {
            result = await pool.request()
                .input("Product_ID", sql.Int, identifier)
                .query("SELECT * FROM ProductDetail WHERE Product_ID = @Product_ID");
        } else {
            result = await pool.request()
                .input("Product_Name", sql.NVarChar, identifier)
                .query("SELECT * FROM ProductDetail WHERE Product_Name = @Product_Name");
        }

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//API FOR GETTING PRODUCT DETAILS BY CATEGORY ID WHICH BOTH THE ADMIN AND THE CUSTOMER HAVE ACCESS TO

app.get("/api/getProduct/categoryid/:categoryid",authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { categoryid } = req.params; // Extract category ID from URL
        const pool = await poolPromise;

        if (isNaN(categoryid)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }

       
        const result = await pool.request()
            .input("Category_ID", sql.Int, categoryid)
            .query("SELECT * FROM ProductDetail WHERE Category_ID = @Category_ID");

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "No products found in this category" });
        }

        res.status(200).json({ success: true, data: result.recordset });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
//------------------------------GET CART-------------------------------------

//API FOR SELECTING ALL CARTS OF CUSTOMERS WHICH ONLY THE ADMIN HAS ACCESS TO

app.get("/api/cart",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM Cart");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

//API FOR GETTING CART OF A CUSTOMER BY CUSTOMER ID .. THE CUSTOMER CAN ONLY VIEW HIS OWN CART AND THE ADMIN CAN VIEW ANYONES CART

app.get("/api/getCart/:customerId", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { customerId } = req.params;
        const pool = await poolPromise;

        const loggedInUserId = req.user.id;  // ID of the logged-in user
        const loggedInUserRole = req.user.role;  // Role of the logged-in user

       
        if (loggedInUserRole === 'customer' && parseInt(customerId) !== loggedInUserId) {
            //If the logged in customer is trying to view someone elses cart, restrict access
            return res.status(403).json({ success: false, message: 'You are not authorized to view this customer\'s cart.' });
        }

        const result = await pool.request()
            .input("Customer_ID", sql.Int, customerId)
            .query("SELECT * FROM Cart WHERE Customer_ID = @Customer_ID");

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Cart is empty or Customer not found" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//-----------------------------GET PAYMENTS-----------------------------------

//API FOR SELECTING ALL PAYMENTS WHICH ONLY THE ADMIN HAS ACCESS TO

app.get("/api/payments",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM Payments");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

//API FOR GETTING PAYMENT DETAILS BY ORDER ID ..THE ADMIN CAN SEE EVERYONES PAYMENT DETAILS WHILE THE CUSTOMER CAN SEE ONLY HIS PAYMENT DETAIL OF AN ORDER

app.get("/api/getPayment/:orderId", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { orderId } = req.params;
        const pool = await poolPromise;

        const loggedInUserId = req.user.id;  // ID of the logged-in user
        const loggedInUserRole = req.user.role;  // Role of the logged-in user

        
        if (loggedInUserRole === 'customer') {
            const orderCheckResult = await pool.request()
                .input("OrderID", sql.Int, orderId)
                .query("SELECT Customer_ID FROM Orders WHERE Order_ID = @OrderID");

            if (orderCheckResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: "Order not found" });
            }

           
            const orderCustomerId = orderCheckResult.recordset[0].Customer_ID;

            if (orderCustomerId !== loggedInUserId) {
                //If the logged in customer is trying to view someone elses payment details, restrict access
                return res.status(403).json({ success: false, message: "You are not authorized to view this payment details" });
            }
        }

        
        const result = await pool.request()
            .input("Order_ID", sql.Int, orderId)
            .query("SELECT * FROM Payments WHERE Order_ID = @Order_ID");

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Payment details not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//------------------------------GET DELIVERY DETAILS------------------------

//API FOR SELECTING THE DELIVERY DETAILS WHICH ONLY THE ADMIN HAS ACCESS TO

app.get("/api/deliveryDetails",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM DeliveryDetails");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

//API FOR GETTING DELIVERY DETAILS BY DELIVERY ID OR ORDER ID ..THE ADMIN CAN SEE ANYONES DELIVERY DETAILS AND THE CUSTOMER CAN ONLY SEE HIS DELIVERY DETAILS

//identifierType will be deliveryid or orderid

app.get("/api/getDelivery/:identifierType/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifierType, identifier } = req.params;

        if (!identifier || isNaN(identifier)) {
            return res.status(400).json({ success: false, message: "Invalid identifier" });
        }

        const pool = await poolPromise;
        let result;
        let query = "";

        
        if (identifierType === "deliveryid") {
            query = "SELECT * FROM DeliveryDetails WHERE Delivery_ID = @Identifier";
        } else if (identifierType === "orderid") {
            query = "SELECT * FROM DeliveryDetails WHERE Order_ID = @Identifier";
        } else {
            return res.status(400).json({ success: false, message: "Invalid identifier type. Use 'deliveryid' or 'orderid'" });
        }

        const loggedInUserId = req.user.id;  // ID of the logged-in user
        const loggedInUserRole = req.user.role;  // Role of the logged-in user

        if (loggedInUserRole === 'customer') {
            let orderCustomerId;

           
            if (identifierType === 'orderid') {
                const orderCheckResult = await pool.request()
                    .input("Order_ID", sql.Int, identifier)
                    .query("SELECT Customer_ID FROM Orders WHERE Order_ID = @Order_ID");

                if (orderCheckResult.recordset.length === 0) {
                    return res.status(404).json({ success: false, message: "Order not found" });
                }

                orderCustomerId = orderCheckResult.recordset[0].Customer_ID;
            } else if (identifierType === 'deliveryid') {
               
                const deliveryCheckResult = await pool.request()
                    .input("Delivery_ID", sql.Int, identifier)
                    .query("SELECT Order_ID FROM DeliveryDetails WHERE Delivery_ID = @Delivery_ID");

                if (deliveryCheckResult.recordset.length === 0) {
                    return res.status(404).json({ success: false, message: "Delivery not found" });
                }

                const orderId = deliveryCheckResult.recordset[0].Order_ID;

                const orderResult = await pool.request()
                    .input("Order_ID", sql.Int, orderId)
                    .query("SELECT Customer_ID FROM Orders WHERE Order_ID = @Order_ID");

                if (orderResult.recordset.length === 0) {
                    return res.status(404).json({ success: false, message: "Order not found" });
                }

                orderCustomerId = orderResult.recordset[0].Customer_ID;
            }

           
            if (orderCustomerId !== loggedInUserId) {
                //If the logged in customer is trying to view someone elses delivery details, restrict access
                return res.status(403).json({ success: false, message: "You are not authorized to view this delivery details" });
            }
        }

       
        result = await pool.request()
            .input("Identifier", sql.Int, identifier)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "No delivery details found" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//----------------------------------GET WISHLIST----------------------------------

//API FOR SELECTING THE WISHLIST OF ALL CUSTOMERS WHICH ONLY THE ADMIN HAS ACCESS TO

app.get("/api/wishlist",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM Wishlist");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }
  
});

// API FOR GETTING WISHLIST OF A CUSTOMER BY ID  ..THE ADMIN CAN SEE ANYONES WISHLIST AND THE CUSTOMER CAN SEE HIS OWN WISHLIST

app.get("/api/getWishlist/:customerId", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { customerId } = req.params;
        const pool = await poolPromise;

        const loggedInUserId = req.user.id;  // ID of the logged-in user
        const loggedInUserRole = req.user.role;  // Role of the logged-in user

       //if logged in customer is trying to view someone elses wishlist, restrict access
        if (loggedInUserRole === 'customer' && parseInt(customerId) !== loggedInUserId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this customer\'s wishlist.' });
        }

        const result = await pool.request()
            .input("Customer_ID", sql.Int, customerId)
            .query("SELECT * FROM Wishlist WHERE Customer_ID = @Customer_ID");

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Wishlist is empty or Customer not found" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


//-----------------------------GET REVIEWS---------------------------------

//API FOR SELECTING ALL THE REVIEWS WHICH BOTH THE ADMIN AND THE CUSTOMER HAS ACCESS TO

app.get("/api/reviews",authenticateUser,authorizeRole("admin","customer"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("SELECT * FROM Reviews");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              orderDetailsData:result.recordset
        });

    }
    catch(error)
    {
     console.log('Error',error);
     res.status(500).json({
          sucess:false,
          message:"Server error, try again",
          error: error.message
     });
    }

});
  
 //GET REVIEWS BY CUSTOMER ID OR BY PRODUCT ID WHICH BOTH THE ADMIN AND CUSTOMER HAS ACCESS TO

 //identifierType will be customerid or productid

 app.get("/api/getReviews/:identifierType/:identifier", authenticateUser,authorizeRole("admin","customer"),async (req, res) => {
    try {
        const { identifierType, identifier } = req.params;

        if (!identifier || isNaN(identifier)) {
            return res.status(400).json({ success: false, message: "Invalid identifier" });
        }

        const pool = await poolPromise;
        let result;

        if (identifierType === "customerid") 
        {
            result = await pool.request()
                .input("Customer_ID", sql.Int, identifier)
                .query("SELECT * FROM Reviews WHERE Customer_ID = @Customer_ID");
        } 
        else if (identifierType === "productid") 
        {
            result = await pool.request()
                .input("Product_ID", sql.Int, identifier)
                .query("SELECT * FROM Reviews WHERE Product_ID = @Product_ID");
        } 
        else 
        {
            return res.status(400).json({ success: false, message: "Invalid identifier type. Use 'customer' or 'product'." });
        }

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "No reviews found" });
        }

        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// api to fetch coupons by couponid or customerid .. THE CUSTOMER CAN VIEW HIS OWN COUPONS AND THE ADMIN CAN VIEW EVERYONES COUPONS
app.get("/api/getCoupon/:identifierType/:identifier", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const { identifierType, identifier } = req.params;
        const pool = await poolPromise;
        let result;
        let query = "";

        // Validate identifier type
        if (identifierType !== "couponid" && identifierType !== "customerid") {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier type. Use 'couponid' or 'customerid'"
            });
        }

        // Validate identifier value
        const identifierInt = parseInt(identifier);
        if (isNaN(identifierInt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid identifier value. Must be a valid number."
            });
        }

        const loggedInUserId = req.user.id;
        const loggedInUserRole = req.user.role;

        console.log("Request Debug Info:", {
            loggedInUserId,
            loggedInUserRole,
            identifierType,
            identifierInt
        });

        // Role-based access check
        if (loggedInUserRole === 'customer' && identifierType === 'customerid') {
            if (identifierInt !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this customer's coupon."
                });
            }
        }

        // Build query
        if (identifierType === "couponid") {
            query = "SELECT * FROM Coupon WHERE Coupon_ID = @Identifier";
        } else if (identifierType === "customerid") {
            query = "SELECT * FROM Coupon WHERE Customer_ID = @Identifier";
        }

        // Execute query
        result = await pool.request()
            .input("Identifier", sql.Int, identifierInt)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        // Additional check for couponid if role is customer
        if (loggedInUserRole === 'customer' && identifierType === 'couponid') {
            if (result.recordset[0].Customer_ID !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this coupon"
                });
            }
        }

        res.status(200).json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("Error in getCoupon route:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

};

