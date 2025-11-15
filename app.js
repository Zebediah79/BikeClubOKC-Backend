import cors from "cors";
import express from "express";
const app = express();
export default app;

const devOrigin = "process.env.FRONTEND_URL_DEV";
const prodOrigin = "process.env.FRONTEND_URL_PROD";
const nodeEnv = process.env.NODE_ENV;

// const allowedOrigins = nodeEnv === "production" ? prodOrigin : devOrigin;
const allowedOrigins = [prodOrigin, devOrigin];

import usersRouter from "#api/users";
import parentsRouter from "#api/parents";
import volunteersRouter from "#api/volunteers";
import {
  getParentFromToken,
  getVolunteerFromToken,
} from "#middleware/getUserFromToken";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.options("*", cors());

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
