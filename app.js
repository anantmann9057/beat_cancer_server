import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/users.routes.js";
import websocketRouter from "./routes/websocket.routes.js";
import chatgptRouter from "./routes/chatgpt.routes.js";
import realtimeRouter from "./routes/realtime.routes.js";
import { errorHandler } from "./middlewares/error.middlewares.js";
import { connectDB } from "./db/index.js";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

app.use(
  express.json({
    limit: "50mb",
  })
);
connectDB();
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.json({
    message: "hello",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/websocket", websocketRouter);
app.use("/api/v1/chatgpt", chatgptRouter);
app.use("/api/v1/realtime", realtimeRouter);

app.use(errorHandler);
export { app };
