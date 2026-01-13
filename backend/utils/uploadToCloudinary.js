const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "campus-market/items",
          resource_type: "image",
          transformation: [
            { width: 800, crop: "limit" }, // resize max 800px
            { quality: "auto" },           // auto compress
            { fetch_format: "auto" },      // webp/avif auto
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      )
      .end(buffer);
  });
};

module.exports = uploadToCloudinary;
