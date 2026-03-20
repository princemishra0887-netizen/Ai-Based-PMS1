const express = require("express");
const app = express();

app.use(express.json());

// Routes import
const userRoutes = require("./routes/userRoutes");

// Use routes
app.use("/api/users", userRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// Start server
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});