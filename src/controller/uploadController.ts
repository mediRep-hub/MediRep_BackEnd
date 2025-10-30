import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import cloudinary from "../cloudinary/cloudinaryConfig";

const storage = multer.memoryStorage();
export const upload = multer({ storage }).single("file");

const uploadController = {
  async uploadFileToCloudinary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileType = (req.query.fileType as string) || "assets";
      const file = req.file;
      const fileName = `${uuidv4()}-${file.originalname}`;

      // Convert buffer to base64
      const base64String = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64String, {
        folder: `MedRep/${fileType}`,
        public_id: fileName,
        resource_type: "auto", // automatically detect image/video/pdf
      });

      return res.status(200).json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err);
      next(err);
    }
  },
};

export default uploadController;
