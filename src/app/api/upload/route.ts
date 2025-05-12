import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResults } from '@/lib/interfaces';

async function fetchWithUploadTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`Upload request to ${url} timed out after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms.`);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
    }

    console.log(`Received file for upload: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const apiKey = process.env.VAL_API_KEY;
    if (!apiKey) {
      console.error('VAL_API_KEY not configured in environment variables for upload.');
      return NextResponse.json({ message: 'API key configuration missing for backend communication.' }, { status: 500 });
    }

    const preferredUrlFromQuery = request.nextUrl.searchParams.get('preferredUrl');
    const backendUrl1 = process.env['BACKEND_URL-1'] || 'http://localhost:8000';
    const backendUrl2 = process.env['BACKEND_URL-2'] || 'http://localhost:8000';
    const uploadTimeout = 20000;

    let primaryUrl: string;
    let fallbackUrl: string;

    if (preferredUrlFromQuery) {
      if (preferredUrlFromQuery === backendUrl1) {
        primaryUrl = backendUrl1;
        fallbackUrl = backendUrl2;
      } else if (preferredUrlFromQuery === backendUrl2) {
        primaryUrl = backendUrl2;
        fallbackUrl = backendUrl1;
      } else {
        primaryUrl = backendUrl1;
        fallbackUrl = backendUrl2;
      }
    } else {
      primaryUrl = backendUrl1;
      fallbackUrl = backendUrl2;
    }

    const useFallback = primaryUrl !== fallbackUrl;

    let response: Response | null = null;
    let analysisResult: AnalysisResults | null = null;
    let lastErrorDetails: { message: string, error?: string, status: number } | null = null;

    console.log(`Attempting upload to primary backend: ${primaryUrl}/analyze/`);
    try {
      response = await fetchWithUploadTimeout(
        `${primaryUrl}/analyze/`,
        {
          method: 'POST',
          headers: { 'X-API-Key': apiKey },
          body: backendFormData,
        },
        uploadTimeout
      );

      if (response.ok) {
        analysisResult = await response.json();
      } else {
        const errorText = await response.text().catch(() => 'Failed to read error response from primary backend.');
        console.error(`Primary backend (${primaryUrl}) upload error: ${response.status} - ${errorText}`);
        lastErrorDetails = { message: `Primary backend (${primaryUrl}) failed to process file.`, error: errorText, status: response.status };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error connecting to primary backend (${primaryUrl}) for upload: ${errorMessage}`);
      lastErrorDetails = { message: `Error connecting to primary backend (${primaryUrl}) for upload.`, error: errorMessage, status: 503 };
    }

    if (!analysisResult && useFallback) {
      console.log(`Primary backend upload failed. Attempting upload to fallback backend: ${fallbackUrl}/analyze/`);
      try {
        response = await fetchWithUploadTimeout(
          `${fallbackUrl}/analyze/`,
          {
            method: 'POST',
            headers: { 'X-API-Key': apiKey },
            body: backendFormData,
          },
          uploadTimeout
        );

        if (response.ok) {
          analysisResult = await response.json();
          lastErrorDetails = null;
          console.log(`Upload to fallback backend (${fallbackUrl}) successful.`);
        } else {
          const errorText = await response.text().catch(() => 'Failed to read error response from fallback backend.');
          console.error(`Fallback backend (${fallbackUrl}) upload error: ${response.status} - ${errorText}`);
          lastErrorDetails = { message: `Fallback backend (${fallbackUrl}) also failed to process file.`, error: errorText, status: response.status };
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error connecting to fallback backend (${fallbackUrl}) for upload: ${errorMessage}`);
        lastErrorDetails = { message: `Error connecting to fallback backend (${fallbackUrl}) for upload.`, error: errorMessage, status: 503 };
      }
    } else if (!analysisResult && !useFallback && lastErrorDetails) {
      console.log(`Primary backend (${primaryUrl}) upload failed, and no distinct fallback URL was configured or necessary.`);
    }

    if (analysisResult) {
      return NextResponse.json(analysisResult, { status: 200 });
    }

    console.error('All backend upload attempts failed or the single attempt failed.', lastErrorDetails);
    const finalError = lastErrorDetails || { message: 'An unknown error occurred after attempting backend communication for upload.', error: 'Unknown backend error', status: 500 };
    return NextResponse.json({ message: finalError.message, error: finalError.error }, { status: finalError.status });

  } catch (error: unknown) {
    console.error('API Upload Route General Error (before backend calls):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the upload request preparation.';
    return NextResponse.json({ message: 'Failed to process upload request.', error: errorMessage }, { status: 500 });
  }
}
