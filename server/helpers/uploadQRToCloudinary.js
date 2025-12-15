import cloudinary from "./cloudinary.js";
import streamifier from "streamifier";

/**
 * Uploads a QR PNG buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {string} folder
 * @param {string} publicId
 */
export function uploadQRBuffer(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        format: "png"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
