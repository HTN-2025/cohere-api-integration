/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall } from "firebase-functions/https";

setGlobalOptions({ maxInstances: 10 });

export const handleReceipt = onCall(async (request) => {
  // try {
  //   const { base64String, mimeType } = req.body;
  //   const imageUri = `data:${mimeType};base64,${base64String}`;
  //   const receiptJson: string = await scanReceipt(imageUri);
  //   console.log(receiptJson);
  //   const parsedData = JSON.parse(receiptJson);
  //   res.send(parsedData);
  // } catch (err) {
  //   console.error("Error processing image:", err);
  //   res.status(500).json({ error: "Failed to process image" });
  //   return;
  // }
});
