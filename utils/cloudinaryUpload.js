import cloudinary, { isCloudinaryConfigured, configureCloudinary } from '../config/cloudinary.js';

export const uploadToCloudinary = (buffer) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mern-ecommerce', resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const resolveProductImage = async (req) => {
  configureCloudinary();

  if (req.file) {
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        if (result && result.secure_url) {
          return result.secure_url;
        }
      } catch (error) {
        console.warn('Cloudinary upload failed, falling back to base64 data URI:', error.message || error);
      }
    }

    // Fallback if Cloudinary is not configured or fails: convert file buffer to Data URI
    const base64Image = req.file.buffer.toString('base64');
    return `data:${req.file.mimetype};base64,${base64Image}`;
  }

  if (req.body.imageUrl) {
    return req.body.imageUrl;
  }

  return null;
};


