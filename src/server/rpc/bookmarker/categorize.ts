import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { os } from "@orpc/server";
import { z } from "zod";

const MODEL = "openrouter/auto";

// Predefined categories with descriptions to help the AI classify URLs
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

const CategorizeResultSchema = z.object({
  category: z
    .string()
    .describe(
      `The best category for this URL. Must be one of: ${CATEGORIES.join(", ")}`
    ),
  title: z.string().describe("A short, clean title for the bookmark"),
});

const categorize = os
  .input(
    z.object({
      url: z.string(),
    })
  )
  .handler(async ({ input }) => {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const { output } = await generateText({
      model: openrouter(MODEL),
      output: Output.object({
        schema: CategorizeResultSchema,
      }),
      system: `You are a URL categorization assistant. Given a URL, determine the most appropriate category and generate a clean title for the bookmark.

Available categories: ${CATEGORIES.join(", ")}

Rules:
- If the URL suggests a programming/dev site, prefer "Development" over "Technology"
- If the URL is clearly a news article, categorize as "News"
- If it's a specific tool or library, prefer the most specific category
- Default to "Other" only if nothing fits well`,
      prompt: `Categorize this URL and create a bookmark title: ${input.url}`,
    });

    // Ensure the category is one of the valid ones, fallback to "Other"
    const validCategories: readonly string[] = CATEGORIES;
    const category = validCategories.includes(output.category)
      ? output.category
      : "Other";

    return {
      category,
      title: output.title,
    };
  });

export const router = {
  categorize,
};