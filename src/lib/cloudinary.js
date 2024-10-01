import { v2 as cloudinary } from "cloudinary";
import { createReadStream } from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_KEY_SECRET,
});

export const cloudinaryConfig = async () => {
  const url = cloudinary.url("eren_d7gxwh", {
    transformations: [{ width: 100, height: 100 }],
    fetch_format: "auto",
    quality: "auto",
  });
  // Optimize delivery by resizing and applying auto-format and auto-quality
  const optimizeUrl = cloudinary.url("shoes", {
    fetch_format: "auto",
    quality: "auto",
  });

  console.log(optimizeUrl);

  // Transform the image: auto-crop to square aspect_ratio
  const autoCropUrl = cloudinary.url("shoes", {
    crop: "auto",
    gravity: "auto",
    width: 500,
    height: 500,
  });

  console.log(autoCropUrl);
};

export const handleUploadCloudinary = async (req, res, next) => {
  // console.log(file);

  // const uploadResult = await cloudinary.uploader
  //   .upload(file.originalname, {
  //     resource_type: "image",
  //     upload_preset: "ecommerce",
  //     folder: "ecommerce",
  //   })
  //   .then((result) => {
  //     return result;
  //   })
  //   .catch((error) => {
  //     console.log(error);
  //   });
  // return uploadResult;
  const fileBuffer = req.file.buffer;

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: "image",
      upload_preset: "ecommerce",
      folder: "ecommerce",
      allowed_formats: ["jpg", "png", "jpeg"],
    },
    (error, result) => {
      if (error) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          error: error.message,
        });
      }
      res.data = result;
      next();
      // return res.status(200).json({
      //   status: true,
      //   statusCode: 200,
      //   message: "Upload Success",
      //   data: result,
      //   url: result.secure_url,
      // });
    }
  );
  createReadStream(fileBuffer).pipe(uploadStream);
  // uploadStream.end(fileBuffer);
};

export const deleteImageCloudinary = async (image) => {
  const deleteResult = await cloudinary.uploader
    .destroy(String(image), { resource_type: "image" })
    .catch((error) => {
      console.log(error);
    });
  return deleteResult;
};
