import connectDB from "../config/db.js";
import collection from "../config/collection.js";
import { getAllProducts } from "./productController.js";
import { ObjectId } from "mongodb";

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
    const db = await connectDB();

    // Get current year boundaries
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    // Fetch all necessary data in parallel for better performance
    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      yearlyUsers,
      recentOrders
    ] = await Promise.all([
      // Total Revenue from all paid/delivered orders
      db.collection(collection.ORDERS_COLLECTION)
        .aggregate([
          { 
            $match: { 
              status: { $in: ["Paid", "Delivered", "Shipped"] } 
            } 
          },
          { 
            $group: { 
              _id: null, 
              totalRevenue: { $sum: "$total" } 
            } 
          }
        ])
        .toArray(),

      // Total number of orders
      db.collection(collection.ORDERS_COLLECTION).countDocuments(),

      // Total number of products
      db.collection(collection.PRODUCTS_COLLECTION).countDocuments(),

      // Number of users who ordered this year
      db.collection(collection.ORDERS_COLLECTION)
        .aggregate([
          { 
            $match: { 
              createdAt: { $gte: yearStart, $lte: yearEnd } 
            } 
          },
          { 
            $group: { 
              _id: "$userId" 
            } 
          },
          { 
            $count: "uniqueUsers" 
          }
        ])
        .toArray(),

      // Recent 5 orders for dashboard preview
      db.collection(collection.ORDERS_COLLECTION)
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray()
    ]);

    // Extract revenue and yearly users count
    const revenue = totalRevenue[0]?.totalRevenue || 0;
    const yearlyOrderedUsers = yearlyUsers[0]?.uniqueUsers || 0;

    // Prepare dashboard statistics
    const stats = {
      totalRevenue: revenue.toFixed(2),
      totalOrders,
      totalProducts,
      yearlyOrderedUsers,
      recentOrders
    };

    // Render dashboard with statistics
    res.render("admin/dashboard", {
      layout: "admin",
      title: "Admin Dashboard",
      stats
    });

  } catch (error) {
    console.error("Error loading dashboard:", error);
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

export const adminOrdersListPage = async (req, res) => {
  console.log("Admin OrdersList route working 🚀");
  try {
    const db = await connectDB();

    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
    const usersCollection = db.collection(collection.USERS_COLLECTION);

    // Fetch all orders sorted by newest
    const orders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Map orders to include totals and user email
    const ordersWithTotals = await Promise.all(
      orders.map(async (order) => {
        // Calculate totals for cart items
        const cartWithTotal = order.userCart.map((item) => ({
          ...item,
          total: item.total || item.price * item.quantity,
        }));
        const totalAmount = cartWithTotal.reduce(
          (acc, item) => acc + item.total,
          0
        );

        // Fetch email from users collection using string UUID
        let userEmail = "N/A";
        if (order.userId) {
          try {
            // Make sure this matches the field storing UUID in your users collection
            const user = await usersCollection.findOne({
              userId: order.userId,
            });
            if (user && user.email) userEmail = user.email;
          } catch (err) {
            // console.log("Error fetching user email for order:", order._id, err);
          }
        }

        return {
          ...order,
          userCart: cartWithTotal,
          totalAmount,
          userEmail, // now guaranteed to exist if user is found
        };
      })
    );

    // Render the admin orders list page
    res.render("admin/ordersList", {
      layout: "admin",
      title: "Admin - Orders List",
      orders: ordersWithTotals,
    });
  } catch (error) {
    // console.error("Error loading admin orders list:", error);
    res
      .status(500)
      .send("Something went wrong while loading orders for admin.");
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const db = await connectDB();
    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);

    const orderId = req.params.id;
    const newStatus = req.params.status;

    // console.log("🆕 Updating order:", orderId, "➡️", newStatus);

    // Update order status
    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    // Redirect back to orders list
    res.redirect("/admin/orders-list");
  } catch (error) {
    // console.error("❌ Error updating order status:", error);
    res.status(500).send("Failed to update order status.");
  }
};

export const adminOrderDetailsPage = async (req, res) => {
  // console.log("Admin Order Details route working 🚀");
  try {
    const db = await connectDB();

    const orderId = req.params.id;
    const ordersCollection = db.collection(collection.ORDERS_COLLECTION);
    const productsCollection = db.collection(collection.PRODUCTS_COLLECTION); // ✅ corrected key

    // Fetch the order by ID
    const order = await ordersCollection.findOne({
      _id: new ObjectId (orderId),
    });
    // console.log("???????? order", order)

    if (!order) return res.status(404).send("Order not found");

    // Attach product details for each cart item
    const cartWithProductDetails = await Promise.all(
      order.userCart.map(async (item) => {
        const product = await productsCollection.findOne({
          productId: item.productId,
        });

        return {
          ...item,
          productName: product?.productName,
          brand: product?.brand,
          stockStatus: product.stockStatus > 0,
          image: product.thumbnail,
        };
      })
    );
    // console.log("???????? Product", cartWithProductDetails)

    // Calculate total amount
    const totalAmount = cartWithProductDetails.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    console.log("cart with product Details>>>>>",cartWithProductDetails)

    // Render the order details page
    res.render("admin/order-details", {
      layout: "admin",
      title: `Order Details - ${order._id}`,
      order,
      UserCart: cartWithProductDetails,
      totalAmount,
    });
  } catch (error) {
    console.error("Error loading admin order details:", error);
    res.status(500).send("Something went wrong loading order details.");
  }
};

export const usersListPage = async (req, res) => {
  // console.log("Admin UserstList route working 🚀");
  try {
    const db = await connectDB();

    let usersData = await db
      .collection(collection.USERS_COLLECTION)
      .find({})
      .toArray();

    // format createdAt before sending to HBS
    usersData = usersData.map((user) => {
      return {
        ...user,
        createdAtFormatted: new Date(user.createdAt).toLocaleDateString(
          "en-GB"
        ), // dd/mm/yyyy
      };
    });

    // console.log("userData:", usersData);

    res.render("admin/userList", {
      layout: "admin",
      title: "Admin - Users List",
      usersData,
    });
  } catch (error) {
    // console.error("Error fetching user data:", error);
    res.render("admin/userList", {
      layout: "admin",
      title: "Admin - UsersList",
      usersData: [],
    });
  }
};

export const blockUnblockUser = async (req, res) => {
  console.log("Block/Unblock User route working 🚀");
  // console.log(req.params.id);
  // console.log(req.query.status);
  try {
    const db = await connectDB();
    const userId = req.params.id; // user id from params
    const { status } = req.query; // status from query true/false

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const isBlock = status === "true"; // convert query string to boolean

    // Prepare update data (no blockedAt)
    const updateData = {
      isBlocked: isBlock,
      isActive: !isBlock,
      updatedAt: new Date(),
    };

    const result = await db
      .collection(collection.USERS_COLLECTION)
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // res.status(200).json({
    //   message: isBlock ? "User blocked successfully" : "User unblocked successfully",
    // });

    res.redirect("/admin/users-list");
  } catch (error) {
    console.error("Block/Unblock User Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const adminLogout = (req, res) => {
  try {
    // Clear the token cookie on logout
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Redirect back to login page
    return res.redirect("/admin");
  } catch (err) {
    // console.error("Logout Error:", err.message);
    return res.redirect("/admin");
  }
};
