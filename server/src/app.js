import cors from "cors";
import morgan from "morgan";
import express from "express";
import { config } from "dotenv";
import router from "./routes/router.js";

config();

const app = express();

/**middlewares */
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.disable("x-powered-by");

app.use("/api/v1", router);

export default app;
