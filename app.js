import cors from "cors";
import express from "express";
const app = express();
export default app;

const devOrigin = process.env.FRONTEND_URL_DEV || "http://localhost:5173";
const prodOrigin =
  process.env.FRONTEND_URL_PROD || "https://bikeclubokc-frontend.onrender.com";
const nodeEnv = process.env.NODE_ENV || "development";

const allowedOrigins =
  nodeEnv === "production"
    ? [prodOrigin]
    : [devOrigin, "http://localhost:5173"];

import usersRouter from "#api/users";
import parentsRouter from "#api/parents";
import volunteersRouter from "#api/volunteers";
import {
  getParentFromToken,
  getVolunteerFromToken,
} from "#middleware/getUserFromToken";

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(getParentFromToken);
app.use(getVolunteerFromToken);

app.use("/users", usersRouter);
app.use("/parents", parentsRouter);
app.use("/volunteers", volunteersRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Oopsy. Poopsy. Something went wrong.");
});
