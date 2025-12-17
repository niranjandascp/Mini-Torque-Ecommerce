import connectDB from "../config/db.js";
import collection  from "../config/collection.js";
import bcrypt from "bcrypt";
import { v7 as uuidv7 } from "uuid";
import jwt from "jsonwebtoken";

export const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.render("user/signup", {
        title: "Signup - Mini Torque",
        error: "Name, email, and password are required.",
      });
    }

    const db = await connectDB(process.env.DATABASE);

    // Check already exists
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ email });

    if (user) {
      return res.render("user/signup", {
        title: "Signup - Mini Torque",
        error: "User already exists. Please login instead.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = uuidv7();

    // Insert user
    await db.collection(collection.USERS_COLLECTION).insertOne({
      userId,
      name,
      email,
      password: passwordHash,
      phone: "",
      avatar: "",
      addresses: [],
      orders: [],
      wishlist: [],
      cart: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isBlocked: false,
    });

    return res.redirect("/login");

    } catch (error) {
        console.error("❌ Sign Up page error:", error); 
        res.status(500).send("Error loading sign up page");
    }
};

// user logIn

export const logIn = async (req, res) => {
    try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.render("user/login", {
        title: "Login - Mini Torque",
        error: "Email and password are required.",
      });
    }

    const db = await connectDB(process.env.DATABASE);

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ email });

    if (!user) {
      return res.render("user/login", {
        title: "Login - Mini Torque",
        error: "User does not exist. Please sign up first.",
      });
    }

    // Blocked user check
    if (user.isBlocked) {
      return res.render("user/login", {
        title: "Login - Mini Torque",
        error: "Your account has been blocked. Please contact support.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("user/login", {
        title: "Login - Mini Torque",
        error: "Invalid password. Please try again.",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.userId, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    // Store token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.redirect("/");
    } catch (error) {
        console.error("❌ Login page error:", error); 
        res.status(500).send("Error loading login page");
    }  
};