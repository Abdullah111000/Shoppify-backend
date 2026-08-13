import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

const getCloudName = () => process.env.CLOUDINARY_CLOUD_NAME;
const getApiKey = () => process.env.CLOUDINARY_API_KEY;
const getApiSecret = () => process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = () =>
  Boolean(getCloudName() && getApiKey() && getApiSecret());

export const configureCloudinary = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: getCloudName(),
      api_key: getApiKey(),
      api_secret: getApiSecret(),
    });
  }
};

configureCloudinary();

export default cloudinary;

