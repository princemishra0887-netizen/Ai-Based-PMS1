const express = require("express");
const app = express();


app.get("/", (req, res) => {
    res.send("Hello API is working 🚀");
});


app.get("/sum", (req, res) => {
    const a = parseInt(req.query.a);
    const b = parseInt(req.query.b);

    const result = a + b;
    res.send("Sum is: " + result);
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});