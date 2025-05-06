import { NextResponse } from 'next/server';

interface BackendHealthResponse {
    ai_tasks_processing: number;
    ai_tasks_queued: number;
    ai_tasks_worker_capacity: number;
    status: string;
    [key: string]: unknown;
}

export async function GET() {
    try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { message: await response.text() };
            }
            console.error('Backend health check failed:', response.status, errorData);
            return NextResponse.json({
                message: 'Failed to fetch health from backend.',
                details: errorData.message || 'No additional error details.',
                status_code: response.status
            }, { status: response.status });
        }

        const healthData: BackendHealthResponse = await response.json();
        return NextResponse.json(healthData, { status: 200 });

    } catch (error: unknown) {
        console.error('API Health Route Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while checking backend health.';
        return NextResponse.json({ message: 'Failed to process health check.', error: errorMessage }, { status: 500 });
    }
}