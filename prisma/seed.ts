import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Model Providers
  await prisma.modelProvider.upsert({
    where: { name: "openai" },
    update: {},
    create: {
      name: "openai",
      displayName: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY || null,
      models: JSON.stringify([
        { id: "gpt-4o", name: "GPT-4o", isDefault: false },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", isDefault: true },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo", isDefault: false },
      ]),
    },
  });

  await prisma.modelProvider.upsert({
    where: { name: "google" },
    update: {},
    create: {
      name: "google",
      displayName: "Google Gemini",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || null,
      models: JSON.stringify([
        {
          id: "gemini-2.0-flash-exp",
          name: "Gemini 2.0 Flash",
          isDefault: true,
        },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isDefault: false },
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isDefault: false },
      ]),
    },
  });

  console.log("✅ Model providers seeded");

  // Seed Default Agent
  await prisma.agent.create({
    data: {
      name: "Default Assistant",
      description: "A helpful AI assistant with access to various tools",
      systemPrompt:
        "You are a helpful AI assistant with access to various tools and multi-modal capabilities. Use the tools when appropriate to provide accurate and helpful information. You have access to local tools (like getWeather, getCurrentTime, calculate, searchInfo) and MCP tools (like git operations and filesystem operations). When using MCP tools, the tool names are prefixed with the server name (e.g., 'git_status', 'filesystem_read_file'). You can also process and analyze various file types including PDFs, documents (docx), spreadsheets (xlsx), text files, images, videos, and audio files. When users share files with you, analyze their contents and provide helpful insights.",
      mcpServerConfig: JSON.stringify({
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
          description: "Provides filesystem access operations",
        },
      }),
      disabledMcpServer: JSON.stringify([]),
      config: JSON.stringify({
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
      }),
    },
  });

  console.log("✅ Default agent seeded");

  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
