export const landingPage = async (req, res) => {
    console.log("🚀 landingPage function called")
  try {
    res.render("user/homePage", {
      title: "Home - Royal Essence",
    });
  } catch (error) {
    // console.error("❌ Landing page error:", error);
    res.status(500).send("Error loading home page");
  }
};
 