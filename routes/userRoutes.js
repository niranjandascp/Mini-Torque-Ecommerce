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
  removeFromWishlist,
  signUpPage,
  updateUserDetails,
  wishlistPage,
} from "../controllers/userController.js";
import { logIn, logoutUser, signUp } from "../controllers/userAuth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { redirectIfLoggedIn } from "../middleware/redirectIfLoggedIn.js";
import { noCache } from "../middleware/noCache.js";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage);

userRoutes.get("/login", loginPage);

userRoutes.get("/signup", noCache, redirectIfLoggedIn, signUpPage);

userRoutes.post("/create-user", noCache, redirectIfLoggedIn, signUp);

userRoutes.post("/login-user", logIn);

userRoutes.get("/logout", logoutUser);

userRoutes.get("/account-details", requireAuth, accountDetailsPage);

userRoutes.post("/account-details", requireAuth, updateUserDetails);

userRoutes.get("/product/view", productViewPage);

userRoutes.get("/products", productListingPage);

userRoutes.get("/cart", requireAuth, cartPage);

userRoutes.post("/add-to-cart", requireAuth, addToCart);

userRoutes.get("/cart/clear", clearCart);

userRoutes.get("/cart/remove/:productId", removeFromCart);

userRoutes.get("/checkout", checkoutPage);

userRoutes.post("/create-address", createAddress);

userRoutes.post("/place-order", placeOrder);

userRoutes.get("/order-success", orderSuccess);

userRoutes.get("/order-history", requireAuth, getOrderHistory);

userRoutes.get("/wishlist", requireAuth, wishlistPage);

userRoutes.post("/wishlist/add", requireAuth, addToWishlist);

userRoutes.get("/wishlist/remove/:productId", requireAuth, removeFromWishlist);
export default userRoutes;
