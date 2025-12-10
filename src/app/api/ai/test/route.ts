import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mainProductImg = formData.get('mainProductImg');
    const dotImgs = formData.getAll('dotImg');

    if (!mainProductImg) {
      return NextResponse.json({ error: 'Main product image is required' }, { status: 400 });
    }

    if (!dotImgs || dotImgs.length === 0) {
      return NextResponse.json({ error: 'At least one dot image is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Helper to process image input (File or URL string)
    const processImage = async (input: FormDataEntryValue, maxDimension = 1024): Promise<{ data: string; mimeType: string; name: string }> => {
      let buffer: Buffer;
      let mimeType: string;
      let name: string;

      if (input instanceof File) {
        buffer = Buffer.from(await input.arrayBuffer());
        mimeType = input.type;
        name = input.name;
      } else if (typeof input === 'string') {
        // Assume it's a URL
        const response = await fetch(input);
        if (!response.ok) throw new Error(`Failed to fetch image from URL: ${input}`);
        buffer = Buffer.from(await response.arrayBuffer());
        mimeType = response.headers.get('content-type') || 'image/jpeg';
        name = input.split('/').pop() || 'image.jpg';
      } else {
        throw new Error('Invalid image input');
      }

      // Resize image using sharp
      try {
        const resizedBuffer = await sharp(buffer)
          .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();

        // Update buffer and mimeType (sharp outputs jpeg/png depending on input, but let's keep original if possible or convert to common format if needed. 
        // Sharp preserves format by default if not specified, but .toBuffer() returns the raw buffer of the processed image.
        // We should probably ensure it's a supported format for Gemini (JPEG, PNG, WEBP, HEIC, HEIF).
        // Let's convert to JPEG for consistency and compression if it's not already.
        // Actually, let's just use the output buffer. Sharp defaults to input format if possible, or we can force jpeg/png.
        // Let's force jpeg for simplicity and size.
        const finalBuffer = await sharp(buffer)
          .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        return {
          data: finalBuffer.toString('base64'),
          mimeType: 'image/jpeg',
          name: name
        };
      } catch (error) {
        console.error("Error resizing image:", error);
        // Fallback to original if resizing fails (though unlikely with sharp)
        return {
          data: buffer.toString('base64'),
          mimeType,
          name
        };
      }
    };

    // Process main product image
    const mainProductProcessed = await processImage(mainProductImg);
    const mainProductPart = {
      inlineData: {
        data: mainProductProcessed.data,
        mimeType: mainProductProcessed.mimeType,
      },
    };

    const results = {
      mainProduct: mainProductProcessed.name,
      dotProducts: [] as Array<{
        imageName: string;
        position: { left: string; top: string } | null;
        rawResponse: string;
        retryDelay?: string;
      }>,
    };

    // Process each dot image with the main product image
    for (const dotImgInput of dotImgs) {
      let dotImgName = 'unknown';
      try {
        const dotProcessed = await processImage(dotImgInput);
        dotImgName = dotProcessed.name;

        const dotPart = {
          inlineData: {
            data: dotProcessed.data,
            mimeType: dotProcessed.mimeType,
          },
        };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [
            mainProductPart, // First image: the environment (main product)
            dotPart,         // Second image: the object (dot product)
            `The first image is the main environment image. The second image is an object that appears within that environment.
            
            Task: Find the center point of the object (from the second image) inside the environment (first image).
            
            Output Requirements:
            - Provide the position as relative percentages of the environment image's width and height.
            - Format the output EXACTLY as: "Left: <X>%, Top: <Y>%" where X and Y are numbers (decimals allowed).
            - If the object is not found, return "Not found".`
          ],
        });

        const rawResponse = response.text || 'No response generated';

        // Parse the response to extract Left % and Top % values
        const leftMatch = rawResponse.match(/Left:?\s*([\d.]+)\s*%/i);
        const topMatch = rawResponse.match(/Top:?\s*([\d.]+)\s*%/i);

        const position = leftMatch && topMatch ? {
          left: leftMatch[1] + '%',
          top: topMatch[1] + '%'
        } : null;

        results.dotProducts.push({
          imageName: dotImgName,
          position,
          rawResponse
        });

        console.log(`Processed dot image: ${dotImgName} | Position: ${position ? `Left: ${position.left}, Top: ${position.top}` : 'Not found'}`);

      } catch (imageError) {
        console.error(`Error processing dot image ${dotImgName}:`, imageError);

        let retryDelay: string | undefined;
        const errorMessage = imageError instanceof Error ? imageError.message : String(imageError);

        // Extract retryDelay if present (e.g. "retryDelay":"49s")
        const retryDelayMatch = errorMessage.match(/"retryDelay"\s*:\s*"([^"]+)"/);
        if (retryDelayMatch) {
          retryDelay = retryDelayMatch[1];
        }

        results.dotProducts.push({
          imageName: dotImgName,
          position: null,
          rawResponse: `Error processing ${dotImgName}: ${errorMessage}`,
          retryDelay
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      processedCount: {
        mainProduct: 1,
        dotProducts: results.dotProducts.length
      },
      summary: {
        mainProductName: mainProductProcessed.name,
        dotImagesProcessed: results.dotProducts.length,
        positionsFound: results.dotProducts.filter(dp => dp.position !== null).length,
        failCount: results.dotProducts.filter(dp => dp.position === null).length
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
