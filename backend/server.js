//IMPORTS ALL ROUTES AND STARTS THE SQL SERVER


const express = require('express');
const path = require("path")
const jwt = require('jsonwebtoken');  // Import JWT
const cors=require("cors"); //Import cors
const bcrypt = require("bcrypt"); //Import Bcrypt
const bodyParser = require('body-parser'); //Import body-parser

const {sql,poolPromise} = require('./db'); //Import connection from db.js


require("dotenv").config(); //for the environment file which contains secret key
const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";

const app = express();
app.use(bodyParser.json());
app.use(express.json());
//app.use(cors());
app.use(cors({
    origin: 'http://localhost:3000', // Your React app's URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

const { authenticateUser, authorizeRole } = require("./authMiddleware"); //Import the Authorization from authMiddleware.js

require("./insertData.js")(app); //Run inserData.js
require("./fetchData.js")(app); //Run fetchData.js
require("./deleteData.js")(app); //Run deleteData.js
require("./updateData.js")(app);//Run updateData.js



async function hashAllPasswords() { //For hashing already existing passwords in the database
    try {
        const pool = await poolPromise;

        // Hashing Customer Passwords
        const customers = await pool.request().query("SELECT Customer_ID, Customer_Password FROM Customer");
        for (const customer of customers.recordset) {
            const hashedPassword = await bcrypt.hash(customer.Customer_Password, 10);
            await pool.request()
                .input("Customer_ID", sql.Int, customer.Customer_ID)
                .input("HashedPassword", sql.NVarChar, hashedPassword)
                .query("UPDATE Customer SET Customer_Password = @HashedPassword WHERE Customer_ID = @Customer_ID");
        }
        console.log("Customer passwords hashed successfully!");

        // Hashing Admin Passwords
        const admins = await pool.request().query("SELECT Admin_ID, Admin_Password FROM Admin");
        for (const admin of admins.recordset) {
            const hashedPassword = await bcrypt.hash(admin.Admin_Password, 10);
            await pool.request()
                .input("Admin_ID", sql.Int, admin.Admin_ID)
                .input("HashedPassword", sql.NVarChar, hashedPassword)
                .query("UPDATE Admin SET Admin_Password = @HashedPassword WHERE Admin_ID = @Admin_ID");
        }
        console.log("Admin passwords hashed successfully!");

    } catch (error) {
        console.error("Error hashing passwords:", error);
    } finally {
        sql.close(); // Close DB connection
    }
}

//hashAllPasswords(); //Call function once


//----------------------------CUSTOMER LOGIN-------------------------------------

app.post("/customer/login", async (req, res) => {
    const { Customer_Email, Customer_Password } = req.body;
    console.log("Login request received:", req.body);
    
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("Customer_Email", sql.NVarChar, Customer_Email)
            .query("SELECT * FROM Customer WHERE Customer_Email = @Customer_Email");

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const customer = result.recordset[0];

        const isMatch = await bcrypt.compare(Customer_Password, customer.Customer_Password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Generate JWT token 
        const token = jwt.sign(
            { id: customer.Customer_ID, email: customer.Customer_Email, role: "customer" },
            jwtSecret,
            { expiresIn: "1h" }
          );
          
        

        res.json({ 
            success: true, 
            token, 
            user: { id: customer.Customer_ID, email: customer.Customer_Email, role: "customer" } 
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

app.get("/customer/profile", authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email; // Get email from decoded JWT
        const pool = await poolPromise;

        // Query to fetch the user profile from the database
        const result = await pool.request()
            .input("Customer_Email", sql.NVarChar, userEmail)
            .query("SELECT Customer_ID, Customer_Email, Customer_Name FROM Customer WHERE Customer_Email = @Customer_Email");

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Respond with user profile
        const user = result.recordset[0];
        res.json({
            success: true,
            user: {
                id: user.Customer_ID,
                email: user.Customer_Email,
                name: user.Customer_Name,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
  


//-----------------------------ADMIN LOGIN-----------------------------------------

app.post("/admin/login", async (req, res) => {
    const { Admin_Email, Admin_Password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input("Admin_Email", sql.NVarChar, Admin_Email)
            .query("SELECT * FROM Admin WHERE Admin_Email = @Admin_Email");

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const admin = result.recordset[0];

        const isMatch = await bcrypt.compare(Admin_Password, admin.Admin_Password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Generate JWT token 
        const token = jwt.sign(
            { id:admin.Admin_ID,email: admin.Admin_Email, role: "admin" }, // Fixed this line
            jwtSecret,
            { expiresIn: "1h" }
        );
        
        res.json({ 
            success: true, 
            token, 
            user: { id: admin.Admin_ID, email: admin.Admin_Email, role: "admin" } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

app.get("/admin/profile", authenticateUser,async (req, res) => {
    try {
        const adminId = req.user.id; // Get admin ID from decoded JWT

        // Query to fetch the admin profile from the database
        const result = await pool.query(
            "SELECT Admin_ID, Admin_Email, Admin_Name FROM admins WHERE Admin_ID = $1",
            [adminId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Respond with admin profile
        const admin = result.rows[0];
        res.json({
            success: true,
            user: {
                id: admin.Admin_ID,
                email: admin.Admin_Email,
                name: admin.Admin_Name,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

//API OPERATIONS FOR SOME VIEWS/FUNCTIONAL QUERIES

//1.  View to List product with category and supplier which both the ADMIN AND CUSTOMER HAVE ACCESS TO

app.get("/api/productView",authenticateUser,authorizeRole("admin", "customer"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("Select product_id,Product_Quantity, Product_Name, Category_Name, Supplier_Name from ProductDetail p join Category C on p.Category_ID=C.Category_ID join SupplierDetails s on s.Supplier_ID= C.Supplier_ID");
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


//2. View to see User Cart Details which ONLY THE ADMIN HAS ACCESS TO to see all cart details of all customers

app.get("/api/usercartView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("Select C.Customer_ID, C.Customer_Name,Ct.Quantity, P.Product_ID, P.Product_Name,P.Product_Price, (CT.Quantity* P.Product_Price) as TotalPricefrom from cart ct join customer c on ct.Customer_ID=c.Customer_ID join ProductDetail p on ct.Product_ID= p.Product_ID");
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

//3. Orders Summary View which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/ordersummaryView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("select o.order_id, c.customer_name, o.orderDate, o.TotalPrice from Orders o join Customer C on C.Customer_ID= o.Customer_ID");
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

//4. Payment Status View which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/paymentstatusView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("select  P.Payments_ID, O.Order_ID, C.Customer_ID,  C.Customer_Name,C.Customer_Email,C.Customer_PhoneNo, P.PaymentMethod,P.PaymentStatus,P.Transaction_ID from Payments P join Orders O on p.Order_ID=O.Order_ID join Customer C on O.Customer_ID=C.Customer_ID");
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

//5.  Delivery Status view which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/deliverystatusView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("select D.Delivery_ID, O.Order_ID, C.Customer_ID, C.Customer_Name, C.Customer_PhoneNo, O.OrderDate, D.Estimated_Delivery,case when D.Delivery_Status = 'Order Delivered' then 'Completed' when D.Delivery_Status = 'Rider is on the way' then 'In Transit' else 'Pending' end as Delivery_Stage from DeliveryDetails D join Orders O on D.Order_ID= O.Order_ID join Customer C ON O.Customer_ID = C.Customer_ID");
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

//6.Available products which BOTH THE ADMIN AND THE CUSTOMER HAS ACCESS TO

app.get("/api/availableproductsView",authenticateUser, authorizeRole("admin","customer"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("Select Product_ID, Product_Name, Product_Quantity,Product_Price from ProductDetail where Product_Quantity>0");
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

//7.Sales Report View which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/salesreport",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("Select P.Product_ID, P.Product_Name, sum(OD.OrderDetails_Quantity * OD.OrderDetails_Price) as TotalRevenue from OrderDetails OD join ProductDetail P on OD.Product_ID = P.Product_ID group by P.Product_ID, P.Product_Name");
      console.log(result);

      res.status(200).json( {
              sucess:true,
              salesReportData: result.recordset // Cha
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

//8.View for Order Cancellations and Refunds for online orders which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/ordercancellationsandrefundsView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("Select O.Order_ID, C.Customer_Name, O.OrderStatus, P.PaymentMethod, P.PaymentStatus, P.Transaction_ID from Orders O join  Customer C on O.Customer_ID = C.Customer_ID join Payments P on O.Order_ID = P.Order_ID where O.OrderStatus = 'C' -- Cancelled orders and P.PaymentMethod = 'Online'; -- Only online payments");
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

//9. View for Top 5 products for Customers View which both the ADMIN AND THE CUSTOMER HAS ACCESS TO

app.get("/api/top5productsView", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query("select top 5 P.Product_ID, P.Product_Name,P.Product_Image,P.Product_Price, sum(OD.OrderDetails_Quantity) as TotalQuantitySold from OrderDetails OD join  ProductDetail P on OD.Product_ID = P.Product_ID group by P.Product_ID, P.Product_Name,P.Product_Image,P.Product_Price order by  TotalQuantitySold DESC");
        console.log(result);

        res.status(200).json({
            sucess: true,
            customerData: result.recordset
        });

    }
    catch (error) {
        console.log('Error', error);
        res.status(500).json({
            sucess: false,
            message: "Server error, try again",
            error: error.message
        });
    }

});


//10.  View for Bottom 5 Least Selling Products which BOTH THE ADMIN AND CUSTOMER HAVE ACCESS TO

app.get("/api/bottom5productsView", authenticateUser, authorizeRole("admin", "customer"), async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query("Select top 5 P.Product_ID, P.Product_Name,P.Product_Price,P.Product_Image,ISNULL(SUM(OD.OrderDetails_Quantity), 0) as Total_Sold From ProductDetail P Left join OrderDetails OD on P.Product_ID = OD.Product_ID Group By P.Product_ID, P.Product_Name, P.Product_Price,P.Product_Image Order By Total_Sold ASC");
        console.log(result);

        res.status(200).json({
            sucess: true,
            customerData: result.recordset
        });

    }
    catch (error) {
        console.log('Error', error);
        res.status(500).json({
            sucess: false,
            message: "Server error, try again",
            error: error.message
        });
    }

});



//11.View for Product with Max Revenue which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/productmaxrevenueView", authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query("Select top 1 P.Product_ID,P.Product_Name,P.Product_Price, P.Product_Image ,ISNULL(SUM(OD.OrderDetails_Quantity), 0) Total_Quantity_Sold,ISNULL(SUM(OD.OrderDetails_Quantity), 0) * P.Product_Price  Total_Revenue From ProductDetail P Left join OrderDetails OD on P.Product_ID = OD.Product_ID Group By P.Product_ID, P.Product_Name, P.Product_Price,P.Product_Image Order By Total_Revenue DESC");
        console.log(result);

        res.status(200).json({
            sucess: true,
            customerData: result.recordset
        });

    }
    catch (error) {
        console.log('Error', error);
        res.status(500).json({
            sucess: false,
            message: "Server error, try again",
            error: error.message
        });
    }

});


//12. View for Minimum revenue product which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/productminrevenueView", authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query("Select top 1 P.Product_ID, P.Product_Name,P.Product_Price,P.Product_Image, ISNULL(SUM(OD.OrderDetails_Quantity), 0)  Total_Quantity_Sold,ISNULL(SUM(OD.OrderDetails_Quantity), 0) * P.Product_Price  Total_Revenue From ProductDetail P Left join OrderDetails OD on P.Product_ID = OD.Product_ID Group By P.Product_ID, P.Product_Name, P.Product_Price, P.Product_Image Order By Total_Revenue ASC");
        console.log(result);

        res.status(200).json({
            sucess: true,
            customerData: result.recordset
        });

    }
    catch (error) {
        console.log('Error', error);
        res.status(500).json({
            sucess: false,
            message: "Server error, try again",
            error: error.message
        });
    }

});
//13.  View for Top 5 customers with most spending which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/top5customersbyspendingView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("Select top 5 C.Customer_ID, C.Customer_Name,ISNULL(SUM(OD.OrderDetails_Quantity * P.Product_Price), 0)  Total_Spending From Customer C Join Orders O on C.Customer_ID = O.Customer_ID Join OrderDetails OD on O.Order_ID = OD.OrderDetails_ID Join ProductDetail P ON OD.Product_ID = P.Product_ID Group By C.Customer_ID, C.Customer_Name Order By Total_Spending DESC");
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

//14. Monthly Revenue View which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/monthlyrevenueView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("Select YEAR(O.OrderDate)  Revenue_Year,MONTH(O.OrderDate)  Revenue_Month,ISNULL(SUM(OD.OrderDetails_Quantity * P.Product_Price), 0)  Total_Revenue From Orders O Join OrderDetails OD on O.Order_ID = OD.OrderDetails_ID Join ProductDetail P on OD.Product_ID = P.Product_ID Group By YEAR(O.OrderDate), MONTH(O.OrderDate)");
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


//15. View for Category With Max Products Sold which ONLY THE ADMIN HAS ACCESS TO

app.get("/api/categorywithmaxproductssoldView",authenticateUser, authorizeRole("admin"),async(req,res)=>{
    try{
      const pool=await poolPromise;
      
      const result=await pool.request().query("");
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


//16. view for Seeing All the Pending Orders(Ongoing Orders)
app.get("/api/ongoingOrders", authenticateUser, authorizeRole("admin"), async (req, res) => {
    try {
      const pool = await poolPromise;
      
      // Fetching ongoing orders (pending status)
      const result = await pool.request().query(`
        SELECT O.Order_ID, O.Customer_ID, O.OrderDate, O.OrderStatus, O.TotalPrice,
               OD.OrderDetails_ID, OD.Product_ID, OD.OrderDetails_Quantity, OD.OrderDetails_Price
        FROM Orders O
        JOIN OrderDetails OD ON O.Order_ID = OD.Orders_ID
        WHERE O.OrderStatus = 'P';
      `);
  
      console.log(result);
  
      res.status(200).json({
        success: true,
        ongoingOrders: result.recordset
      });
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({
        success: false,
        message: "Server error, try again",
        error: error.message
      });
    }
  });


const PORT = 5000;


const server=app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});






