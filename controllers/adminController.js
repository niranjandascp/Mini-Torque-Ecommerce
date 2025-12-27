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