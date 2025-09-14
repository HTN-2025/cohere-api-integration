import { CohereClientV2, CohereError, CohereTimeoutError } from "cohere-ai";
import {
  AssistantMessageResponseContentItem,
  ResponseFormatV2,
} from "cohere-ai/api";
import {
  JSONSCHEMA,
  REASONING_SYS_PROMPT,
  REASONING_USER_PROMPT,
  VISION_SYS_PROMPT,
  VISION_USER_PROMPT,
} from "./constants.js";

// interface ResponseFormat {
//   type: "json_object";
//   jsonSchema: {
//     type: "object";
//     properties: { [key: string]: any };
//     required: string[];
//   };
// }

// const writeFile = async (filePath: string, content: string) => {
//   try {
//     // Write the string content to the specified file
//     await fsPromises.writeFile(filePath, content, "utf8");
//     console.log("File written successfully!");
//   } catch (error) {
//     console.error("Error writing file:", error);
//   }
// };

async function callVisionModel(
  system_prompt: string,
  user_prompt: string,
  imageUri: string,
  jsonSchema: ResponseFormatV2,
  cohereApiKey: string
) {
  try {
    const cohere = new CohereClientV2({ token: process.env.CO_API_KEY ?? cohereApiKey });
    const response = await cohere.chat({
      model: "command-a-vision-07-2025",
      messages: [
        {
          role: "system",
          content: system_prompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: user_prompt,
            },
            {
              // Correct based on the provided ImageContent.d.ts file
              type: "image_url",
              imageUrl: {
                url: imageUri,
                detail: "auto",
              },
            },
          ],
        },
      ],
      // ...(Object.keys(jsonSchema).length > 0 && { responseFormat: jsonSchema }),
      responseFormat: jsonSchema,
    });
    return response;
  } catch (err) {
    if (err instanceof CohereTimeoutError) {
      console.log("Request timed out", err);
    }  else if (err instanceof CohereError){
      console.log(err.statusCode);
      console.log(err.message);
      console.log(err.body);
    } else {
      console.error("An unknown error occurred:", err);
    }
  }
  return undefined;
}

async function assessReceiptJson(
  system_prompt: string,
  user_prompt: string,
  jsonString: string,
  jsonSchema: ResponseFormatV2,
  cohereApiKey: string
) {
  try {
    const cohere = new CohereClientV2({ token: process.env.CO_API_KEY ?? cohereApiKey });
    const response = await cohere.chat({
      model: "command-a-reasoning-08-2025",

      messages: [
        {
          role: "system",
          content: system_prompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${user_prompt}\n${jsonString}`,
            },
          ],
        },
      ],
      maxTokens: 3000,
      responseFormat: jsonSchema,
    });

    return response;
  } catch (err) {
    if (err instanceof CohereTimeoutError) {
      console.log("Request timed out", err);
    } else if (err instanceof CohereError) {
      // catch all errors
      console.log(err.statusCode);
      console.log(err.message);
      console.log(err.body);
    } else{
      console.error("An unknown error occurred:", err);
    }
    return;
  }
}

export async function scanReceipt(imageUri: string, cohereApiKey: string) {
  const visionResponse = await callVisionModel(
    VISION_SYS_PROMPT,
    VISION_USER_PROMPT,
    imageUri,
    JSONSCHEMA,
    cohereApiKey
  );
  console.log("Vision Response:", visionResponse);
  const visionOutput: string = (
    visionResponse?.message
      ?.content?.[0] as AssistantMessageResponseContentItem.Text
  ).text;

  console.log("Vision Output:", visionOutput);
  const reasoningResponse = await assessReceiptJson(
    REASONING_SYS_PROMPT,
    REASONING_USER_PROMPT,
    visionOutput,
    JSONSCHEMA,
    cohereApiKey
  );

  console.log("Reasoning Response:", reasoningResponse);
  const reasoningOutput = reasoningResponse?.message?.content?.[0];
  const reasoningJson = (
    reasoningResponse?.message
      ?.content?.[1] as AssistantMessageResponseContentItem.Text
  ).text;
  console.log("Reasoning Output:", reasoningOutput);
  console.log("Reasoning JSON:", reasoningJson);

  const finalOutput = (
    reasoningResponse?.message
      ?.content?.[1] as AssistantMessageResponseContentItem.Text
  ).text;

  console.log("Final JSON Output:", finalOutput);
  // writeFile("receipt_data.txt", reasoningResponse.message.content[1].text);
  return finalOutput;
}
