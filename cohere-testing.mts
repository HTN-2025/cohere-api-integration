import { callVisionModel, imageUri,  } from "./cohere-processor.mts";





    const system_prompt = ""

    const user_prompt = `give me a line by line of what is on this receipt
    ex line 1: date time`

    const jsonSchema = {}

    const response = await callVisionModel(system_prompt, user_prompt, imageUri, jsonSchema)

    console.log(response.message.content[0].text)

