import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

/**
 * Creates a JWT token for a user.
 * @param {Object} payload - Data to embed in the token (e.g. user ID, role, etc.)
 * @returns {string} Signed JWT token
 */
export function createToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "1y" });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - The JWT token string
 * @returns {Object} Decoded payload if valid
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
