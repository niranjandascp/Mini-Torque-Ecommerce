import express from "express";
import { landingPage } from "../controllers/userController.js";

const userRoutes = express.Router({ mergeParams: true });

userRoutes.get("/", landingPage);

export default userRoutes;
