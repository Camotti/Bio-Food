import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import iaRoute from "./routes/iaRoute.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use("/api", iaRoute);

app.get("/test", async (req, res) => {
  res.json({ ok: true, message: "ok" });
});

export const handler = serverless(app);