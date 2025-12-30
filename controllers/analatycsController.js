import connectDB from "../config/db.js";
import collection from "../config/collection.js";

export const getStatsAnalytics = async () => {
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
      recentOrders,
    ] = await Promise.all([
      // Total Revenue from all paid/delivered orders
      db
        .collection(collection.ORDERS_COLLECTION)
        .aggregate([
          {
            $match: {
              status: { $in: ["Paid", "Delivered", "Shipped"] },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$total" },
            },
          },
        ])
        .toArray(),

      // Total number of orders
      db.collection(collection.ORDERS_COLLECTION).countDocuments(),

      // Total number of products
      db.collection(collection.PRODUCTS_COLLECTION).countDocuments(),

      // Number of users who ordered this year
      db
        .collection(collection.ORDERS_COLLECTION)
        .aggregate([
          {
            $match: {
              createdAt: { $gte: yearStart, $lte: yearEnd },
            },
          },
          {
            $group: {
              _id: "$userId",
            },
          },
          {
            $count: "uniqueUsers",
          },
        ])
        .toArray(),

      // Recent 5 orders for dashboard preview
      db
        .collection(collection.ORDERS_COLLECTION)
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
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
      recentOrders,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return null;
  }
};

export const getDonutChartData = async () => {
  try {
    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Start of current year
    const startOfYear = new Date(currentYear, 0, 1);

    // Start and end of current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const db = await connectDB();

    const statusData = await db
      .collection(collection.ORDERS_COLLECTION)
      .aggregate([
        { $match: { createdAt: { $gte: startOfMonth, $lte: now } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();

    const donutLabels = statusData.map((item) => item._id);
    const donutData = statusData.map((item) => item.count);
    // console.log("Donut Chart Data:", { donutLabels, donutData });
    // Render dashboard with statistics

    return {
      donutLabels: JSON.stringify(donutLabels),
      donutData: JSON.stringify(donutData),
    };
  } catch (error) {
    console.error("Error fetching donut chart data:", error);
    // return {
    //   donutLabels: JSON.stringify([]),
    //   donutData: JSON.stringify([]),
    // };
  }
};
