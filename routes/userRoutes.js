import express from "express";
import { landingPage, loginPage, signUpPage } from "../controllers/userController.js";
import { signUp } from "../controllers/userAuth.js";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage);

userRoutes.get("/login", loginPage);

userRoutes.get("/signup", signUpPage);

userRoutes.post("/create-user", signUp);

export default userRoutes;
