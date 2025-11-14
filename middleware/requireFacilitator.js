// Middleware to require facilitator role
export default function requireFacilitator(req, res, next) {
  if (!req.user || !req.user.facilitator) {
    return res.status(403).send("Access denied: Requires facilitator.");
  }
  next();
}
