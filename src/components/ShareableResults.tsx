import React from 'react';
import AIAnalysis from '@/components/AIAnalysis';
import ChatStatistic from './ChatStatistics';
import MonthlyActivity from '@/components/MonthlyActivity';
import Image from 'next/image';
import {
    Stats,
    AnalysisResults,
} from '@/lib/interfaces';

interface ShareableResultsProps {
    results: AnalysisResults;
    topWords: { text: string; value: number }[];
    sortedEmojis: { emoji: string; count: number }[];
    chordMatrix: number[][];
    chordKeys: string[];
    formatPeakHour: (hour: number | null) => string;
    formatFirstTextChampion: (champion: Stats['first_text_champion']) => string;
    formatMostIgnored: (ignoredData: Stats['most_ignored_users_pct']) => string;
    wordCloudContainerWidth: number;
    selectedSections: string[];
}

const availableBgColors = [
    'bg-rose-100',
    'bg-green-100',
    'bg-pink-100',
    'bg-purple-100',
    'bg-sky-100',
    'bg-violet-100',
];

const getRandomBgColor = () => availableBgColors[Math.floor(Math.random() * availableBgColors.length)];

const getCharSize = (count: number, text: string, topWords: { text: string; value: number }[], containerWidth: number) => {
    const minCharSizeRem = 0.9;
    const absoluteMaxCharSizeRem = 6;
    const baseFontSizePx = 20;

    if (!containerWidth || topWords.length === 0) {
        return `${minCharSizeRem}rem`;
    }
    const topWord = topWords[0];
    if (!topWord) return `${minCharSizeRem}rem`;

    const N = topWord.text.length;
    const frequencyCountWidthEstimatePx = 40;
    const availableWidthForWordPx = Math.max(10, containerWidth - frequencyCountWidthEstimatePx);

    let idealFontSizeRem = absoluteMaxCharSizeRem;
    if (N > 0) {
        const estimatedFontSizePx = (availableWidthForWordPx - (N > 1 ? (N - 1) * 4 : 0) - N * 2) / (N * 0.8);
        idealFontSizeRem = Math.max(minCharSizeRem, estimatedFontSizePx / baseFontSizePx);
    }

    const dynamicMaxCharSizeRem = Math.min(absoluteMaxCharSizeRem, idealFontSizeRem);

    if (text === topWord.text) {
        return `${Math.max(minCharSizeRem, dynamicMaxCharSizeRem).toFixed(2)}rem`;
    }

    const minCountDisplayed = topWords.length > 0 ? topWords[topWords.length - 1].value : 1;
    const effectiveMaxCount = Math.max(topWord.value, 1);
    const effectiveMinCount = Math.max(minCountDisplayed, 1);

    if (effectiveMaxCount <= effectiveMinCount || count <= effectiveMinCount) {
        return `${minCharSizeRem}rem`;
    }

    const scale = (count - effectiveMinCount) / (effectiveMaxCount - effectiveMinCount);
    const size = minCharSizeRem + (dynamicMaxCharSizeRem - minCharSizeRem) * scale;
    const clampedSize = Math.max(minCharSizeRem, Math.min(dynamicMaxCharSizeRem, size));
    return `${clampedSize.toFixed(2)}rem`;
};


const ShareableResults = React.forwardRef<HTMLDivElement, ShareableResultsProps>(
    ({ results, topWords, sortedEmojis, formatPeakHour, formatFirstTextChampion, formatMostIgnored, wordCloudContainerWidth, selectedSections }, ref) => {
        if (!results || !results.stats) {
            return <div ref={ref} className="p-5">No data available for sharing.</div>;
        }

        const formattedMonthlyActivity = results.stats.user_monthly_activity.map(activity => ({
            id: 'id' in activity && typeof activity.id === 'string' ? activity.id : 'Unknown',
            data: 'data' in activity && Array.isArray(activity.data) ? activity.data : [],
        }));

        return (
            <div
                ref={ref}
                className="w-[1200px] bg-amber-50 p-4 box-border font-sans text-gray-900 leading-relaxed"
            >
                <div className="flex justify-center items-end mb-6 gap-8">
                    <Image src="/bloop_logo.svg" alt="Bloop Logo" width={150} height={150} />
                    <p className="text-xl text-[#232F61] m-0">
                        generate your own at <strong>bloopit.vercel.app</strong>
                    </p>
                </div>

                <h1 className="text-4xl mb-6 text-gray-800 text-center">
                    {results.chat_name ? (
                        <>Analysis of chats with <strong className="text-[#1A365D]">{results.chat_name}</strong></>
                    ) : "Analysis Results"}
                </h1>

                {/* Stats Grid */}
                {selectedSections.includes('chatStatistics') && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <ChatStatistic title="you guys have sent" value={`${results.stats.total_messages.toLocaleString()} messages`} icon="chat.svg" altText="Total Messages" bgColor="bg-purple-100" textColor="text-violet-800" />
                        <ChatStatistic title="you've been chatting for" value={`${results.stats.days_active ?? 'N/A'} ${results.stats.days_active === 1 ? 'day' : 'days'}`} icon="calendar.svg" altText="Days Active" bgColor="bg-green-100" textColor="text-green-800" />
                        <ChatStatistic title="who gets ghosted the most?" value={formatMostIgnored(results.stats.most_ignored_users_pct)} icon="frown.svg" altText="Most Ignored" bgColor="bg-sky-100" textColor="text-sky-800" />
                        <ChatStatistic title="peak convos at?" value={formatPeakHour(results.stats.peak_hour)} icon="peak.svg" altText="Peak Hour" bgColor="bg-sky-100" textColor="text-sky-900" />
                        <ChatStatistic title="who texts first usually?" value={formatFirstTextChampion(results.stats.first_text_champion)} icon="trophy.svg" altText="First Texter" bgColor="bg-violet-100" textColor="text-violet-800" />
                        <ChatStatistic title="you get the reply back in" value={`~${results.stats.average_response_time_minutes.toFixed(1)} mins`} icon="time.svg" altText="Avg Response Time" bgColor="bg-rose-100" textColor="text-rose-800" />
                    </div>
                )}

                {/* Top words and emojis */}
                {selectedSections.includes('topWordsEmojis') && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 border-1 border-gray-800 rounded-lg bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)]">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-gray-800">Top {topWords.length} Words</h2>
                                <Image src="/icons/words.svg" alt="Common Words" width={28} height={28} className="w-7 h-7" />
                            </div>
                            <div className="w-full flex flex-col items-start gap-2 pt-2">
                                {topWords.length > 0 ? topWords.map(({ text, value }) => {
                                    const wordBgColor = getRandomBgColor();
                                    const charSize = getCharSize(value, text, topWords, wordCloudContainerWidth);
                                    return (
                                        <div key={text} className="flex items-baseline gap-1" title={`${text}: ${value} uses`}>
                                            <div className="flex gap-1">
                                                {text.split('').map((char, charIdx) => (
                                                    <span key={`${text}-${charIdx}`} className={`flex items-center justify-center rounded-sm font-bold text-gray-900 ${wordBgColor}`} style={{
                                                        fontSize: charSize,
                                                        width: `calc(${charSize} + 0.4rem)`, height: `calc(${charSize} + 0.4rem)`, lineHeight: '1'
                                                    }}>
                                                        {char}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="ml-1 text-xs text-gray-600 font-medium">x{value}</span>
                                        </div>
                                    );
                                }) : <p className="text-gray-600">No common words.</p>}
                            </div>
                        </div>

                        <div className="p-4 border-1 border-gray-800 rounded-lg bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-gray-800">Top Emojis</h2>
                                <Image src="/icons/lovely_face.svg" alt="Common Emojis" width={28} height={28} className="w-7 h-7" />
                            </div>
                            <div className="flex-grow flex items-center justify-center">
                                {sortedEmojis.length > 0 ? (
                                    <div className="grid grid-cols-3 grid-rows-2 gap-16 w-full items-center justify-between py-4">
                                        {sortedEmojis.slice(0, 6).map(({ emoji, count }) => (
                                            <span key={emoji} className={`flex items-center justify-center text-8xl p-2 rounded-md`} title={`${emoji}: ${count}`}>{emoji}</span>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-600 text-center">No common emojis.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Summary */}
                {selectedSections.includes('aiAnalysis') && (
                    <div className="p-4 w-full border-1 border-gray-800 rounded-lg bg-purple-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-800">AI Summary</h2>
                            <Image src="/icons/sparkle.svg" alt="AI Analysis" width={28} height={28} className="w-7 h-7" />
                        </div>
                        <AIAnalysis summary={results.ai_analysis?.summary || 'Summary not available.'} people={[]} summaryOnly={true} useSimpleStyles={true} />
                    </div>
                )}

                {/* People animal assignment */}
                {selectedSections.includes('animalAssignment') && (
                    <div className="bg-green-100 p-5 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] border-[1.5px] border-gray-800 mb-6 w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">What Kinda Animal Are You?</h2>
                            <Image src="/icons/sparkle.svg" alt="AI Personas" width={28} height={28} className="w-7 h-7" />
                        </div>
                        <AIAnalysis summary="" people={results.ai_analysis?.people || []} profilesOnly={true} useSimpleStyles={true} />
                    </div>
                )}

                {/* User Monthly Activity */}
                {selectedSections.includes('overTimeGraph') && results.stats.user_monthly_activity && results.stats.user_monthly_activity.length > 0 && (
                    <div className="p-4 border-1 border-gray-800 rounded-lg bg-pink-50 w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)]">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-800">Monthly Activity</h2>
                            <Image src="/icons/graph_def.svg" alt="Monthly Activity" width={28} height={28} className="w-7 h-7" />
                        </div>
                        <MonthlyActivity userMonthlyActivity={formattedMonthlyActivity} />
                    </div>
                )}

            </div>
        );
    }
);

ShareableResults.displayName = 'ShareableResults';
export default ShareableResults;
