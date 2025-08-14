import { action } from "./_generated/server";
import { v } from "convex/values";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const generateTitle = action({
  args: {
    textContent: v.array(v.string()),
    fileNames: v.array(v.string()),
  },
  handler: async (ctx, { textContent, fileNames }) => {
    try {
      // Filter out empty content
      const validContent = textContent.filter(Boolean);

      if (!validContent || validContent.length === 0) {
        // Fallback to filename-based title
        const fallbackTitle = fileNames.length === 1
          ? fileNames[0].replace(/\.pdf$/i, '')
          : `${fileNames.length} Documents`;

        return {
          title: fallbackTitle,
          generated: false
        };
      }

      // Combine text content for analysis
      const combinedText = validContent
        .join(' ')
        .trim()
        .substring(0, 2000); // Limit to 2000 chars for API efficiency

      if (!combinedText) {
        // Fallback to filename-based title
        const fallbackTitle = fileNames.length === 1
          ? fileNames[0].replace(/\.pdf$/i, '')
          : `${fileNames.length} Documents`;

        return {
          title: fallbackTitle,
          generated: false
        };
      }

      // Generate title using OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at creating concise, descriptive titles for PDF documents. 
            Generate a clear, informative title (max 60 characters) that captures the main topic or purpose of the document content.
            
            Rules:
            - Keep it under 60 characters
            - Make it descriptive and specific
            - Avoid generic words like "Document" or "PDF"
            - Focus on the main topic or subject matter
            - Use title case
            - No quotes or special formatting`
          },
          {
            role: "user",
            content: `Generate a title for this document content:\n\n${combinedText}`
          }
        ],
        max_tokens: 50,
        temperature: 0.3,
      });

      const generatedTitle = response.choices[0]?.message?.content?.trim();

      if (!generatedTitle || generatedTitle.length < 3) {
        // Fallback to filename-based title if AI generation fails
        const fallbackTitle = fileNames.length === 1
          ? fileNames[0].replace(/\.pdf$/i, '')
          : `${fileNames.length} Documents`;

        return {
          title: fallbackTitle,
          generated: false
        };
      }

      // Clean up the generated title
      let cleanTitle = generatedTitle
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/\.$/, '') // Remove trailing period
        .trim();

      // Ensure reasonable length
      if (cleanTitle.length > 60) {
        cleanTitle = cleanTitle.substring(0, 57) + '...';
      }

      return {
        title: cleanTitle,
        generated: true
      };

    } catch (error) {
      console.error("Title generation error:", error);

      // Return fallback title on error
      const fallbackTitle = fileNames.length === 1
        ? fileNames[0].replace(/\.pdf$/i, '')
        : `${fileNames.length} Documents`;

      return {
        title: fallbackTitle,
        generated: false,
        error: "Failed to generate AI title"
      };
    }
  },
});