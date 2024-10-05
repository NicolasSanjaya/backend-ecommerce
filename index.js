import dotenv from "dotenv";
import express from "express";
import UserRouter from "./src/routes/user.route.js";
import ProductRouter from "./src/routes/product.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

dotenv.config();

const port = process.env.PORT;

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  limit: 10, // each IP can make up to 10 requests per `windowsMs` (5 minutes)
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//middleware
app.use(cookieParser());
app.use(
  cors({
    credentials: true,

    origin: [
      "http://localhost:3000",
      "http://localhost:3000/login",
      "https://frontend-ecommerce-xi-three.vercel.app",
      "https://frontend-ecommerce-xi-three.vercel.app/login",
    ],
  })
);
// app.use(express.static("/upload"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from the 'upload' directory
app.use("/upload", express.static(path.join(__dirname, "upload")));

// routes
app.use(ProductRouter);
app.use(UserRouter);

// limit
app.use(limiter);

// error
app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
    res.status(500).json({
      status: false,
      statusCode: 500,
      message: err.message,
    });
  }
  next();
});

app.listen(port, () => {
  console.log(`Server is Listening on http://localhost:${port}`);
});
