import { v7 as uuidv7 } from "uuid";
import connectDB from "../config/db.js";
import collection from "../config/collection.js";

export const createProduct = async (req, res) => {
  console.log("create product route working >>>>>>>>");
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  try {
    const data = req.body;

    // Thumbnail (single)
    const thumbnail =
      req.files?.thumbnail?.[0]?.filename || null;

    //Product Images (multiple)
    const productImages =
      req.files?.productImages?.map(file => `/userAssets/uploads/${file.filename}`) || [];

    const productData = {
      productId: uuidv7(),
      productName: data.productName,
      shortDescription: data.shortDescription,
      description: data.description,
      category: data.category,
      brand: data.brand,
      price: parseInt(data.price),
      discountPrice: parseInt(data.discountPrice),
      stock: parseInt(data.stock),
      rating: data.rating ? parseInt(data.rating) : 0,
      thumbnail: `/userAssets/uploads/${thumbnail}`, // ✅ fixed
      productImages: productImages, // ✅ added
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await connectDB();
    const result = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .insertOne(productData);

    console.log("✅ New product added:", result.insertedId);

    // return res.redirect("/admin/add-product");
    return res.redirect("/admin/products-list");                                                                                                                                                  
  } catch (error) {
    console.error("❌ Create product error:", error);
    res.status(500).send("Failed to create product");
  }
};

export const getAllProducts = async () => {
  try {
    const db = await connectDB();
    const products = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({})
      .toArray();

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

