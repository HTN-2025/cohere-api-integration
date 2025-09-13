

export const REASONING_SYS_PROMPT=`You are an assitant that analyzes the JSON output of a receipt processor. Your task is to determine if the JSON output makes intuitive sense. If the JSON does not make sense, give instructions on how to fix it. Ignore unconvententional spellings. If the JSON does not make sense, start your response with a "BAD". If the JSON makes sense, start your response with "GOOD".`

export const REASONING_USER_PROMPT=`Here is the JSON output from the receipt processor:`

export const assessReceiptJson = async (system_prompt: string, user_prompt: string, jsonString: string) => {
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
            maxTokens: 1000,
        });
        
        return response.message.content[0].text
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


export const EvaluatorOptimizer = async () => {
    callVisionModel(VISION_SYS_PROMPT, VISION_USER_PROMPT, imageUri, jsonSchema).then(async (response) => {
        console.log("Receipt Processor Output:");
        console.log(response);
        const jsonString = JSON.stringify(response.message.content[0]);
        const evaluation = await assessReceiptJson(REASONING_SYS_PROMPT, REASONING_USER_PROMPT, jsonString);
        console.log("Evaluation:");
        console.log(evaluation);
    });
}