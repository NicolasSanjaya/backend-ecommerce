import dotenv from "dotenv";
import express from "express";
import UserRouter from "./src/routes/user.route.js";
import ProductRouter from "./src/routes/product.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

dotenv.config();

const port = process.env.PORT;

//middleware
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:3000/login"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.use(ProductRouter);
app.use(UserRouter);

app.listen(port, () => {
  console.log(`Server is Listening on http://localhost:${port}`);
});
