import express, { Request, Response } from "express";
import { callVisionModel, system_prompt, user_prompt, jsonSchema, ResponseFormat } from "./cohere-processor.mts";
interface ImagePayload { 
    base64String: string;
    mimeType: string;
}

const app = express()
app.use(express.json({ limit: '10mb' })); // Increase limit if needed

app.post('/process-image', async (req: Request<{}, {}, ImagePayload>, res: Response) => {
    const { base64String, mimeType } = req.body;
    const imageUri = `data:${mimeType};base64,${base64String}`;

    const response = await callVisionModel(system_prompt, user_prompt, imageUri, jsonSchema as ResponseFormat);
    console.log(response);
    
    if (
        response &&
        response.message &&
        Array.isArray(response.message.content) &&
        response.message.content[0] &&
        typeof response.message.content[0].text === "string"
    ) {
        const llmOutput = response.message.content[0].text;
        console.log("LLM Output:", llmOutput);
        const parsedData = JSON.parse(llmOutput);
        res.json(parsedData); 
    } else {
        res.status(500).json({ error: "Invalid response from vision model." });
    }

})

