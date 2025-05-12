import { NextResponse } from 'next/server';

interface BackendHealthResponse {
    ai_tasks_processing: number;
    ai_tasks_queued: number;
    ai_tasks_worker_capacity: number;
    status: string;
    [key: string]: unknown;
}

async function checkBackendHealth(url: string, timeoutMs: number): Promise<{ response: Response; data: BackendHealthResponse; url: string } | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.warn(`Health check to ${url}/health timed out after ${timeoutMs}ms`);
        controller.abort();
    }, timeoutMs);

    try {
        const res = await fetch(`${url}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn(`Health check to ${url}/health returned status ${res.status}. Body: ${await res.text().catch(() => '')}`);
            return null;
        }
        const data = await res.json();
        if (typeof data.ai_tasks_processing !== 'number' || typeof data.ai_tasks_queued !== 'number' || typeof data.ai_tasks_worker_capacity !== 'number' || typeof data.status !== 'string') {
            console.warn(`Health check to ${url}/health returned malformed data:`, data);
            return null;
        }
        return { response: res, data, url };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
        } else {
            console.warn(`Health check to ${url}/health failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        return null;
    }
}

export async function GET() {
    const backendUrl1 = process.env['BACKEND_URL_1'] || 'http://localhost:8000';
    const backendUrl2 = process.env['BACKEND_URL_2'] || 'http://localhost:8000';
    const healthCheckTimeout = 3000;

    let result = await checkBackendHealth(backendUrl1, healthCheckTimeout);

    if (!result && backendUrl1 !== backendUrl2) {
        console.log(`Primary backend (${backendUrl1}) health check failed or invalid, trying secondary backend (${backendUrl2}).`);
        result = await checkBackendHealth(backendUrl2, healthCheckTimeout);
    } else if (!result && backendUrl1 === backendUrl2) {
        console.log(`Backend (${backendUrl1}) health check failed or invalid, and no alternative configured.`);
    }

    if (result) {
        console.log(`Selected backend for health: ${result.url}`);
        return NextResponse.json({ ...result.data, selected_backend: result.url }, { status: result.response.status });
    } else {
        console.error('All backend health checks failed or returned invalid data.');
        return NextResponse.json({
            message: 'Failed to fetch health from any backend server.',
            details: 'No backend server is currently available or responding correctly to health checks.',
            status_code: 503,
            selected_backend: backendUrl1
        }, { status: 503 });
    }
}