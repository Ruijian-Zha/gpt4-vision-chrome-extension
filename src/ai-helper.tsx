import OpenAI from "openai";

// import { RunnableToolFunction } from 'openai/lib/RunnableFunction';
import { ChatCompletionMessageParam } from "openai/resources";

export type Command =
  | { clickElementByTag: string; reason: string }
  | { inputElementByTag: string; value: string; reason: string }
  | { scrollDown: boolean; reason: string }
  | { openUrlInCurrentTab: string; reason: string }
  | { logAnswer: string; reason: string }
  | { taskDone: boolean; reason: string };

export type Commands = Command[];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// note: this is a workaround for the fact that the chat API does not support function calling or respect system prompts (2023-11-09)
// note: for production, you should move this logic to a backend server and manage the task state from background.js
export async function createCompletionWorkaround(
  inputMessages: ChatCompletionMessageParam[]
) {

  console.log(inputMessages);

  // here is the data for input Message 
  // [{"content":[{"image_url":{"detail":"auto","url":""},"type":"image_url"},{"text":"Here is the initial state of the page.","type":"text"}],"role":"user"},
  // {"role":"user","content":[{"type":"image_url","image_url":{"url":"data:image/png;base64,xxxxxxxxx","detail":"auto"}},{"type":"text","text":"Here is the initial state of the page."}]}]

  // Parse the last message from the inputMessages
  const lastMessage = inputMessages[inputMessages.length - 1];
  
  // Extract the image and tree from the last message
   // @ts-ignore
  const imageUrl = lastMessage.content.find(item => item.type === 'image_url').image_url.url;
   // @ts-ignore
  const accessibilityTree = lastMessage.content.find(item => item.type === 'text').text;
  
  // Define the URL of the endpoint
  const url = "https://1fb4-129-161-221-78.ngrok-free.app/api/ai/screenshots/upload";

    // Generates a unique request ID
  function generateRequestId(username: string): string {
    const date = new Date();
    const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const timestamp = date.getTime();
    const randomDigits = Math.floor(Math.random() * 1000); // Random number for uniqueness
    return `${username}-${dateString}-${timestamp}-${randomDigits}`;
  }

  // Define the request ID
  const requestId = generateRequestId("zhar2");

  function dataURLtoBlob(dataurl: any) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }
  
  // Define the multipart/form-data payload
  const payload = new FormData();
  payload.append('request_id', requestId);
  const imageBlob = dataURLtoBlob(imageUrl);
  payload.append('screenshot', imageBlob, 'screenshot.png');
  payload.append('accessibility_tree', accessibilityTree);
  
  // Make the POST request
  const response = await fetch(url, {
    method: 'POST',
    body: payload,
  });
  
  // Read the response text and store it in a variable
  const responseText = await response.text();

  // Print the response from the server
  console.log("message from server", responseText);

  // Use the stored response text
  const result = JSON.parse(responseText);

  console.log("json version message", result);

  // const messages: ChatCompletionMessageParam[] = [
  //   {
  //     role: "system",
  //     content: systemPrompt,
  //   },
  //   ...inputMessages,
  // ];

  // const result2 = await openai.chat.completions.create({
  //   model: "gpt-4-vision-preview",
  //   messages,
  //   max_tokens: 4096,
  // });
  // console.log("correct output", result2);

  return result;
}

// transform the string output into json format
export function parseJsonString(jsonString: string): Commands | null {
  // Use regex to remove the 'json' prefix and backticks if they exist
  const regex = /.*```json\n([\s\S]*?)\n```.*/;

  // Replace the matched parts with just the JSON part
  const trimmedString = jsonString.replace(regex, "$1");

  try {
    const parsed = JSON.parse(trimmedString) satisfies Commands;
    return parsed;
  } catch (error) {
    console.error("Invalid JSON string", error);
    return null;
  }
}
