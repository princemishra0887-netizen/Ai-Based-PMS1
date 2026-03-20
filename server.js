const express = require("express");
const app = express();


app.get("/", (req, res) => {
    res.send("Hello API is working 🚀");
});


app.get("/sum", (req, res) => {
    const a = parseInt(req.query.a);
    const b = parseInt(req.query.b);

    const result = a - b;
    res.send("Sum is: " + result);
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});

// const express = require("express");
// const app = express();

// app.use(express.json());

// const userRoutes = require("./routes/userRoutes");
// app.use("/api/users", userRoutes);

// app.listen(5000, () => {
//     console.log("Server running on http://localhost:5000");
// });

// const express = require("express");
// const app = express();

// app.use(express.json());


// const userRoutes = require("./routes/userRoutes");


// app.use("/api/users", userRoutes);


// app.get("/", (req, res) => {
//     res.send("API is working 🚀");
// });


// app.listen(5000, () => {
//     console.log("Server running on http://localhost:5000");
// });
