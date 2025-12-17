import express from "express";
import { accountDetailsPage, landingPage, loginPage, productsListingPage, signUpPage } from "../controllers/userController.js";
import { logIn, logoutUser, signUp } from "../controllers/userAuth.js";
import { use } from "react";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage);

userRoutes.get("/login", loginPage);

userRoutes.get("/signup", signUpPage);

userRoutes.post("/create-user", signUp);

userRoutes.post("/login-user", logIn);

userRoutes.get("/logout", logoutUser);

userRoutes.get("/account-details", accountDetailsPage);

userRoutes.get("/products", productsListingPage);

export default userRoutes;
