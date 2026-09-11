// securityUtils.js

import jwt from "jsonwebtoken";
import crypto from "crypto";

const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

/**
 * Generate a JWT token for a candidate.
 * @param {object} payload - Candidate data (e.g., { candidateId })
 * @param {string} expiresIn - Expiry time (default: "1h")
 * @returns {string} - Signed JWT token
 */
export function generateToken(payload, expiresIn = "1h") {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

/**
 * Verify a JWT token.
 * @param {string} token - JWT token string
 * @returns {object|null} - Decoded payload if valid, null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    console.error("Invalid or expired token:", err.message);
    return null;
  }
}

/**
 * Encrypt sensitive data using AES-256.
 * @param {string} data - Plain text data
 * @returns {string} - Encrypted data (hex string)
 */
export function encryptData(data) {
  const cipher = crypto.createCipher("aes-256-ctr", SECRET_KEY);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

/**
 * Decrypt data using AES-256.
 * @param {string} encryptedData - Hex string
 * @returns {string} - Decrypted plain text
 */
export function decryptData(encryptedData) {
  const decipher = crypto.createDecipher("aes-256-ctr", SECRET_KEY);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Check if a token is expired.
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export function isTokenExpired(token) {
  const decoded = verifyToken(token);
  if (!decoded) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}
