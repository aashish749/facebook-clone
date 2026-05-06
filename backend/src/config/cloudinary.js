import crypto from "crypto";

// Minimal Cloudinary helpers for signed direct uploads
// Do not expose CLOUDINARY_API_SECRET to the client

const getCloudName = () => process.env.CLOUDINARY_CLOUD_NAME || "";
const getApiKey = () => process.env.CLOUDINARY_API_KEY || "";

// params: object of key->value that will be signed (timestamp, folder, etc.)
export const generateSignature = (params = {}) => {
  // Cloudinary requires parameters sorted alphabetically and joined with '&'
  const keys = Object.keys(params).sort();
  const toSign = keys.map((k) => `${k}=${params[k]}`).join("&");
  const secret = process.env.CLOUDINARY_API_SECRET || "";
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
};

export const getApiKeyAndCloud = () => ({ api_key: getApiKey(), cloud_name: getCloudName() });

export default {
  generateSignature,
  getApiKeyAndCloud,
};
import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "./index.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export default cloudinary;
