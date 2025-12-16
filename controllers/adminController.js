import connectDB from "../config/db.js";
import collection from "../config/collection.js";
import { getAllProducts } from "./productController.js";

export const adminLoginPage = async (req, res) => {
  try {
    res.render("admin/adminLogin", { layout: "admin", title: "Admin Login" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong loading the dashboard.");
  }
};

export const adminDashboardPage = async (req, res) => {
  try {
    // Render dashboard
    res.render("admin/dashboard", {
      layout: "admin",
      title: "Admin Dashboard",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong loading the dashboard.");
  }
};

export const adminAddProductPage = async (req, res) => {
  console.log("Admin AddProduct route working 🚀");

  try {
    res.render("admin/addProduct", {
      layout: "admin",
      title: "Add Product - Admin",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong loading the add product page.");
  }
};

export const adminProductlistPage = async (req, res) => {
  console.log("Admin Product List route working 🚀");

  try {
    const db = await connectDB();

    const allProductsData = await getAllProducts();
    // console.log(allProductsData)

    res.render("admin/productList", {
      layout: "admin",
      title: "Product List - Admin",
      products: allProductsData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong loading the product list page.");
  }
};
