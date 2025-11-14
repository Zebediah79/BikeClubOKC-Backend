import express from "express";
const router = express.Router();
export default router;

import { getParentByEmailAndPassword } from "#db/queries/parents";
import { getVolunteerByEmailAndPassword } from "#db/queries/volunteers";
import requireBody from "#middleware/requireBody";
import { createToken } from "#utils/jwt";

router.post(
  "/parents/login",
  requireBody(["email", "password"]),
  async (req, res) => {
    const { email, password } = req.body;
    const user = await getParentByEmailAndPassword(email, password);
    if (!user) return res.status(401).send("Invalid email or password.");
    const token = createToken({ id: user.id });
    res.send(token);
  }
);

router.post(
  "/volunteers/login",
  requireBody(["email", "password"]),
  async (req, res) => {
    const { email, password } = req.body;
    const user = await getVolunteerByEmailAndPassword(email, password);
    if (!user) return res.status(401).send("Invalid email or password.");
    const token = createToken({ id: user.id });
    res.send(token);
  }
);
