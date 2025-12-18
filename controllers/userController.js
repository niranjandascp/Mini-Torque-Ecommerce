import jwt from "jsonwebtoken";
import connectDB from "../config/db.js";
import { bannerData } from "../data/index.js";
import { brandData } from "../data/index.js";
import { getProductsData } from "./productController.js";
import collection from "../config/collection.js";
import { ObjectId } from "mongodb";

export const landingPage = async (req, res) => {
  console.log("🚀 landingPage function called");
  try {
    let user = null;
    const token = req.cookies?.token;

    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.warn("⚠️ Invalid JWT:", err.message);
      }
    }

    const [featuredProducts, superCars, JDMCars, newArrivals] =
      await Promise.all([
        getProductsData({ sort: "random", limit: 12 }),
        getProductsData({ category: "Supercars", sort: "latest", limit: 10 }),
        getProductsData({ category: "JDM Cars", sort: "latest", limit: 10 }),
        getProductsData({ sort: "latest", limit: 15 }),
      ]);

    const getStockStatus = ({ stock }) => {
      if (stock > 20) return `🟢 Available (${stock})`;
      if (stock > 0) return `🟠 Hurry up! Only ${stock} left`;
      return `🔴 Currently unavailable`;
    };

    const withStockStatus = (products = []) =>
      products.map((product) => ({
        ...product,
        stockStatus: getStockStatus(product),
      }));

    res.render("user/homePage", {
      title: "Home - Mini Torque",
      user: user,
      featuredProducts: withStockStatus(featuredProducts),
      superCars: withStockStatus(superCars),
      JDMCars: withStockStatus(JDMCars),
      newArrivals: withStockStatus(newArrivals),
      bannerData: bannerData,
      brandData: brandData,
    });
  } catch (error) {
    console.error("❌ Landing page error:", error);
    res.status(500).send("Error loading home page");
  }
};

export const loginPage = (req, res) => {
  try {
    res.render("user/loginPage", {
      title: "Login - Mini Torque",
    });
  } catch (error) {
    console.error("❌ Login page error:", error);
    res.status(500).send("Error loading login page");
  }
};

export const signUpPage = (req, res) => {
  try {
    res.render("user/signUpPage", {
      title: "Sign Up - Mini Torque",
    });
  } catch (error) {
    console.error("❌ Sign Up page error:", error);
    res.status(500).send("Error loading sign up page");
  }
};

export const accountDetailsPage = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.redirect("/login");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId: decoded.id });

    if (!user) return res.redirect("/login");

    // ❌ remove password before sending
    delete user.password;
    console.log("user Data ><><><><>", user);

    res.render("user/accountDetailsPage", {
      title: "Account Details - Mini Torque",
      user,
    });
  } catch (error) {
    console.error("Account details error:", error);
    res.redirect("/login");
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const { name, phone, dname, email, password, npassword, cpassword } =
      req.body;
    const userId = req.loggedInUser.id;

    const db = await connectDB(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    console.log(">>>>>>>>user", user);

    if (!user) {
      return res.render("user/accountDetailsPage", {
        title: "Account Details",
        error: "User not found.",
      });
    }

    // ✅ Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.render("user/accountDetailsPage", {
        title: "Account Details",
        error: "Current password is incorrect.",
        user,
      });
    }

    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", isCurrentPasswordValid);

    // ✅ Handle new password (optional)
    let hashedPassword = user.password;
    if (npassword || cpassword) {
      if (npassword !== cpassword) {
        return res.render("user/accountDetailsPage", {
          title: "Account Details",
          error: "New password and confirm password do not match.",
          user,
        });
      }
      hashedPassword = await bcrypt.hash(npassword, 10);
    }

    // ✅ Update user details
    await db.collection(collection.USERS_COLLECTION).updateOne(
      { userId },
      {
        $set: { name, phone, dname, email, password: hashedPassword },
      }
    );

    const updatedUser = { ...user, name, phone, dname, email };
    res.render("user/accountDetailsPage", {
      title: "Account Details",
      success: "Account updated successfully!",
      user: updatedUser,
    });

    console.log("<><<<><><><><><><>Updated User Data:", updatedUser);
  } catch (err) {
    // console.error(err);
    res.render("user/accountDetailsPage", {
      title: "Account Details",
      error: "Something went wrong. Please try again later.",
      user: req.body,
    });
  }
};

export const productViewPage = async (req, res) => {
  try {
    console.log(req);

    const { id } = req.query;
    if (!id) return res.status(400).send("Product ID is required");

    const db = await connectDB();

    const productData = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id : new ObjectId(String(id)) });

      if (!productData) return res.status(404).send("Product not found");

    const getStockStatus = (stock) => {
      if (stock > 20) return `🟢 Available (${stock})`;
      if (stock > 0) return `🟠 Hurry up! Only ${stock} left`;
      return `🔴 Currently unavailable`;
    };

    // Main product stock status
    productData.stockStatus = getStockStatus(productData.stock);

    const relatedProducts = await getProductsData({
      sort: "random",
      category: productData.category,
      limit: 4,
    });

    // Related products stock status
    const updatedRelatedProducts = relatedProducts.map((product) => ({
      ...product,
      stockStatus: getStockStatus(product.stock),
    }));
    console.log("productData>>>", productData);
    console.log("updatedRelatedProducts >>>>", updatedRelatedProducts);


    res.render("user/productViewPage", {
      title: "Product View - Mini Torque",
      Product: productData,
      relatedProducts: updatedRelatedProducts,
    });
  } catch (error) {
    console.error("❌ Product View page error:", error);
    res.status(500).send("Error loading product view page");
  }
};

const getStockStatus = (product) => {
  const stock = parseInt(product.stock, 10); // ensure number

  if (stock > 20) {
    return `🟢 Available (${stock})`;
  } else if (stock > 0 && stock <= 20) {
    return `🟠 Hurry up! Only ${stock} left`;
  } else {
    return `🔴 Currently unavailable`;
  }
};

export const productListingPage = async (req, res) => {
  console.log(">>>>>>>product page fuction called");
  try {
    // Get logged-in user from JWT
    let user = null;
    const token = req.cookies?.token;

    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        user = null;
      }
    }

    // Fetch latest 20 products
    const products = await getProductsData({
      sort: "latest",
      limit: 20,
    });

    const productWithStock = products.map((product) => ({
      ...product,
      stockStatus: getStockStatus(product.stock), // product.stock is a STRING → handled below
    }));

    // Render the UI
    res.render("user/productListingPage", {
      title: "Products - Mini Torque",
      products: productWithStock, // HBS expects "products"
      user,
    });
  } catch (error) {
    console.error("❌ Error loading products page:", error);
    res.status(500).send("Error loading products page");
  }
};

export const wishlistPage = async (req, res) => {
  try {
    let user = null;
    const token = req.cookies?.token;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.warn("⚠️ Invalid JWT:", err.message);
      }
    }

    

    const db = await connectDB();
    const wishlistItems = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({ userId: user.id })
      .toArray();
    const wishlistWithStock = wishlistItems.map((product) => ({
      ...product,
      stockStatus: getStockStatus(product.stock),
    }));
    res.render("user/wishlistPage", {
      title: "Wishlist - Mini Torque",
      user,
      wishlist: wishlistWithStock,
    });
  } catch (error) {
    console.error("❌ Wishlist page error:", error);
    res.status(500).send("Error loading wishlist page");
  }
};