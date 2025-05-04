import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

interface ImageRequest {
  prompt: string;
}

interface ImageResponse {
  output: string[];
  error?: never;
}

interface ErrorResponse {
  error: string;
  output?: never;
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest): Promise<NextResponse<ImageResponse | ErrorResponse>> {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "The REPLICATE_API_TOKEN environment variable is not set" },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await request.json() as ImageRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt,
          image_dimensions: "512x512",
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          scheduler: "DPMSolverMultistep",
        },
      }
    );

    if (!Array.isArray(output)) {
      return NextResponse.json(
        { error: "Invalid response from Replicate API" },
        { status: 500 }
      );
    }

    return NextResponse.json({ output }, { status: 200 });
  } catch (error) {
    console.error("Error from Replicate API:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
