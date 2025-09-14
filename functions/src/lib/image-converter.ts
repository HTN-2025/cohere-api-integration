import {readFileSync} from "fs";
import {extname} from "path";

export const convertImageToBase64 = (imagePath: string): string => {
  try {
    const imageBuffer = readFileSync(imagePath);
    const fileExtension = extname(imagePath).toLowerCase();
    let mimeType = "image/jpeg";
    if (fileExtension === ".png") {
      mimeType = "image/png";
    } else if (fileExtension === ".gif") {
      mimeType = "image/gif";
    }

    const base64String = imageBuffer.toString("base64");
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error(`Error converting image to Base64: ${error}`);
    throw new Error("Failed to read image file.");
  }
};

export const separateBase64Data = (
  base64String: string
): { mimeType: string; data: string } => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid Base64 string format.");
  }
  return { mimeType: matches[1], data: matches[2] };
};
