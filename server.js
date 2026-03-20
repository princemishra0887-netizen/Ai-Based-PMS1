const express = require("express");
const app = express();


app.get("/", (req, res) => {
    res.send("Hello API is working 🚀");
});


app.get("/multiplication", (req, res) => {
    const a = parseInt(req.query.a);
    const b = parseInt(req.query.b);

    const result = a * b;
    res.send("multiplication is: " + result);
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
