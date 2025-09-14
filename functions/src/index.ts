/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { scanReceipt } from "./lib/cohere-processor.js";
import { defineSecret } from "firebase-functions/params";

setGlobalOptions({ maxInstances: 10 });

// export const handleReceipt = onCall(async (request) => {

// });

const cohereApiKey = defineSecret("COHERE_API_KEY");

export const getReceiptData = onRequest(
  {secrets: [cohereApiKey]},
  async (req, res) => {
  // logger.info("Hello logs!", { structuredData: true });
  // response.send("Hello from Firebase!");
    try {
      const { base64String, mimeType } = req.body;
      const imageUri = `data:${mimeType};base64,${base64String}`;
      const receiptJson: string = await scanReceipt(imageUri, cohereApiKey.value());
      console.log(receiptJson);
      const parsedData = JSON.parse(receiptJson);
      res.send(parsedData);
    } catch (err) {
      console.error("Error processing image:", err); 
      res.status(500).json({ error: "Failed to process image"});
      return;
    }
  });
