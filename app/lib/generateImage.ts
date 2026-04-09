import crypto from "crypto";

const cache = new Map<string, string>(); // Cache base64 results

async function getFallbackImage(prompt: string): Promise<string | null> {
  try {
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`;
    const response = await fetch(fallbackUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (err) {
    console.error("Fallback image fetch failed:", err);
    return null;
  }
}

/**
 * Generate image using nanobanana API
 * Uses async polling: submit task -> poll status -> return image URL
 * Falls back to Pollinations AI if NanoBanana fails.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  const cacheKey = crypto.createHash("md5").update(prompt).digest("hex");

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const API_KEY = process.env.NANOBANANA_API_KEY;
    if (!API_KEY || API_KEY === "your_nanobanana_api_key_here") {
      const fallbackImg = await getFallbackImage(prompt);
      if (fallbackImg) cache.set(cacheKey, fallbackImg);
      return fallbackImg;
    }

    // Step 1: Submit generation task
    const submitRes = await fetch(
      "https://api.nanobananaapi.ai/api/v1/nanobanana/generate-2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          imageUrls: [],
          aspectRatio: "1:1",
          resolution: "1K",
          outputFormat: "jpg",
        }),
      }
    );

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("nanobanana submit error:", submitRes.status, errText);
      const fallbackImg = await getFallbackImage(prompt);
      if (fallbackImg) cache.set(cacheKey, fallbackImg);
      return fallbackImg;
    }

    const submitData = await submitRes.json();
    
    // NanoBanana API sometimes returns 200 HTTP status but an error in the payload
    if (submitData?.code && submitData.code !== 200 && submitData.code !== 0) {
      console.error("nanobanana API error in submit:", submitData);
      const fallbackImg = await getFallbackImage(prompt);
      if (fallbackImg) cache.set(cacheKey, fallbackImg);
      return fallbackImg;
    }

    const taskId = submitData?.data?.taskId;

    if (!taskId) {
      console.error("No taskId in nanobanana response", submitData);
      const fallbackImg = await getFallbackImage(prompt);
      if (fallbackImg) cache.set(cacheKey, fallbackImg);
      return fallbackImg;
    }

    // Step 2: Poll for completion (max 30 seconds, check every 2 seconds)
    const maxAttempts = 15;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(
        `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`,
        {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
          },
        }
      );

      if (!statusRes.ok) {
        console.error("nanobanana status error:", statusRes.status);
        continue;
      }

      const statusData = await statusRes.json();
      const status = statusData?.data?.status;

      // Status: 0=GENERATING, 1=SUCCESS, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED
      if (status === "1" || status === 1) {
        // Success - extract image URL
        const imageUrl = statusData?.data?.url;
        if (imageUrl) {
          cache.set(cacheKey, imageUrl);
          return imageUrl;
        }
        // Some responses use imageUrls array
        const imageUrls = statusData?.data?.imageUrls;
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
          const url = imageUrls[0];
          cache.set(cacheKey, url);
          return url;
        }
        break; // If no URL found despite success status, trigger fallback
      }

      if (status === "2" || status === 2 || status === "3" || status === 3) {
        console.error("nanobanana generation failed:", statusData);
        break; // Break out of polling to hit fallback below
      }

      // Status 0 = still generating, continue polling
    }

    console.error("nanobanana polling timeout or failed task. Using fallback.");
    const fallbackImg = await getFallbackImage(prompt);
    if (fallbackImg) cache.set(cacheKey, fallbackImg);
    return fallbackImg;

  } catch (err) {
    console.error("Image generation failed:", err);
    const fallbackImg = await getFallbackImage(prompt);
    if (fallbackImg) cache.set(cacheKey, fallbackImg);
    return fallbackImg;
  }
}
