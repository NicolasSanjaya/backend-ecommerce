import dotenv from "dotenv";
import express from "express";
import UserRouter from "./src/routes/user.route.js";
import ProductRouter from "./src/routes/product.route.js";

const app = express();

dotenv.config();

const port = process.env.PORT;

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use(ProductRouter);
app.use(UserRouter);

// app.get("/", (req, res) => {
//   return res.json({
//     message: "Hello World",
//   });
// });

app.listen(port, () => {
  console.log(`Server is Listening on http://localhost:${port}`);
});
