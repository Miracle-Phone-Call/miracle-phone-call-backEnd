require("dotenv").config();
const express = require('express')




const app = express();

app.get('/', (req, res) => {
    res.status(200).json("Hello")
})


app.listen(process.env.PORT, () => {
    console.log("Server running on ", process.env.PORT)
})