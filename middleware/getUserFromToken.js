import db from "#db/client";
import { getParentById } from "#db/queries/parents";
import { getVolunteerById } from "#db/queries/volunteers";
import { verifyToken } from "#utils/jwt";

export async function getParentFromToken(req, res, next) {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) return next();

  const token = authorization.split(" ")[1];
  try {
    const { id } = verifyToken(token);
    const user = await getParentById(id);
    req.user = user;
    next();
  } catch {
    res.status(401).send("Invalid token.");
  }
}

export async function getVolunteerFromToken(req, res, next) {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) return next();

  const token = authorization.split(" ")[1];
  try {
    const { id } = verifyToken(token);
    const user = await getVolunteerById(id);
    req.user = user;
    next();
  } catch {
    res.status(401).send("Invalid token.");
  }
}

// Middleware to check the volunteer role against
// the facilitator boolean value in the vounteers table.
export async function checkUserRole(req, res, next) {
  const result = await db.query(
    `SELECT id, facilitator FROM volunteers WHERE id = $1`,
    [req.user.id]
  );
  const rows = result.rows;
  if (rows.length === 0) return res.status(404).send("User not found");
  req.isFacilitator = !!rows[0].facilitator;
  next();
}

// Reroutes the volunteer to the appropriate endpoint based on their user role.
export function reRouteVolunteer(req, res) {
  const base = req.isFacilitator ? "facilitator" : "volunteer";
  res.redirect(`/${base}/${req.user.id}`);
}
