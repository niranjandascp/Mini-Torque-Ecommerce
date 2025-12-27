import jwt from "jsonwebtoken";
import connectDB from "../config/db.js";
import { bannerData } from "../data/index.js";
import { brandData } from "../data/index.js";
import { getProductsData } from "./productController.js";
import collection from "../config/collection.js";
import { ObjectId } from "mongodb";
import { v7 as uuidv7 } from "uuid";

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
    // console.log("user Data ><><><><>", user);

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

    // console.log(">>>>>>>>user", user);

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

    // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", isCurrentPasswordValid);

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

    // console.log("<><<<><><><><><><>Updated User Data:", updatedUser);
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
  // console.log('product view page called >>>>>>>>')
  try {
    // console.log(req);

    const { id } = req.query;
    if (!id) return res.status(400).send("Product ID is required");

    const db = await connectDB();

    const productData = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(String(id)) });

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
    // console.log("productData>>>", productData);
    // console.log("updatedRelatedProducts >>>>", updatedRelatedProducts);

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
  // console.log(">>>>>>>product page fuction called");
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

export const cartPage = async (req, res) => {
  // console.log(">>>>>>>>>>cartpage");
  try {
    const userId = req.loggedInUser?.id; // FIXED
    // console.log(">>>>userId",userId)
    const db = await connectDB();

    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });
    if (!user) return res.status(404).send("User not found"); // FIXED
    // console.log(">>>user",user)

    const userCart = user?.cart || [];
    // console.log(">>>>usercart",userCart)

    const subtotal = userCart.reduce((acc, item) => acc + item.total, 0);

    res.render("user/cartPage", {
      title: "Your Cart",
      userCart,
      subtotal,
    });
  } catch (error) {
    res.send("Something went wrong", error);
    console.log(error);
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.body;

    if (!userId) return res.redirect("/login");
    if (!productId) return res.status(400).send("Product ID required");

    const db = await connectDB();

    /* ---------------- FETCH PRODUCT ---------------- */
    const product = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ productId });

    if (!product) return res.status(404).send("Product not found");

    const stock = Number(product.stock);
    const price = Number(product.discountPrice ?? product.price);

    /* ---------------- CHECK CART ITEM ---------------- */
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne(
        { userId, "cart.productId": productId },
        { projection: { "cart.$": 1 } }
      );

    const currentQty = user?.cart?.[0]?.quantity || 0;

    if (currentQty + 1 > stock) {
      return res.redirect("/cart?error=out_of_stock");
    }

    /* ---------------- UPDATE CART ---------------- */
    if (currentQty > 0) {
      await db.collection(collection.USERS_COLLECTION).updateOne(
        { userId, "cart.productId": productId },
        {
          $inc: { "cart.$.quantity": 1 },
          $set: {
            "cart.$.total": (currentQty + 1) * price,
          },
        }
      );
    } else {
      await db.collection(collection.USERS_COLLECTION).updateOne(
        { userId },
        {
          $push: {
            cart: {
              productId: product.productId,
              productName: product.productName,
              price,
              quantity: 1,
              total: price,
              productImages: product.thumbnail || "/img/default.png",
              addedAt: new Date(),
            },
          },
        }
      );
    }

    res.redirect("/cart");
  } catch (error) {
    console.error("Add to cart error:", error);
    res.redirect("/cart");
  }
};

//clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectDB(process.env.DATABASE);

    // Clear the cart array
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $set: { cart: [] } });

    res.redirect("/cart"); // redirect back to landing page
  } catch (error) {
    // console.log("Error clearing cart:", error);
    res.status(500).send("Something went wrong while clearing the cart");
  }
};

//remove selected product from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { booksId } = req.params;

    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectDB(process.env.DATABASE);

    // Remove the item from the cart array
    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, { $pull: { cart: { booksId: booksId } } });

    res.redirect("/cart"); // Redirect back to landing page
  } catch (error) {
    // console.log("Error removing item from cart:", error);
    res.status(500).send("Something went wrong");
  }
};

export const checkoutPage = async (req, res) => {
  // console.log(">>>>called checkout function")
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) {
      return res.redirect("/login");
    }

    const db = await connectDB(process.env.DATABASE);
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    const userCart = user.cart || [];
    const addresses = user.addresses || []; // ✅ Get saved addresses

    // Calculate total
    const total = userCart.reduce((acc, item) => acc + item.total, 0);

    res.render("user/checkoutPage", {
      title: "CheckoutPage",
      userCart,
      total,
      addresses, // ✅ Pass to HBS
    });
  } catch (error) {
    // console.error(error);
    res.send("Something went wrong");
  }
};

/// checkout page addresss
export const createAddress = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;

    if (!userId) {
      return res.redirect("/login");
    }

    const { billingName, address, landmark, phone } = req.body;

    if (!billingName || !address || !phone) {
      // console.log("❌ Required fields missing");
      return res.status(400).send("All required fields must be filled");
    }

    const db = await connectDB(process.env.DATABASE);
    // console.log("✅ Database connected");

    // ✅ IMPORTANT: Match using userId instead of _id
    const result = await db.collection(collection.USERS_COLLECTION).updateOne(
      { userId: userId },
      {
        $push: {
          addresses: {
            billingName,
            address,
            landmark: landmark || "",
            phone,
            createdAt: new Date(),
          },
        },
      }
    );

    // console.log("Update Result:", {
    //   matched: result.matchedCount,
    //   modified: result.modifiedCount,
    // });

    if (result.modifiedCount === 0) {
      // console.log("⚠️ Address not added. Possible wrong userId match.");
      return res.status(500).send("Failed to add address");
    }

    // console.log("✅ Address added successfully. Redirecting...");
    res.redirect("/checkout");
  } catch (error) {
    // console.error("🔥 Error creating address:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const placeOrder = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    const db = await connectDB();
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    if (!user) return res.status(404).send("User not found");

    const userCart = user.cart || [];
    if (userCart.length === 0) return res.redirect("/cart");

    // Handle address
    let orderAddress;
    if (user.addresses?.length && req.body.selectedAddress !== undefined) {
      orderAddress = user.addresses[parseInt(req.body.selectedAddress)];
    } else if (req.body.billingName && req.body.address && req.body.phone) {
      orderAddress = {
        billingName: req.body.billingName,
        address: req.body.address,
        landmark: req.body.landmark || "",
        phone: req.body.phone,
        createdAt: new Date(),
      };
    } else {
      return res.status(400).send("Address details missing");
    }

    // Fetch all products in one query
    const productIds = userCart.map((item) => item.productId);
    const products = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({ productId: { $in: productIds } })
      .toArray();

    const productMap = new Map(products.map((p) => [p.productId, p]));

    // Stock check
    for (let item of userCart) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).send(`Product ${item.productName} not found`);
      }
      if (product.stock === undefined || product.stock < item.quantity) {
        return res.status(400).send(`Not enough stock for: ${item.name}`);
      }
    }

    // Bulk stock deduction
    const bulkOps = userCart.map((item) => ({
      updateOne: {
        filter: { productId: item.productId },
        update: { $inc: { stock: -item.quantity } },
      },
    }));

    await db.collection(collection.PRODUCTS_COLLECTION).bulkWrite(bulkOps);

    // Create order
    const order = {
      orderId: uuidv7(),
      userId,
      userCart,
      address: orderAddress,
      paymentMethod: req.body.payment_option,
      total: userCart.reduce((acc, item) => acc + item.total, 0),
      status: req.body.payment_option === "COD" ? "Pending" : "Paid",
      createdAt: new Date(),
    };

    const { insertedId } = await db
      .collection(collection.ORDERS_COLLECTION)
      .insertOne(order);

    // Update user
    const userUpdate = {
      $push: { orders: insertedId },
      $set: { cart: [] },
    };

    // Add new address if created
    if (req.body.billingName && req.body.address) {
      userUpdate.$push.addresses = orderAddress;
    }

    await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ userId }, userUpdate);

    res.redirect("/order-success");
  } catch (error) {
    console.error("🔥 Error placing order:", error);
    res.status(500).send("Something went wrong while placing the order.");
  }
};

export const orderSuccess = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    const db = await connectDB();

    // Fetch the last order for this user
    const lastOrder = await db
      .collection(collection.ORDERS_COLLECTION)
      .findOne({ userId }, { sort: { createdAt: -1 } });

    if (!lastOrder) {
      console.log("No order found for this user.");
      return res.redirect("/");
    }

    // Ensure each cart item has a total
    const cartWithTotal = lastOrder.userCart.map((item) => ({
      ...item,
      total: item.total || item.price * item.quantity,
    }));

    // Calculate total order amount
    const totalAmount = cartWithTotal.reduce(
      (acc, item) => acc + item.total,
      0
    );

    res.render("user/orderSuccess", {
      orderId: lastOrder._id,
      email: req.loggedInUser.email,
      billingName: lastOrder.address.billingName,
      address: lastOrder.address.address,
      landmark: lastOrder.address.landmark,
      phone: lastOrder.address.phone,
      userCart: cartWithTotal,
      total: totalAmount,
    });
  } catch (error) {
    console.error("Error rendering order success page:", error);
    res
      .status(500)
      .send("Something went wrong while loading the order success page.");
  }
};

export const getOrderHistory = async (req, res) => {

  try {
    const userId = req.loggedInUser?.id;
    if (!userId) return res.redirect("/login");

    // Connect to database
    const db = await connectDB();

    // Fetch all orders for this user, newest first
    const orders = await db
      .collection(collection.ORDERS_COLLECTION)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    if (!orders || orders.length === 0) {
      // console.log("No orders found for this user.");
      return res.render("user/getOrderHistory", { orders: [] });
    }

    // Format orders: add cart totals and full totalAmount per order
    const formattedOrders = orders.map((order) => {
      const cartWithTotal = order.userCart.map((item) => ({
        ...item,
        total: item.total || item.price * item.quantity,
      }));

      const totalAmount = cartWithTotal.reduce(
        (acc, item) => acc + item.total,
        0
      );

      return {
        ...order,
        userCart: cartWithTotal,
        totalAmount,
      };
    });

    console.log("formateed orders#######", formattedOrders);

    // ✅ Render the correct view inside "views/user/getOrderHistory.hbs"
    res.render("user/getOrderHistory", { orders: formattedOrders });
  } catch (error) {
    console.error("Error loading order history page:", error);
    res.status(500).send("Something went wrong while loading order history.");
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

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.loggedInUser?.id;
    const { productId } = req.body;

    if (!userId) return res.redirect("/login");

    const db = await connectDB(process.env.DATABASE);

    // Fetch user
    const user = await db
      .collection(collection.USERS_COLLECTION)
      .findOne({ userId });

    // Fetch product details
    const product = await db
      .collection(collection.BOOKS_COLLECTION)
      .findOne({ productId });

    if (!product) return res.redirect("/wishlist");

    // Check if already exists
    const exists = user.wishlist?.find((item) => item.productId === productId);

    if (!exists) {
      const wishlistItem = {
        productId,
        productName: product.productName,
        shortDescription: product.shortDescription,
        price: Number(product.discountPrice || product.price),
        productImages: product.productImages?.[0] || "/img/default.png",
        category: product.category,
        brand: product.brand,
        addedAt: new Date(),
      };

      await db
        .collection(collection.USERS_COLLECTION)
        .updateOne({ userId }, { $push: { wishlist: wishlistItem } });
    }

    res.redirect("/wishlist");
  } catch (err) {
    console.log("Wishlist Error:", err);
    res.redirect("/wishlist");
  }
};
