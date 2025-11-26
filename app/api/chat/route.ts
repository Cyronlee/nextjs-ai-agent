import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  type UIMessage,
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// Define local tools for the agent
const tools = {
  getWeather: tool({
    description: "Get the current weather for a specific city",
    inputSchema: z.object({
      city: z.string().describe("The name of the city"),
      unit: z
        .enum(["C", "F"])
        .describe("The temperature unit (Celsius or Fahrenheit)")
        .default("C"),
    }),
    execute: async ({ city, unit }) => {
      // Simulated weather data
      const weather = {
        temperature: unit === "C" ? 22 : 72,
        description: "Partly cloudy",
        humidity: 65,
        windSpeed: 12,
      };

      return `The weather in ${city} is ${weather.temperature}°${unit} with ${weather.description}. Humidity: ${weather.humidity}%, Wind speed: ${weather.windSpeed} km/h.`;
    },
  }),
  getCurrentTime: tool({
    description: "Get the current date and time",
    inputSchema: z.object({
      timezone: z
        .string()
        .describe("The timezone (e.g., America/New_York, Europe/London)")
        .default("UTC"),
    }),
    execute: async ({ timezone }) => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        dateStyle: "full",
        timeStyle: "long",
      });

      return `Current time in ${timezone}: ${formatter.format(now)}`;
    },
  }),
  calculate: tool({
    description: "Perform basic mathematical calculations",
    inputSchema: z.object({
      expression: z
        .string()
        .describe(
          "The mathematical expression to evaluate (e.g., '2 + 2', '10 * 5')"
        ),
    }),
    execute: async ({ expression }) => {
      try {
        // Basic safe evaluation for simple math expressions
        const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
        const result = eval(sanitized);
        return `The result of ${expression} is ${result}`;
      } catch {
        return `Error calculating ${expression}: Invalid expression`;
      }
    },
  }),
  searchInfo: tool({
    description: "Search for information on a given topic",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
      category: z
        .enum(["general", "technology", "science", "history"])
        .describe("The category of information to search")
        .default("general"),
    }),
    execute: async ({ query, category }) => {
      // Simulated search results
      return `Search results for "${query}" in ${category}: This is a simulated response. In a real implementation, this would connect to a search API or knowledge base.`;
    },
  }),
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  const {
    messages,
    modelProvider,
  }: { messages: ChatMessage[]; modelProvider?: string } = await req.json();

  // Determine which model to use
  const provider =
    modelProvider || process.env.DEFAULT_MODEL_PROVIDER || "openai";

  let model;
  if (provider === "google") {
    model = google("gemini-2.0-flash-exp");
  } else {
    model = openai("gpt-4o-mini");
  }

  const result = streamText({
    model,
    system:
      "You are a helpful AI assistant with access to various tools. Use the tools when appropriate to provide accurate and helpful information.",
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
