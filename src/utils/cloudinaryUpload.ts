// src/utils/cloudinaryUpload.ts
import { cloudinary } from "../config/cloudinary";

export type UploadedImage = {
  secure_url: string;
  public_id: string;
};

export function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload failed"));

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}