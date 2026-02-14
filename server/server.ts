import { app } from "./app";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "./utils/db";
import config from "./config";


// cloudinary config
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});


// create server
app.listen(config.PORT, () => {
  console.log(`Server is connected with port ${config.PORT}`);
  connectDB();
});
