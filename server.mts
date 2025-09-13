import express, { Request, Response } from "express";
import { callVisionModel, system_prompt, user_prompt, jsonSchema, ResponseFormat, ReceiptScanner } from "./cohere-processor.mts";
interface ImagePayload { 
    base64String: string;
    mimeType: string;
}

const app = express()
app.use(express.json({ limit: '10mb' })); // Increase limit if needed

app.post('/process-image', async (req: Request<{}, {}, ImagePayload>, res: Response) => {
    try{
        const { base64String, mimeType } = req.body;
        const imageUri = `data:${mimeType};base64,${base64String}`;

        const receiptJson : string = await ReceiptScanner(imageUri);
        console.log(receiptJson);
        
        const parsedData = JSON.parse(receiptJson);
    }catch(err){
        console.error("Error processing image:", err);
        res.status(500).json({ error: 'Failed to process image' });
        return;
    }
})

