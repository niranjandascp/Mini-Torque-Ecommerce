
import { bannerData } from "../data/index.js";
import { brandData } from "../data/index.js";
import { getProductsData } from "./productController.js";

export const landingPage = async (req, res) => {
    console.log("🚀 landingPage function called")
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

export const accountDetailsPage = (req, res) => {
  try {
    res.render("user/accountDetailsPage", {
      title: "Account Details - Mini Torque",
    });
  } catch (error) {
    console.error("❌ Account Details page error:", error);
    res.status(500).send("Error loading account details page");
  }
};

export const productsListingPage = async (req, res) => {
  try {
    const products = await getProductsData({ sort: "latest" });
    res.render("user/productsListingPage", {
      title: "Products - Mini Torque",
      products: products,
    });
  } catch (error) {
    console.error("❌ Products Listing page error:", error);
    res.status(500).send("Error loading products listing page");
  }
};
