export const adminLoginPage = async (req, res) => {
  try {
    res.render("admin/adminLogin", { layout: "admin", title: "Admin Login" });
  } catch (error) {
    console.log(error)
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
    console.log(error)
    res.status(500).send("Something went wrong loading the dashboard.");
  }
};

export const adminAddProductPage = async (req, res) => {
  try {
    res.render("admin/addProduct", { layout: "admin", title: "Add Product - Admin" });
  } catch (error) {
    console.log(error)
      res.status(500).send("Something went wrong loading the add product page.");
  }
};

