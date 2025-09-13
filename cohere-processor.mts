
import dotenv from "dotenv"

import { CohereClientV2, CohereTimeoutError, CohereError } from "cohere-ai"
import { convertImageToBase64 } from "./image-converter.mts";
import { promises as fsPromises } from 'fs';

dotenv.config()
interface ResponseFormat {
    type: "json_object";
    jsonSchema: {
        type: "object";
        properties: { [key: string]: any };
        required: string[];
    };
}

export const REASONING_SYS_PROMPT=`You are an assistant that analyzes the JSON output of a receipt processor. Your task is to determine if the JSON output makes intuitive sense. If the JSON does not make sense, fix the mistake.`
export const REASONING_USER_PROMPT=`Here is the JSON output from the receipt processor:`


export const VISION_SYS_PROMPT = `You are a receipt processor. Your task is to convert the following receipt text into a JSON object. The JSON should have a key called items which is an array of objects. Each object in the array must represent a main item on the receipt. If a line is indented, it is a modifier for the item directly above it. Do not assign a price to a modifier. Ignore any foreign languages, the receipts will be in English.`
export const VISION_USER_PROMPT = "Read this receipt."


export const EDITING_SYS_PROMPT = `You are a JSON evaluator and optimizer. Your task is to review a JSON object representing a receipt and perform specific corrections and enhancements based on provided instructions. Do not generate new data that isn't requested.`

export const EDITING_USER_PROMPT = "Here are the instructions for editing the JSON object. Follow them carefully and make only the specified changes. Do not add any new data that isn't requested. Here are the instructions: "

export const imageUri = convertImageToBase64("../images/TNT_1.jpg");

//  
export const JSONSCHEMA ={
  "type": "json_object",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "store": {
        "type": "string",
        "description": "The name of the store."
      },
      "address": {
        "type": "string",
        "description": "The street address of the store."
      },
      "phone": {
        "type": "string",
        "description": "The contact phone number for the store."
      },
      "receipt_no": {
        "type": "string",
        "description": "The unique identification number for the receipt."
      },
      "date": {
        "type": "string",
        "description": "The date the purchase was made, in 'MM/DD/YYYY' format."
      },
      "time": {
        "type": "string",
        "description": "The time the purchase was made, in 'HH:MM' format."
      },
      "receiptItems": {
        "type": "array",
        "description": "A list of all items purchased in the transaction. Avoid putting things like tax, total, subtotal, etc. in this list.",
        "items": {
          "type": "object",
          "properties": {
            "itemName": {
              "type": "string",
              "description": "The name of the item."
            },
            "unit": {
              "type": "integer",
              "description": "The number of units of this item purchased."
            },
            "price": {
              "type": "number",
              "description": "The price of a single unit of the item."
            },
            "details": {
              "type": "array",
              "description": "Additional details about the item, such as size, flavor, toppings, etc.",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "itemName",
            "price"
          ]
        }
      },
      "tip": {
        "type": "number",
        "description": "The tip amount for the transaction."
      },
      "tax": {
        "type": "number",
        "description": "The total sales tax applied to the transaction."
      },
      "total": {
        "type": "number",
        "description": "The final total cost of the transaction, including tax and tip."
      },
      "number_items": {
        "type": "integer",
        "description": "The total count of all items on the receipt."
      },
      "payment_method": {
        "type": "string",
        "description": "The method used for payment (e.g., 'credit card', 'cash')."
      }
    },
    "required": [
      "store",
      "receipt_no",
      "date",
      "time",
      "receiptItems",
      "total",
      "tip",
      "tax",
      "number_items",
      "payment_method"
    ]
  }
}
    
const writeFile = async (filePath: string, content: string) => {
  try {
    // Write the string content to the specified file
    await fsPromises.writeFile(filePath, content, 'utf8');
    console.log('File written successfully!');
  } catch (error) {
    console.error('Error writing file:', error);
  }
};



export const callVisionModel = async (system_prompt: string, user_prompt: string, imageUri: string, jsonSchema: ResponseFormat) => {
    try {
        const cohere = new CohereClientV2({token: process.env.CO_API_KEY!});
        const response = await cohere.chat({
            model: "command-a-vision-07-2025",
            
            messages: [
            {
                role: 'system',
                content: system_prompt
            },    
            {
                role: 'user',
                content: [
                    {
                        "type": "text",
                        "text": user_prompt
                    },
                    {
                        // Correct based on the provided ImageContent.d.ts file
                        "type": "image_url",
                        "imageUrl": {
                            "url": imageUri,
                            "detail": "auto"
                        } 
                    }
                ]
            },
            ],
            ...(Object.keys(jsonSchema).length > 0 && { responseFormat: jsonSchema })
        });
        return response
    }catch (err) {
         if (err instanceof CohereTimeoutError) {
            console.log("Request timed out", err);
        } else if (err instanceof CohereError) {
            // catch all errors
            console.log(err.statusCode);
            console.log(err.message);
            console.log(err.body);
        }
    }
}

export const assessReceiptJson = async (system_prompt: string, user_prompt: string, jsonString: string, jsonSchema : ResponseFormat) => {
    try {
        const cohere = new CohereClientV2({token: process.env.CO_API_KEY!});
        const response = await cohere.chat({
            model: "command-a-reasoning-08-2025",
            
            messages: [
            {
                role: 'system',
                content: system_prompt
            },    
            {
                role: 'user',
                content: [
                    {
                        "type": "text",
                        "text": `${user_prompt}\n${jsonString}`
                    },
                ]
            },
            ],            
            maxTokens: 2000,
            responseFormat: jsonSchema
        });
        
        return response
    }catch (err) {
         if (err instanceof CohereTimeoutError) {
            console.log("Request timed out", err);
        } else if (err instanceof CohereError) {
            // catch all errors
            console.log(err.statusCode);
            console.log(err.message);
            console.log(err.body);
        }
    }
}


export const ReceiptScanner = async () => {

  let visionResponse = await callVisionModel(VISION_SYS_PROMPT, VISION_USER_PROMPT, imageUri, JSONSCHEMA);
  if (visionResponse) {
    const visionOutput : string = visionResponse.message.content[0].text;
    console.log("Vision Output:", visionOutput);
    let reasoningResponse = await assessReceiptJson(REASONING_SYS_PROMPT, REASONING_USER_PROMPT, visionOutput, JSONSCHEMA );
    
    console.log("Reasoning Response:", reasoningResponse);
    if (reasoningResponse) {
      let reasoningOutput : Object = reasoningResponse.message.content[0];
      let reasoningJson = reasoningResponse.message.content[1].text;
      console.log("Reasoning Output:", reasoningOutput);
      console.log("Reasoning JSON:", reasoningJson);
      
    }else{
      console.log('check failed')
    }
    
    
    console.log("Final JSON Output:", reasoningResponse.message.content[1].text);
    writeFile('receipt_data.txt', reasoningResponse.message.content[1].text);
    return reasoningResponse.message.content[1].text;
  }
}



  
const response = await ReceiptScanner()


