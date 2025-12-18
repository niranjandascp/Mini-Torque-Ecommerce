import express from "express";
import { accountDetailsPage, landingPage, loginPage, productListingPage, productViewPage, signUpPage, updateUserDetails, wishlistPage } from "../controllers/userController.js";
import { logIn, logoutUser, signUp } from "../controllers/userAuth.js";  

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

userRoutes.get("/wishlist", wishlistPage);

export default userRoutes;
