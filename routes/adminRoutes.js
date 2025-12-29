import { Router } from "express";
import {
  adminAddProductPage,
  adminDashboardPage,
  adminLoginPage,
  adminLogout,
  adminOrderDetailsPage,
  adminOrdersListPage,
  adminProductlistPage,
  blockUnblockUser,
  updateOrderStatus,
  usersListPage,
} from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminAuth.js";
import {
  createProduct,
  deleteProduct,
  editProductDetails,
  editProductDetailsPage,
} from "../controllers/productController.js";
import { uploadFiles } from "../middleware/uploadMiddileware.js";

const adminRoutes = Router({ mergeParams: true });

adminRoutes.get("/", adminLoginPage);

adminRoutes.post("/login", adminLogin);

adminRoutes.get("/dashboard", adminDashboardPage);

adminRoutes.get("/add-product", adminAddProductPage);

adminRoutes.post(
  "/add-product",
  uploadFiles("userAssets/uploads", "fields", null, null, [
    { name: "thumbnail", maxCount: 1 },
    { name: "productImages", maxCount: 3 },
  ]),
  createProduct
);

adminRoutes.get("/products-list", adminProductlistPage);

adminRoutes.get("/product/edit/:id", editProductDetailsPage);

adminRoutes.post("/product-edit/:id", editProductDetails);

adminRoutes.post("/product/:id/delete", deleteProduct);

adminRoutes.get("/orders-list", adminOrdersListPage);

adminRoutes.get("/update-order-status/:id/:status", updateOrderStatus);

adminRoutes.get("/orders/:id", adminOrderDetailsPage);

adminRoutes.get("/users-list", usersListPage);

adminRoutes.post("/block-user/:id", blockUnblockUser);

adminRoutes.get("/logout", adminLogout);

export default adminRoutes;
