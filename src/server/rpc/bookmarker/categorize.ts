import { os } from "@orpc/server";
import { z } from "zod";

const MODEL = "nvidia/llama-3.1-nemotron-nano-8b-v1";

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
    const apiKey = process.env.NVIDIA_API_KEY;

    // Fallback when no API key is configured
    if (!apiKey) {
      const urlObj = new URL(input.url);
      const hostname = urlObj.hostname.replace(/^www\./, "");
      return {
        title: hostname,
        category: "Other",
      };
    }

    const categoriesList = CATEGORIES.join(", ");

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: `You are a URL categorization assistant. Given a URL, you must respond with exactly two lines:\nLine 1: A short, clean bookmark title.\nLine 2: The best category from this list: ${categoriesList}\n\nRules:\n- If the URL suggests a programming/dev site, prefer "Development" over "Technology"\n- If the URL is clearly a news article, categorize as "News"\n- Default to "Other" only if nothing fits well`,
            },
            {
              role: "user",
              content: `Categorize this URL: ${input.url}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 100,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const text = data.choices[0]?.message?.content ?? "";

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