import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveChord } from '@nivo/chord';
import AIAnalysis from '@/components/AIAnalysis';
import ChatStatistic from './ChatStatistics';

interface Stats {
    total_messages: number;
    days_active: number | null;
    user_message_count: { [username: string]: number };
    most_active_users_pct: { [username: string]: number };
    conversation_starters_pct: { [username: string]: number };
    most_ignored_users_pct: { [username: string]: number };
    first_text_champion: {
        user: string | null;
        count: number;
    };
    longest_monologue: {
        user: string | null;
        count: number;
    };
    common_words: { [word: string]: number };
    common_emojis: { [emoji: string]: number };
    average_response_time_minutes: number;
    peak_hour: number | null;
    user_monthly_activity: Array<{}>;
    weekday_vs_weekend_avg: {
        average_weekday_messages: number;
        average_weekend_messages: number;
        difference: number;
        percentage_difference: number;
    };
    user_interaction_matrix: (string | number | null)[][] | null;
}

interface PersonAnalysis {
    name: string;
    animal: string;
    description: string;
    fun_lines?: string[];
}

interface AiAnalysisData {
    summary: string;
    people?: PersonAnalysis[];
    error?: string;
}

interface AnalysisResults {
    chat_name?: string;
    stats: Stats;
    ai_analysis: AiAnalysisData | null;
    processing_time_seconds?: number;
    error?: string;
}

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
}

const bgColorsShareable: { [key: string]: string } = {
    'bg-rose-100': '#FFE4E6',
    'bg-green-100': '#D1FAE5',
    'bg-pink-100': '#FCE7F3',
    'bg-purple-100': '#F3E8FF',
    'bg-sky-100': '#E0F2FE',
    'bg-violet-100': '#EDE9FE',
};
const tailwindBgClasses = Object.keys(bgColorsShareable);

const getShareableCharSize = (count: number, text: string, topWords: { text: string; value: number }[], containerWidth: number) => {
    const minCharSizeRem = 0.8;
    const absoluteMaxCharSizeRem = 3.5;
    const baseFontSizePx = 16;

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
        const estimatedFontSizePx = (availableWidthForWordPx - (N > 1 ? (N - 1) * 4 : 0) - N * 2) / (N * 0.8); // char width factor, spacing factor
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
    ({ results, topWords, sortedEmojis, chordMatrix, chordKeys, formatPeakHour, formatFirstTextChampion, formatMostIgnored, wordCloudContainerWidth }, ref) => {
        if (!results || !results.stats) {
            return <div ref={ref} className="p-5 font-sans">No data available for sharing.</div>;
        }

        return (
            <div
                ref={ref}
                className="w-[1200px] bg-[#fffbeb] p-8 box-border font-sans text-gray-900 leading-relaxed"
            >
                {/* Branding */}
                <div className="flex justify-center items-center mb-6 gap-4">
                    <img src="/bloop_logo.svg" alt="Bloop Logo" className="h-12" />
                    <p className="text-lg font-semibold text-[#232F61] m-0">
                        generate your own at bloopit.vercel.app
                    </p>
                </div>

                {/* Title */}
                <h1 className="text-2xl mb-6 text-gray-800 text-center font-bold">
                    {results.chat_name ? (
                        <>Analysis of chats with <strong className="text-[#1A365D]">{results.chat_name}</strong></>
                    ) : "Analysis Results"}
                </h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <ChatStatistic title="you guys have sent" value={`${results.stats.total_messages.toLocaleString()} messages`} icon="chat.svg" altText="Total Messages" bgColor="bg-purple-100" textColor="text-violet-800" />
                    <ChatStatistic title="you've been chatting for" value={`${results.stats.days_active ?? 'N/A'} ${results.stats.days_active === 1 ? 'day' : 'days'}`} icon="calendar.svg" altText="Days Active" bgColor="bg-green-100" textColor="text-green-800" />
                    <ChatStatistic title="who gets ghosted the most?" value={formatMostIgnored(results.stats.most_ignored_users_pct)} icon="frown.svg" altText="Most Ignored" bgColor="bg-sky-100" textColor="text-sky-800" />
                    <ChatStatistic title="when does your conversations peak?" value={formatPeakHour(results.stats.peak_hour)} icon="peak.svg" altText="Peak Hour" bgColor="bg-sky-100" textColor="text-sky-900" />
                    <ChatStatistic title="who texts first usually?" value={formatFirstTextChampion(results.stats.first_text_champion)} icon="trophy.svg" altText="First Texter" bgColor="bg-violet-100" textColor="text-violet-800" />
                    <ChatStatistic title="you get the reply back in" value={`~${results.stats.average_response_time_minutes.toFixed(1)} mins`} icon="time.svg" altText="Avg Response Time" bgColor="bg-rose-100" textColor="text-rose-800" />
                </div>

                {/* Top words and emojis */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border-[1.5px] border-gray-800 rounded-lg bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)]">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-800">Top {topWords.length} Words</h2>
                            <img src="/icons/words.svg" alt="Common Words" className="w-7 h-7" />
                        </div>
                        <div className="w-full flex flex-col items-start gap-2 pt-2">
                            {topWords.length > 0 ? topWords.map(({ text, value }, wordIndex) => {
                                const bgColorKey = tailwindBgClasses[wordIndex % tailwindBgClasses.length];
                                const bgColor = bgColorsShareable[bgColorKey] || '#E0E7FF';
                                const charSize = getShareableCharSize(value, text, topWords, wordCloudContainerWidth);
                                return (
                                    <div key={text} className="flex items-baseline gap-1" title={`${text}: ${value} uses`}>
                                        <div className="flex gap-1">
                                            {text.split('').map((char, charIdx) => (
                                                <span key={`${text}-${charIdx}`} className="flex items-center justify-center rounded-sm font-bold text-gray-900" style={{
                                                    backgroundColor: bgColor, fontSize: charSize,
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

                    <div className="p-4 border-[1.5px] border-gray-800 rounded-lg bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-800">Top Emojis</h2>
                            <img src="/icons/lovely_face.svg" alt="Common Emojis" className="w-7 h-7" />
                        </div>
                        <div className="flex-grow flex items-center justify-center">
                            {sortedEmojis.length > 0 ? (
                                <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full items-center justify-center py-4">
                                    {sortedEmojis.slice(0, 6).map(({ emoji, count }) => (
                                        <span key={emoji} className="flex items-center justify-center text-6xl" title={`${emoji}: ${count}`}>{emoji}</span>
                                    ))}
                                </div>
                            ) : <p className="text-gray-600 text-center">No common emojis.</p>}
                        </div>
                    </div>
                </div>

                {/* AI Summary, Weekday/Weekend Pie, Interaction Matrix */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border-[1.5px] border-gray-800 rounded-lg bg-purple-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)]">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-800">AI Summary</h2>
                            <img src="/icons/sparkle.svg" alt="AI Analysis" className="w-7 h-7" />
                        </div>
                        <AIAnalysis summary={results.ai_analysis?.summary || 'Summary not available.'} people={[]} summaryOnly={true} useSimpleStyles={true} />
                    </div>

                    {/* Conditional rendering for Pie or Chord */}
                    {results.stats.most_active_users_pct && Object.keys(results.stats.most_active_users_pct).length <= 2 ? (
                        <div className="p-4 border-[1.5px] border-gray-800 rounded-lg bg-sky-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)]">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-gray-800">Weekday vs Weekend</h2>
                                <img src="/icons/tag.svg" alt="Activity" className="w-7 h-7" />
                            </div>
                            <div className="h-[280px]">
                                <ResponsivePie
                                    data={[
                                        { id: 'Weekday', label: 'Weekday', value: results.stats.weekday_vs_weekend_avg.average_weekday_messages },
                                        { id: 'Weekend', label: 'Weekend', value: results.stats.weekday_vs_weekend_avg.average_weekend_messages },
                                    ]}
                                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                    innerRadius={0.1} padAngle={0.7} cornerRadius={3} activeOuterRadiusOffset={8} borderWidth={1}
                                    colors={{ scheme: 'set3' }} enableArcLabels={true} arcLabel={e => `${e.id}`} enableArcLinkLabels={false}
                                    animate={false} isInteractive={false}
                                    theme={{ labels: { text: { fontSize: 12, fontWeight: 600 } } }}
                                />
                            </div>
                        </div>
                    ) : results.stats.user_interaction_matrix && chordKeys.length > 2 && chordMatrix.length > 2 ? (
                        <div className="p-4 border-[1.5px] border-gray-800 rounded-lg bg-green-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)]">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-gray-800">Interaction Matrix</h2>
                                <img src="/icons/users_group.svg" alt="Interactions" className="w-7 h-7" />
                            </div>
                            <div className="h-[280px] w-full">
                                <ResponsiveChord
                                    data={chordMatrix} keys={chordKeys}
                                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                    valueFormat=".0f" padAngle={0.05} innerRadiusRatio={0.94} innerRadiusOffset={0.02}
                                    arcBorderWidth={1} arcBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
                                    enableLabel={true} label={d => d.id.substring(0, 5)} labelOffset={10} labelRotation={-90}
                                    colors={{ scheme: 'nivo' }} isInteractive={false} animate={false}
                                    theme={{ labels: { text: { fontSize: 10, fontWeight: 500 } } }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 border-[1.5px] border-gray-800 rounded-lg bg-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] flex items-center justify-center">
                            <p className="text-gray-500 text-base">Additional chart data not applicable.</p>
                        </div>
                    )}
                </div>

                {/* People animal assignment */}
                <div className="bg-green-100 p-5 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.7)] border-[1.5px] border-gray-800 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800">What Kinda Animal Are You?</h2>
                        <img src="/icons/sparkle.svg" alt="AI Personas" className="w-7 h-7" />
                    </div>
                    <AIAnalysis summary="" people={results.ai_analysis?.people || []} profilesOnly={true} useSimpleStyles={true} />
                </div>
            </div>
        );
    }
);

ShareableResults.displayName = 'ShareableResults';
export default ShareableResults;
