import { generateSignature, getApiKeyAndCloud } from "../config/cloudinary.js";

export const signUpload = async (req, res) => {
  try {
    const { folder, resource_type } = req.body || {};

    const allowedFolders = ["posts", "reels", "avatars"];
    const allowedTypes = ["image", "video"];

    if (!folder || !allowedFolders.includes(folder)) {
      return res.status(400).json({ message: "Invalid folder" });
    }
    if (!resource_type || !allowedTypes.includes(resource_type)) {
      return res.status(400).json({ message: "Invalid resource_type" });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { folder, timestamp };
    const signature = generateSignature(paramsToSign);
    const { api_key, cloud_name } = getApiKeyAndCloud();

    return res.json({ api_key, cloud_name, timestamp, signature });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to generate signature" });
  }
};

export default { signUpload };
