import connectDB from "../config/db.js";
import collection  from "../config/collection.js";
import bcrypt from "bcrypt";
import { v7 as uuidv7 } from "uuid";

export const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.render("user/signup", {
        title: "Signup - Moonlight Reads",
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
        title: "Signup - Moonlight Reads",
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