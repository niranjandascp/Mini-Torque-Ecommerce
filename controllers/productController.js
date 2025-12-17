import { v7 as uuidv7 } from "uuid";
import connectDB from "../config/db.js";
import collection from "../config/collection.js";
import { ObjectId } from "mongodb";
import fs from 'fs';
import path from 'path';


const deleteFile = (filePath) => {
  if (!filePath) return;

  const absolutePath = path.join(
    process.cwd(),
    'public',
    filePath
  );

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    console.log('🗑️ Deleted file:', absolutePath);
  } else {
    console.log('⚠️ File not found:', absolutePath);
  }
};


// create Products
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

// get all products
export const getAllProducts = async () => {
  try {
    const db = await connectDB();
    const products = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .find({})
      .toArray();
      console.log(products)

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// edit and update prooducts
export const editProductDetailsPage = async (req, res) => { 
  try {
    const productId = req.params.id;
    const db = await connectDB();

    const productDetailsEdit = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(String(productId)) });

    res.render("admin/productDetailsEdit", { layout: "admin", title: "Edit Product Details", productDetails: productDetailsEdit });
  } catch (error) {
    console.error("❌ Edit product details error:", error);
    res.status(500).send("Failed to edit product details");
  }
};

export const editProductDetails = async (req, res) => {
  console.log("edit product function called >>>>>>>>>>", req.params.id, req.body);
  try {
    const productId = req.params.id;
    const data = req.body;

    // Map form fields to database fields
    const updatedData = {
      productName: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      category: data.category,
      brand: data.brand,
      price: parseInt(data.price),
      discountPrice: parseInt(data.discountPrice) || null,
      stock: parseInt(data.stock),
      rating: data.rating ? parseFloat(data.rating) : 0,
      updatedAt: new Date(),
    };

    const db = await connectDB();

    await db
      .collection(collection.PRODUCTS_COLLECTION)
      .updateOne({_id: new ObjectId(String(productId))}, { $set: updatedData });

    console.log("Edit product route working >>>>>>>>");
    res.redirect("/admin/products-list");
  } catch (error) {
    console.error("❌ Edit product error:", error);
    res.status(500).send("Failed to edit product");
  }
};



// delete product
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('Delete product route working >>>>>>>>', productId);

    const db = await connectDB();

    // 1️⃣ Get product first
    const productData = await db
      .collection(collection.PRODUCTS_COLLECTION)
      .findOne({ _id: new ObjectId(productId) });

    if (!productData) {
      return res.status(404).send('Product not found');
    }

    // 2️⃣ Delete thumbnail
    deleteFile(productData.thumbnail);

    // 3️⃣ Delete product images
    if (Array.isArray(productData.productImages)) {
      productData.productImages.forEach((imgPath) => {
        deleteFile(imgPath);
      });
    }

    // 4️⃣ Delete product from DB
    await db
      .collection(collection.PRODUCTS_COLLECTION)
      .deleteOne({ _id: new ObjectId(productId) });

    console.log('✅ Product + images deleted:', productId);

    return res.redirect('/admin/products-list');
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).send('Failed to delete product');
  }
};

export const getProductsData = async (options = {}) => {
  try {
    const db = await connectDB();

    // Build filter dynamically
    const filter = {};
    if (options.category) filter.category = options.category;
    if (options.brand) filter.brand = options.brand;

    let products;

    // Random products
    if (options.sort === "random") {
      products = await db
        .collection(collection.PRODUCTS_COLLECTION)
        .aggregate([
          { $match: filter },
          { $sample: { size: options.limit || 20 } }
        ])
        .toArray();
    } else {
      // Sorting
      let sortOption = { createdAt: -1 };
      if (options.sort === "oldest") sortOption = { createdAt: 1 };

      let query = db
        .collection(collection.PRODUCTS_COLLECTION)
        .find(filter)
        .sort(sortOption);

      if (options.limit) {
        query = query.limit(Number(options.limit));
      }

      products = await query.toArray();
    }

    return products;
  } catch (error) {
    console.error("❌ Error in getProductsData:", error);
    throw error;
  }
};
