import express from "express";
import db from "#db/client";
const app = express();
export default app;

// import usersRouter from "#api/users";
// import parentsRouter from "#api/parents";
// import volunteersRouter from "#api/volunteers";
// import {
//   getParentFromToken,
//   getVolunteerFromToken,
// } from "#middleware/getUserFromToken";

app.use(express.json());
// app.use(getParentFromToken);
// app.use(getVolunteerFromToken);

// app.use("/users", usersRouter);
// app.use("/parents", parentsRouter);
// app.use("/volunteers", volunteersRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Oopsy. Poopsy. Something went wrong.");
});
