import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { os } from "@orpc/server";
import { z } from "zod";

const MODEL = "openrouter/auto";

const CATEGORIES = [
  "News",
  "Technology",
  "Development",
  "Science",
  "Education",
  "Entertainment",
  "Social Media",
  "Shopping",
  "Finance",
  "Health",
  "Travel",
  "Food",
  "Sports",
  "Reference",
  "Tools",
  "Other",
] as const;

const categorize = os
  .input(
    z.object({
      url: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;

    // Fallback when no API key is configured
    if (!apiKey) {
      const urlObj = new URL(input.url);
      const hostname = urlObj.hostname.replace(/^www\./, "");
      return {
        title: hostname,
        category: "Other",
      };
    }

    const openrouter = createOpenRouter({
      apiKey,
    });

    const categoriesList = CATEGORIES.join(", ");

    const { text } = await generateText({
      model: openrouter(MODEL),
      system: `You are a URL categorization assistant. Given a URL, you must respond with exactly two lines:
Line 1: A short, clean bookmark title.
Line 2: The best category from this list: ${categoriesList}

Rules:
- If the URL suggests a programming/dev site, prefer "Development" over "Technology"
- If the URL is clearly a news article, categorize as "News"
- Default to "Other" only if nothing fits well`,
      prompt: `Categorize this URL: ${input.url}`,
      temperature: 0.1,
    });

    const lines = text.trim().split("\n");
    const title = lines[0]?.trim() || input.url;
    const rawCategory = lines[1]?.trim() || "Other";

    // Normalize category to match our valid list
    const found = CATEGORIES.find(
      (c) => c.toLowerCase() === rawCategory.toLowerCase()
    );
    const category = found || "Other";

    return { category, title };
  });

export const router = {
  categorize,
};