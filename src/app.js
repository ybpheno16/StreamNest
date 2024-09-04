import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(logger("dev"));

//routes import
import userRouter from "./routes/user.routes.js"

// route declaration
app.use("/api/v1/users", userRouter);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        route: "/health",
        message: "Server is up and running",
        statusCode: 200
    });
})

app.get("*", (req, res) => {
    res.status(404).json({
        success: false,
        route: req.originalUrl,
        message: "Route Not Found",
        statusCode: 404
    })
})

export { app };