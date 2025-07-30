import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MainPage from "./MainPage";
import CustomerLogin from "./LoginCustomer";
import AdminLogin from "./LoginAdmin";
import CustomerSignup from "./SignupCustomer";


// CUSTOMER SPECIFIC PAGES
import Layout from './Layout';
import DashboardCustomer from "./DashboardCustomer";
import OrderHistory from "./customer/OrderHistory"; 
import UpdateProfileCustomer from "./customer/UpdateProfileCustomer";
import UpdatePasswordCustomer from "./customer/UpdatePasswordCustomer";
import ViewProducts from "./customer/Products";
import ViewReviews from "./customer/Review";
import ViewPendingOrders from "./customer/ViewPendingOrders"; 
import WishlistCustomer from "./customer/Wishlist";
import CartPage from "./customer/Cart";
import ForgetPasswordCustomer from "./customer/ForgetPassword"; 


// ADMIN SPECIFIC PAGES
import DashboardAdmin from "./DashboardAdmin";
import SalesReport from "./admin/SalesReportView";
import Suppliers from "./admin/supplierDetails";
import CustomersView from './admin/CustomersView';
import ProductsView from "./admin/ViewProducts"; 
import ViewCategories from "./admin/ViewCategories";
import ViewReviewsAdmin from "./admin/ViewAllReviews";
import UpdateAdminProfile from "./admin/UpdateAdminProfile";
import UpdatePasswordAdmin from "./admin/UpdatePasswordAdmin";
import Orders from "./admin/viewOrders";
import DeliveryStatus from "./admin/paymentstatus";
import ForgetPasswordAdmin from "./admin/ForgetAdminPassword";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainPage />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/signup-customer" element={<CustomerSignup />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/forget-password-customer" element={<ForgetPasswordCustomer />} />
        <Route path="/forget-admin-password" element={<ForgetPasswordAdmin />} />

        {/* Customer Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboardcustomer" element={<DashboardCustomer />} />
          <Route path="/products" element={<ViewProducts />} />
          <Route path="/reviews" element={<ViewReviews />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/update-profile" element={<UpdateProfileCustomer />} />
          <Route path="/change-password" element={<UpdatePasswordCustomer />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistCustomer />} />
          <Route path="/pending-orders" element={<ViewPendingOrders />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/dashboardadmin" element={<DashboardAdmin />} />
        <Route path="/admin/salesreport" element={<SalesReport />} />
        <Route path="/admin/suppliers" element={<Suppliers />} />
        <Route path="/admin/customers" element={<CustomersView />} />
        <Route path="/admin/products" element={<ProductsView />} />
        <Route path="/admin/categories" element={<ViewCategories />} />
        <Route path="/admin/reviews" element={<ViewReviewsAdmin />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/updateadminprofile" element={<UpdateAdminProfile />} />
        <Route path="/admin/updateadminpassword" element={<UpdatePasswordAdmin />} />
         <Route path="/admin/payments"element={<DeliveryStatus/>}/>     

      </Routes>
    </Router>
  );
}

export default App;