create database FlashMart
Go
use FlashMart

--1. CUSTOMER TABLE

Create Table Customer  --Used to store Customer Details
( 
Customer_ID int IDENTITY(1,1) primary key,
Customer_Name nvarchar(30) not null,
Customer_Email nvarchar(30) unique not null,  --the customer email should be provided for the login and must be unique since user will login on basis of that
Customer_PhoneNo nvarchar(20) not null CHECK (Customer_PhoneNo LIKE '03__-%' AND LEN(Customer_PhoneNo) = 12 ),  --phone no can be shared by more than one user
Customer_Address nvarchar(30) not null CHECK (Customer_Address LIKE '%Lahore%' AND Customer_Address LIKE '%Pakistan%' ), -- Since our service works in Lahore, Pakistan.
Customer_Password nvarchar(255) not null --stores the hashed password
)


ALTER TABLE Customer ADD CONSTRAINT CHECK_EMAIL_FORMAT_CUSTOMER CHECK ( --checks for the email
   
        Customer_Email LIKE '%@%.%'    
        AND Customer_Email NOT LIKE '@%' 
        AND Customer_Email NOT LIKE '%@' 
        AND LEN(Customer_Email) >= 10     
   
)


--2.SUPPLIER DETAILS TABLE

Create Table SupplierDetails --Used to keep the info of the Supplier of each category
(
Supplier_ID int IDENTITY(1,1) primary key,
Supplier_Name nvarchar(30) not null,
Supplier_PhoneNo nvarchar(20) not null unique, --Phone number will be unique for each supplier
Supplier_Address nvarchar(30) not null , --Address of supplier cannot be null
)

--3. CATEGORIES TABLE

Create Table Category --Used to store the Categories i.e Grocery,Dairy Products, Spices & Dressings,etc
( 
Category_ID int IDENTITY(1,1) primary key,
Supplier_ID int not null,
Category_Name nvarchar(30) not null,
Category_Description nvarchar (30) not null,
Category_Image nvarchar(255) not null, 

foreign key(Supplier_ID) references SupplierDetails on update cascade on delete cascade, -- if our supplier is updated then the category should also be updated and if supplier is deleted then the category should also be deleted 
)

--4.PRODUCT DETAILS TABLE

Create Table ProductDetail --Used to store indivitual details of the Products of different Categories
(
Product_ID int IDENTITY(1,1) primary key,
Category_ID int not null,
Product_Name nvarchar(30) not null,
Product_Price decimal(10,2) not null,
Product_Quantity int not null,
Product_ExpiryDate date not null,
Product_Image nvarchar(255) not null,

foreign key(Category_ID) references Category(Category_ID) on update cascade on delete no action,  --category should not be deleted if it has products
)

-- Check for Product expiry date should be greater than current date
ALTER TABLE ProductDetail ADD CONSTRAINT CHECK_EXPIRY_DATE CHECK (Product_ExpiryDate >= CAST(GETDATE() as DATE))

CREATE TRIGGER trg_RestockProduct
ON ProductDetail
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE pd
    SET pd.Product_Quantity = 100
    FROM ProductDetail pd
    JOIN inserted i ON pd.Product_ID = i.Product_ID
    WHERE i.Product_Quantity = 0
END


--5. CART DETAILS TABLE

Create Table Cart --Mantains what User adds to the cart
(
 Cart_ID int not null,
 Customer_ID int not null,
 Product_ID int not null,
 Quantity int default 1 not null, --initially value will be 1

 primary key(Customer_ID,Product_ID),
 foreign key(Customer_ID) references Customer(Customer_ID) on update cascade on delete cascade, --if the customer is deleted then the cart should also be deleted 
 foreign key(Product_ID) references ProductDetail(Product_ID) on update no action on delete cascade, --restrict from updating a product if it is placed in someones cart , if the product runs out of stock then delete it from someones cart too

)

-- Trigger to check stock availability and decrement stock when product is added to cart
CREATE TRIGGER CheckStockAndDecrementOnCartAdd
ON Cart
AFTER INSERT
AS
BEGIN
    -- Declare variables to store Product_ID, Quantity, and AvailableStock
    DECLARE @ProductID INT, @Quantity INT, @AvailableStock INT;

    -- Declare a cursor to iterate through all the rows in the inserted pseudo-table
    DECLARE CartCursor CURSOR FOR
    SELECT Product_ID, Quantity FROM inserted

    OPEN CartCursor;

    -- Fetch the first row
    FETCH NEXT FROM CartCursor INTO @ProductID, @Quantity;

    -- Loop through each inserted row
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Check the available stock in ProductDetail for the specified product
        SELECT @AvailableStock = Product_Quantity
        FROM ProductDetail
        WHERE Product_ID = @ProductID;

        -- If the available stock is sufficient, update the stock
        IF @AvailableStock >= @Quantity
        BEGIN
            -- Decrease the stock in ProductDetail
            UPDATE ProductDetail
            SET Product_Quantity = Product_Quantity - @Quantity
            WHERE Product_ID = @ProductID;
        END
        ELSE
        BEGIN
            -- If the stock is insufficient, raise an error or handle it as needed
            RAISERROR('Insufficient stock for the product', 16, 1)
            -- Optionally, you could delete the cart item or take other actions
            ROLLBACK TRANSACTION  -- Rollback the entire transaction
            RETURN
        END

        -- Fetch the next row
        FETCH NEXT FROM CartCursor INTO @ProductID, @Quantity
    END

    -- Close and deallocate the cursor
    CLOSE CartCursor
    DEALLOCATE CartCursor
END




--Once the User checks out, a new record is created in the Orders Table and Cart Items move to the OrderDetail and the Cart is cleared

--6.ORDER TABLE

Create Table Orders --Mantains a list of all the Orders placed
(
 Order_ID int IDENTITY(1,1) primary key,
 Customer_ID int not null,
 OrderDate date not null CHECK (YEAR(OrderDate) = YEAR(GETDATE())), --checks for correct date format date(1-31), month(1-12), year(current year), since sql does it automatically except the current year, so adding those checks
 OrderStatus char not null default 'P' check(OrderStatus='P' OR OrderStatus='D' OR OrderStatus='C'), --P for Pending and D for Delivered and C for Cancelled
 TotalPrice decimal(10,2) not null, --calculate the bill then add the tax and delivery charges too

 foreign key(Customer_ID) references Customer (Customer_ID) on update cascade on delete cascade, --if customer is deleted the order should also be deleted
)

--After Order is Delivered we can change status to Delivered and add it to Order History Table

--7.ORDERDETAILS Table

Create Table OrderDetails --Mantains details of each order placed 
(
OrderDetails_ID int IDENTITY(1,1) ,
Orders_ID int not null,
Product_ID int not null,
OrderDetails_Quantity int not null,
OrderDetails_Price decimal(10,2) not null,

primary key (Orders_ID,Product_ID),
foreign key(Orders_ID) references Orders(Order_ID) on update cascade on delete cascade, --if our order is deleted then all details of it also to be deleted
foreign key(Product_ID) references ProductDetail(Product_ID) on update no action on delete cascade, --restrict from updating a product if it is ordered by someone meanwhile, if the product runs out of stock then delete it from someones order too
)


CREATE TRIGGER InsertOrderDetailsFromCart
ON Orders
AFTER INSERT
AS
BEGIN
    DECLARE @OrderID INT, @CustomerID INT;

    -- Get the newly inserted Order_ID and Customer_ID
    SELECT TOP 1 
        @OrderID = Order_ID, 
        @CustomerID = Customer_ID 
    FROM inserted

    -- Insert matching cart items into OrderDetails
    INSERT INTO OrderDetails (Orders_ID, Product_ID, OrderDetails_Quantity, OrderDetails_Price)
    SELECT 
        @OrderID,
        c.Product_ID,
        c.Quantity,
        pd.Product_Price * c.Quantity
    FROM Cart c
    JOIN ProductDetail pd ON c.Product_ID = pd.Product_ID
    WHERE c.Customer_ID = @CustomerID
END


--8. PAYMENTS TABLE

Create Table Payments --Stores the details of the Payment 
(
 Payments_ID int IDENTITY(1,1) primary key,
 Order_ID int not null,
 PaymentMethod nvarchar(10) not null default 'COD' check (PaymentMethod='COD' OR PaymentMethod='Online'),
 PaymentStatus char not null check (PaymentStatus='S' OR PaymentStatus='P' OR PaymentStatus='F'), --S for Successful, P for Pending,F for Failed
 Transaction_ID nvarchar(20) default null, --for online payments a transaction id is generated
 foreign key (Order_ID) references Orders(Order_ID) on update cascade on delete cascade, --if order is updated then the payment should be updated and if order is deleted then the payment should also be deleted
)

CREATE TRIGGER trg_InsertPayment
ON Orders
AFTER INSERT
AS
BEGIN
    INSERT INTO Payments (Order_ID)
    SELECT 
        i.Order_ID,
		'COD',
		'P'
    FROM inserted i
END


--For COD, when the order is delivered status updates to Successful
--For Online Payment, Payment is processed before order confirmation (If sucessful status is updated to Successful and a transaction id is stored otherwise status is set to failed)


--9.DELIVERY DETAILS TABLE

Create Table DeliveryDetails  --Used to keep the info of the Delivery Person Details and Estimated Delivery Time
(
 Delivery_ID int IDENTITY(1,1) primary key,
 Order_ID int not null,
 Delivery_Status nvarchar(30) default 'Preparing your order' check(Delivery_Status='Preparing your order' OR Delivery_Status='Rider is on the way' OR Delivery_Status='Order Delivered' OR Delivery_Status='Delivery Canceled'),
 Estimated_Delivery time not null,

 foreign key (Order_ID) references Orders(Order_ID) on update cascade on delete cascade, --if the order is updated or deleted it should be updated or deleted from delivery details as well
)

--10. WISHLIST TABLE

Create Table Wishlist
(
WishList_ID int not null,
Customer_ID int not null,
Product_ID int not null,

primary key (Customer_ID, Product_ID),
foreign key(Customer_ID) references Customer(Customer_ID) on update cascade on delete cascade, --if customer is updated or deleted update or delete their wishlist
foreign key(Product_ID) references ProductDetail(Product_ID) on update cascade on delete cascade, --if product is updated or deleted update or delete their wishlist
)

--11.REVIEWS TABLE

Create Table Reviews
(
 Reviews_ID int IDENTITY(1,1) primary key,
 Customer_ID int not null,
 Product_ID int not null,
 Rating int not null CHECK (Rating BETWEEN 1 AND 5),
 Comment nvarchar(100) default NULL ,-- can be null
 ReviewDate date not null,

 foreign key(Customer_ID) references Customer(Customer_ID) on update cascade on delete cascade, --if customer is updated or deleted the review should also be updated or deleted
 foreign key(Product_ID) references ProductDetail(Product_ID) on update cascade on delete cascade, --if product is updated or deleted the review should also be updated or deleted
)

ALTER TABLE Reviews ADD CONSTRAINT CHECK_REVIEW_DATE CHECK (YEAR(ReviewDate) = YEAR(GETDATE()))

--12. ADMIN TABLE

CREATE TABLE Admin (
    Admin_ID int IDENTITY(1,1) PRIMARY KEY,
    Admin_Name NVARCHAR(50) NOT NULL,
	Admin_PhoneNo nvarchar(50) not null  check(Admin_PhoneNo LIKE '03__-%' AND LEN(Admin_PhoneNo) = 12 ),
    Admin_Email NVARCHAR(100) UNIQUE NOT NULL, --Email will be unique for every admin
    Admin_Password nvarchar(255) NOT NULL, --Stores the hashed password
);



ALTER TABLE Admin ADD CONSTRAINT CHECK_EMAIL_FORMAT_ADMIN CHECK ( --checks for the email
    
       Admin_Email LIKE '%@%.%'    
       AND Admin_Email NOT LIKE '@%' 
       AND Admin_Email NOT LIKE '%@' 
       AND LEN(Admin_Email) >= 10     
   
)




-- Table Population 
--Insert data into Customer Table

INSERT INTO Customer (Customer_Name, Customer_Email, Customer_PhoneNo, Customer_Address,Customer_Password)
VALUES ('Ali', 'ali@gmail.com', '0301-2233445', 'Lahore, Pakistan','ali123'),
('Sara', 'sara@hotmail.com', '0321-5566778', 'Lahore, Pakistan','sara123'),
('Usman', 'usman@yahoo.com', '0333-1122334', 'Lahore, Pakistan','usman123'),
('Ayesha', 'ayesha@gmail.com', '0302-3344556', 'Lahore, Pakistan','ayesha123'),
('Bilal', 'bilal@gmail.com', '0302-3344759', 'Lahore, Pakistan','bilal123'),
('Nida', 'nida@gmail.com', '0311-9988776', 'Lahore, Pakistan','nida123'),
('Hamza', 'hamza@gmail.com', '0308-7766554', 'Lahore, Pakistan','hamza123'),
('Zainab','zainab@gmail.com','0329-4455667', 'Lahore, Pakistan','zainab123'),
('Tariq', 'tariq@outlook.com', '0344-2233445', 'Lahore, Pakistan','tariq123');


select * from Customer

--Insert data into Admin Table

INSERT INTO ADMIN( Admin_Name,Admin_PhoneNo,Admin_Email,Admin_Password)
VALUES('Nihaal','0300-9419440','nihaal@gmail.com','nihaal123'), 
('Lumia','0320-1415806','lumi@gmail.com','lumia123'), 
('Nayab','0311-5558877','nayab@gmail.com','nayab123')

select * from Admin


--Insert data into Supplier Details

INSERT INTO SupplierDetails (Supplier_Name, Supplier_PhoneNo, Supplier_Address)
VALUES
('Fresh Grocers', '0312-1112233', 'Johar Town, Lahore'),
('Dairy Best', '0305-2223344', 'Model Town, Lahore'),
('Spice Hub', '0321-5556677', 'Gulberg, Lahore'),
('Bakers Delight', '0334-7788990', 'DHA, Lahore'),
('Organic Farms', '0345-6677889', 'Wapda Town, Lahore'),
('Meat Express', '0309-8899776', 'Cantt, Lahore'),
('Fruity Picks', '0311-9988776', 'Shadman, Lahore'),
('Household Needs', '0308-7766554', 'Garden Town, Lahore'),
('Tech Solutions', '0329-4455667', 'Gulshan Ravi, Lahore'),
('Kitchen Essentials', '0344-2233445', 'Township, Lahore');

select * from SupplierDetails


--Insert data into Category Table 

INSERT INTO Category (Supplier_ID, Category_Name, Category_Description, Category_Image)
VALUES
(1, 'Grocery', 'Daily grocery items', 'grocery.jpg'),
(2, 'Dairy', 'Milk, Cheese, Butter', 'dairy.jpg'),
(3, 'Spices', 'Cooking Spices', 'spices.jpg'),
(4, 'Bakery', 'Fresh Bakery Items', 'bakery.jpg'),
(5, 'Organic', 'Organic Vegetables', 'organic.jpg'),
(6, 'Meat', 'Fresh Meat & Poultry', 'meat.jpg'),
(7, 'Fruits', 'Seasonal Fruits', 'fruits.jpg'),
(8, 'Household', 'Cleaning & Supplies', 'household.jpg'),
(9, 'Electronics', 'Kitchen Appliances', 'electronics.jpg'),
(10, 'Utensils', 'Cooking Utensils', 'utensils.jpg');


select * from Category

--Insert data into Product table

INSERT INTO ProductDetail ( Category_ID, Product_Name, Product_Price, Product_Quantity, Product_ExpiryDate, Product_Image)
VALUES
(1, 'Rice', 120.00, 100, '2026-12-31', 'rice.jpg'),
(2, 'Milk', 80.00, 100, '2025-06-15', 'milk.jpg'),
(3, 'Salt', 50.00, 80, '2027-01-10', 'salt.jpg'),
(4, 'Bread', 40.00, 80, '2025-12-05', 'bread.jpg'),
(5, 'Carrots', 30.00, 60, '2025-10-10', 'carrots.jpg'),
(6, 'Chicken', 500.00, 40, '2025-11-01', 'chicken.jpg'),
(7, 'Apples', 250.00, 300, '2025-10-20', 'apples.jpg'),
(8, 'Detergent', 350.00, 100, '2026-09-30', 'detergent.jpg'),
(9, 'Blender', 3000.00, 70, '2026-12-31', 'blender.jpg'),
(10, 'Non-Stick Pan', 1500.00, 70, '2026-08-15', 'pan.jpg');

select * from ProductDetail


--Insert data into Cart Table

INSERT INTO Cart (Cart_ID, Customer_ID, Product_ID, Quantity)
VALUES (10, 3, 6, 34),
(10, 3, 2, 5),
(10, 3, 5, 4),
(10, 3, 8, 2),
(10, 3, 10, 2),
(10, 3, 9, 1),
(1, 1, 2, 2),
(1, 1, 3, 5),
(1, 1, 5, 12),
(2, 2, 5, 3),
(3, 3, 1, 1),
(3, 3, 10,2),
(4, 4, 7, 2),
(4, 4, 6, 4),
(5, 5, 6, 1),
(6, 6, 3, 4),
(7, 7, 8, 2),
(7, 7, 4, 1),
(7, 7, 9, 1),
(7, 7, 3, 3),
(8, 8, 9, 1),
(9, 9, 10, 1)


select * from cart

--Insert data into Order Table 

INSERT INTO Orders ( Customer_ID, OrderDate, OrderStatus, TotalPrice)
VALUES (3, '2025-04-16', 'C', 120.00),
(3, '2025-01-19', 'D', 400.00),
( 1, '2025-03-01', 'P', 500.00),
( 2, '2025-03-02', 'D', 800.00),
(3, '2025-03-03', 'C', 1200.00),
(4, '2025-03-04', 'P', 300.00),
(5, '2025-03-05', 'D', 450.00),
( 6, '2025-03-06', 'P', 600.00),
(7, '2025-03-07', 'C', 750.00),
(8, '2025-03-08', 'P', 900.00),
(9, '2025-03-09', 'D', 2000.00),
(1, '2025-04-15', 'D', '1200.00')



select* from Orders

-- Insert data into OrderDetails table

INSERT INTO OrderDetails ( Orders_ID, Product_ID, OrderDetails_Quantity, OrderDetails_Price)
VALUES (11, 2, 1, 80),
(11, 4, 1, 50),
(12, 3, 4, 200),
(10, 4, 3, 120),
(10, 8, 1, 350),
(10, 6 , 1, 500),
(10, 3, 4, 200),
(10, 5, 1, 30),
(1, 2, 2, 160.00),
(2, 5, 3, 90.00),
( 3, 1, 1, 120.00),
( 4, 7, 2, 500.00),
(5, 6, 1, 500.00),
( 6, 3, 4, 200.00),
(7, 8, 2, 700.00),
( 8, 9, 1, 3000.00),
(9, 10, 1, 1500.00);


select * from OrderDetails 


--Insert data into Payments

INSERT INTO Payments (Order_ID, PaymentMethod, PaymentStatus, Transaction_ID)
VALUES
(1, 'COD', 'P', NULL),
(2, 'Online', 'S', 'TXN001'),
(3, 'COD', 'F', NULL),
(4, 'Online', 'S', 'TXN002'),
(5, 'COD', 'P', NULL),
(6, 'Online', 'S', 'TXN003'),
(7, 'COD', 'F', NULL),
(8, 'Online', 'S', 'TXN004'),
(9, 'COD', 'P', NULL);



--Insert data into Wishlist 

INSERT INTO Wishlist ( WishList_ID, Customer_ID, Product_ID)
VALUES (1, 2, 1),
(1, 2, 2),
(1, 2, 3),
(1, 2, 10),
(1, 2, 4),
(2, 3, 4),
(2, 3, 5),
(3, 4, 6),
(3, 4, 7),
(4, 5, 8),
(4, 5, 9),
(5, 6, 10),
(5, 6, 1),
(6, 7, 2),
(6, 7, 3),
(7, 8, 4),
(7, 8, 5),
(8, 9, 6),
(8, 9, 7)


--Insert data into Reviews

INSERT INTO Reviews ( Customer_ID, Product_ID, Rating, Comment, ReviewDate)
VALUES
(2, 1, 5, 'Excellent product!', '2025-03-20'),
(2, 3, 4, 'Decent quality,worth the price', '2025-03-19'),
(3, 2, 4, 'Very good, but packaging could be better.', '2025-03-18'),
(3, 5, 3, 'Satisfactory but could be improved.', '2025-03-17'),
(4, 3, 3, 'Average quality.', '2025-03-16'),
(4, 7, 5, 'Perfect for my needs!', '2025-03-15'),
(5, 4, 5, 'Highly recommend!', '2025-03-14'),
(5, 6, 2, 'Not what I expected.', '2025-03-13'),
(6, 5, 2, 'Not as expected.', '2025-03-12'),
(6, 8, 4, 'Surprisingly good!', '2025-03-11'),
(7, 6, 4, 'Good value for money.', '2025-03-10'),
(7, 9, 5, 'Superb quality, very happy!', '2025-03-09'),
(8, 7, 5, 'Absolutely loved it!', '2025-03-08'),
(8, 10, 3, 'Average experience.', '2025-03-07'),
(9, 8, 3, 'It was okay.', '2025-03-06'),
(9, 2, 4, 'Would recommend!', '2025-03-05');


--Insert data into Delivery Details

INSERT INTO DeliveryDetails ( Order_ID, Delivery_Status, Estimated_Delivery)
VALUES
    (1, 'Preparing your order', '2025-03-01 13:00:00'),
    (2, 'Order Delivered', '2025-03-02 14:30:00'),
    (3, 'Order Delivered', '2025-03-03 15:00:00'),
    (4, 'Preparing your order', '2025-03-04 12:45:00'),
    (5, 'Order Delivered', '2025-03-05 13:20:00'),
    (6, 'Preparing your order', '2025-03-06 14:10:00'),
    (7, 'Order Delivered', '2025-03-07 16:30:00'),
    (8, 'Preparing your order', '2025-03-08 17:00:00'),
    (9, 'Order Delivered', '2025-03-09 18:15:00');

    



-- Retrieve all data from Customer table
SELECT * FROM Customer;

-- Retrieve all data from SupplierDetails table
SELECT * FROM SupplierDetails;

-- Retrieve all data from Category table
SELECT * FROM Category;

-- Retrieve all data from ProductDetail table
SELECT * FROM ProductDetail;

-- Retrieve all data from Cart table
SELECT * FROM Cart;

-- Retrieve all data from Orders table
SELECT * FROM Orders;


-- Retrieve all data from OrderDetails table
SELECT * FROM OrderDetails;

-- Retrieve all data from Payments table
SELECT * FROM Payments;

-- Retrieve all data from DeliveryDetails table
SELECT * FROM DeliveryDetails;

-- Retrieve all data from Wishlist table
SELECT * FROM Wishlist;

-- Retrieve all data from Reviews table
SELECT * FROM Reviews;


--Retrieve all data from Admin table
SELECT * FROM Admin
