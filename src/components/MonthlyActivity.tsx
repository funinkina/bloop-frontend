import React from 'react';
import { ResponsiveLine } from '@nivo/line';

interface MonthlyActivityProps {
    userMonthlyActivity: Array<{
        id: string;
        data: Array<{ x: string; y: number }>;
    }>;
}

const MonthlyActivity: React.FC<MonthlyActivityProps> = ({ userMonthlyActivity }) => {
    if (!userMonthlyActivity || userMonthlyActivity.length === 0) {
        return <p className="text-gray-600">No monthly activity data available.</p>;
    }

    const aggregatedData = userMonthlyActivity.reduce((acc, user) => {
        user.data.forEach(({ x, y }) => {
            const existing = acc.find((item) => item.x === x);
            if (existing) {
                existing.y += y;
            } else {
                acc.push({ x, y });
            }
        });
        return acc;
    }, [] as Array<{ x: string; y: number }>);

    const chartData = [{ id: 'Total Messages', data: aggregatedData }];

    return (
        <div className="h-96 w-full">
            <ResponsiveLine
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 70, left: 70 }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    format: (value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', {
                            month: 'short',
                            year: '2-digit',
                        });
                    },
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    legend: 'Messages',
                    legendOffset: -90,
                    legendPosition: 'middle',
                }}
                colors={{ scheme: 'set1' }}
                enablePoints={false}
                enableGridX={false}
                enableGridY={true}
                lineWidth={6}
                useMesh={true}
                curve="cardinal"
                legends={[]}
                theme={{
                    axis: {
                        ticks: {
                            text: {
                                fontSize: 12,
                                fill: '#333',
                            },
                        },
                        legend: {
                            text: {
                                fontSize: 14,
                                fill: '#666',
                            },
                        },
                    },
                }}
                tooltip={({ point }) => (
                    <div
                        style={{
                            background: 'white',
                            padding: '5px 10px',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                        }}
                    >
                        <strong>Date:</strong> {new Date(point.data.x).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                        })}<br />
                        <strong>Messages:</strong> {point.data.yFormatted}
                    </div>
                )}
            />
        </div>
    );
};

export default MonthlyActivity;