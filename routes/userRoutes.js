import express from "express";
import {
  accountDetailsPage,
  addToCart,
  addToWishlist,
  cartPage,
  checkoutPage,
  clearCart,
  createAddress,
  getOrderHistory,
  landingPage,
  loginPage,
  orderSuccess,
  placeOrder,
  productListingPage,
  productViewPage,
  removeFromCart,
  signUpPage,
  updateUserDetails,
  wishlistPage,
} from "../controllers/userController.js";
import { logIn, logoutUser, signUp } from "../controllers/userAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage);

userRoutes.get("/login", loginPage);

userRoutes.get("/signup", signUpPage);

userRoutes.post("/create-user", signUp);

userRoutes.post("/login-user", logIn);

userRoutes.get("/logout", logoutUser);

userRoutes.get("/account-details", accountDetailsPage);

userRoutes.post("/account-details", updateUserDetails);

userRoutes.get("/product/view", productViewPage);

userRoutes.get("/products", productListingPage);

userRoutes.get("/cart", cartPage);

userRoutes.post("/add-to-cart", addToCart);

userRoutes.get("/cart/clear", clearCart);

userRoutes.get("/cart/remove/:productId", removeFromCart);

userRoutes.get("/checkout", checkoutPage);

userRoutes.post("/create-address", createAddress);

userRoutes.post("/place-order", placeOrder);

userRoutes.get("/order-success", orderSuccess);

userRoutes.get("/order-history", requireAuth, getOrderHistory);

userRoutes.get("/wishlist", wishlistPage);

userRoutes.post("/shop-wishlist.html", addToWishlist);

export default userRoutes;
