"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import domtoimage from 'dom-to-image';
import { ResponsiveChord } from '@nivo/chord';
import { ResponsivePie } from '@nivo/pie';
import AIAnalysis from '@/components/AIAnalysis';
import ChatStatistic from '@/components/ChatStatistics';
import ShareableResults from '@/components/ShareableResults';
import MonthlyActivity from '@/components/MonthlyActivity';
import {
  Stats,
  AnalysisResults,
  isPhoneNumber,
  formatPeakHour,
  formatFirstTextChampion,
  formatMostIgnored
} from '@/lib/interfaces';

const filterPhoneNumbers = (data: Record<string, number>): Record<string, number> => {
  return Object.fromEntries(
    Object.entries(data).filter(([user]) => !isPhoneNumber(user))
  );
};

const filterChordData = (matrix: (string | number | null)[][], keys: string[]) => {
  if (!matrix || matrix.length <= 1 || !keys.length) return { filteredMatrix: [] as number[][], filteredKeys: [] };

  const validIndices = keys.map((key, index) => ({ key, index }))
    .filter(item => !isPhoneNumber(item.key))
    .map(item => item.index);

  const filteredKeys = validIndices.map(index => keys[index]);

  const filteredMatrix = matrix.slice(1)
    .filter((_, rowIdx) => validIndices.includes(rowIdx))
    .map(row =>
      row.slice(1)
        .filter((_, colIdx) => validIndices.includes(colIdx))
        .map(value => (typeof value === 'number' ? value : 0))
    );

  return { filteredMatrix: filteredMatrix as number[][], filteredKeys };
};

const filterUserMonthlyActivity = (
  activityData: Array<{ id: string; data: Array<{ x: string; y: number }> }>
): Array<{ id: string; data: Array<{ x: string; y: number }> }> => {
  if (!activityData) return [];
  return activityData.filter(activity => !isPhoneNumber(activity.id));
};

export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topWords, setTopWords] = useState<{ text: string; value: number }[]>([]);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const shareableRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    try {
      const storedResults = sessionStorage.getItem('analysisResults');
      if (storedResults) {
        const parsedResults: AnalysisResults = JSON.parse(storedResults);

        if (!parsedResults.ai_analysis) {
          parsedResults.ai_analysis = {
            summary: "AI analysis not available or skipped.",
            people: []
          };
        } else if (typeof parsedResults.ai_analysis === 'string') {
          try {
            const aiParsed = JSON.parse(parsedResults.ai_analysis as unknown as string);
            if (typeof aiParsed === 'object' && aiParsed !== null && 'summary' in aiParsed) {
              parsedResults.ai_analysis = {
                summary: aiParsed.summary,
                people: aiParsed.people || [],
                error: aiParsed.error
              };
            } else {
              parsedResults.ai_analysis = { summary: parsedResults.ai_analysis as unknown as string, people: [] };
            }
          } catch (e) {
            console.error("Failed to parse AI analysis from string:", e);
            parsedResults.ai_analysis = { summary: parsedResults.ai_analysis as unknown as string, people: [] };
          }
        }

        if (parsedResults.ai_analysis && !parsedResults.ai_analysis.people) {
          parsedResults.ai_analysis.people = [];
        }

        setResults(parsedResults);
        // console.log("AI Analysis data:", parsedResults.ai_analysis);

        if (parsedResults.stats?.common_words) {
          const sortedWords = Object.entries(parsedResults.stats.common_words)
            .map(([text, value]) => ({ text: text.toUpperCase(), value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

          setTopWords(sortedWords);
        }

      } else {
        setError('No analysis results found. Please upload a file first.');
      }
    } catch (err) {
      console.error("Failed to parse results from sessionStorage:", err);
      setError("Could not load analysis results. Data might be corrupted.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const measureContainer = () => {
      if (wordContainerRef.current) {
        setContainerWidth(wordContainerRef.current.clientWidth);
      }
    };

    measureContainer();
    window.addEventListener('resize', measureContainer);

    return () => window.removeEventListener('resize', measureContainer);
  }, [topWords]);

  const minCharSize = 1.0;
  const absoluteMaxCharSize = 7.0;

  const getCharSize = (count: number, text: string) => {
    const baseFontSize = 16;

    if (!containerWidth || topWords.length === 0) {
      return `${minCharSize}rem`;
    }

    const topWord = topWords[0];
    const N = topWord.text.length;

    const frequencyCountWidthEstimate = 60;
    const availableWidthForWord = Math.max(10, containerWidth - frequencyCountWidthEstimate);

    let idealFontSizeRem = absoluteMaxCharSize;
    if (N > 0) {
      const estimatedFontSizePx = (availableWidthForWord - N * 8 - Math.max(0, N - 1) * 4) / N;
      idealFontSizeRem = estimatedFontSizePx / baseFontSize;
    }

    const dynamicMaxCharSize = Math.max(minCharSize, Math.min(absoluteMaxCharSize, idealFontSizeRem));

    if (text === topWord.text) {
      return `${Math.max(minCharSize, dynamicMaxCharSize).toFixed(2)}rem`;
    }
    const minCountDisplayed = topWords.length > 0 ? topWords[topWords.length - 1].value : 1;
    const effectiveMaxCount = Math.max(topWord.value, 1);
    const effectiveMinCount = Math.max(minCountDisplayed, 1);

    if (effectiveMaxCount <= effectiveMinCount || count <= effectiveMinCount) {
      return `${minCharSize}rem`;
    }

    const scale = (count - effectiveMinCount) / (effectiveMaxCount - effectiveMinCount);
    const size = minCharSize + (dynamicMaxCharSize - minCharSize) * scale;

    const clampedSize = Math.max(minCharSize, Math.min(dynamicMaxCharSize, size));

    return `${clampedSize.toFixed(2)}rem`;
  };

  const bgColors = [
    'bg-rose-100',
    'bg-green-100',
    'bg-pink-100',
    'bg-purple-100',
    'bg-sky-100',
    'bg-violet-100',
  ];

  const handleDownload = async () => {
    if (shareableRef.current === null) {
      alert("Shareable content is not ready. Please try again.");
      return;
    }
    if (!results) {
      alert("No results to share.");
      return;
    }

    setIsDownloading(true);
    const elementToCapture = shareableRef.current;

    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const options = {
        quality: 1,
        width: elementToCapture.offsetWidth,
        height: elementToCapture.offsetHeight,
        style: {
          margin: '0',
        },
        filter: (node: Node) => {
          if (node instanceof Element && node.tagName === 'svg') {
            const hasForeignObject = node.querySelector('foreignObject');
            return !hasForeignObject;
          }
          return true;
        }
      };

      const dataUrl = await domtoimage.toPng(elementToCapture, options);
      const link = document.createElement('a');
      const chatNamePart = results.chat_name ? results.chat_name.replace(/\s+/g, '_') : 'chat_summary';
      link.download = `Bloop-Analysis-${chatNamePart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: unknown) {
      console.error('Error generating image:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Failed to generate image: ${errorMessage}. Check console for details.`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-4xl font-bold text-blue-950">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg text-orange-800">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-orange-300 border-2 border-neutral-800 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] text-blue-950 px-6 py-4 rounded-xl gap-3 transition duration-150 ease-in-out"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!results || !results.stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">No results data available.</p>
      </div>
    );
  }

  const rawChordKeys = results.stats.user_interaction_matrix
    ? results.stats.user_interaction_matrix[0].slice(1).map(key => key as string)
    : [];

  const { filteredMatrix: chordMatrix, filteredKeys: chordKeys } =
    filterChordData(results.stats.user_interaction_matrix || [], rawChordKeys);

  const sortedEmojis = (results.stats.common_emojis)
    ? Object.entries(results.stats.common_emojis)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count)
    : [];

  const shareableWordCloudContainerWidth = results ? 525 : 0;

  const filteredMonthlyActivity = results.stats.user_monthly_activity
    ? filterUserMonthlyActivity(results.stats.user_monthly_activity as Array<{ id: string; data: Array<{ x: string; y: number }> }>)
    : [];

  return (
    <main className="container mx-auto p-6">
      {results && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0px', zIndex: -100, pointerEvents: 'none', opacity: 0 }}>
          <ShareableResults
            key={results.chat_name || 'shareable-results'}
            ref={shareableRef}
            results={results}
            topWords={topWords}
            sortedEmojis={sortedEmojis}
            chordMatrix={chordMatrix}
            chordKeys={chordKeys}
            formatPeakHour={formatPeakHour}
            formatFirstTextChampion={formatFirstTextChampion}
            formatMostIgnored={formatMostIgnored}
            wordCloudContainerWidth={shareableWordCloudContainerWidth}
          />
        </div>
      )}

      <div className="flex flex-col p-4 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex flex-col items-center md:items-start">
          <Image
            src="bloop_logo.svg"
            alt="Bloop Logo"
            width={300}
            height={50}
            className='mb-2'
          />
          <h1 className="text-3xl mb-4 md:mb-0 text-gray-800 text-center md:text-left">
            {results.chat_name ? (
              <>Analysis of chats with <strong>{results.chat_name}</strong></>
            ) : "Analysis Results"}
          </h1>
        </div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="mt-4 md:mt-0 bg-orange-300 border-2 border-neutral-800 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] text-blue-950 px-6 py-4 rounded-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed self-center md:self-end transition duration-150 ease-in-out"
        >
          <Image src='/icons/share.svg' width={20} height={20} alt='share icon'></Image>
          <p className='font-bold'>{isDownloading ? 'Downloading...' : 'Share these results'}</p>
        </button>
      </div>

      {/* chat stats */}
      <div className="p-4" ref={sectionRef} >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <ChatStatistic
            title="you guys have sent"
            value={results.stats.total_messages.toLocaleString() + " messages"}
            icon="chat.svg"
            altText="Total Messages"
            bgColor="bg-purple-100"
            textColor="text-purple-800"
            iconWidth={40}
            iconHeight={20}
          />

          <ChatStatistic
            title="you&apos;ve been chatting for"
            value={`${results.stats.days_active ?? 'N/A'} ${results.stats.days_active === 1 ? 'day' : 'days'}`}
            icon="calendar.svg"
            altText="Days Since First Message"
            bgColor="bg-emerald-100"
            textColor="text-emerald-700"
            iconWidth={48}
            iconHeight={48}
          />

          <ChatStatistic
            title="who gets ghosted the most?"
            value={formatMostIgnored(results.stats.most_ignored_users_pct)}
            icon="frown.svg"
            altText="Most Ignored Users"
            bgColor="bg-sky-50"
            textColor="text-sky-700"
            iconWidth={48}
            iconHeight={48}
          />

          <ChatStatistic
            title="when does your conversations peak?"
            value={formatPeakHour(results.stats.peak_hour)}
            icon="peak.svg"
            altText="Peak Hour"
            bgColor="bg-sky-100"
            textColor="text-sky-900"
            iconWidth={25}
            iconHeight={48}
          />

          <ChatStatistic
            title="who texts first usually?"
            value={formatFirstTextChampion(results.stats.first_text_champion)}
            icon="trophy.svg"
            altText="First Text Champion"
            bgColor="bg-violet-100"
            textColor="text-violet-800"
            iconWidth={48}
            iconHeight={48}
          />

          <ChatStatistic
            title="you get the reply back in"
            value={`~ ${results.stats.average_response_time_minutes.toFixed(2)} minutes`}
            icon="time.svg"
            altText="Average Response Time"
            bgColor="bg-red-100"
            textColor="text-orange-700"
            iconWidth={40}
            iconHeight={48}
          />
        </div>

        {/* top words and emojis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-zinc-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-bold mb-4 text-gray-700">you guys use these {topWords.length} words a lot</h2>
              <Image
                src="/icons/words.svg"
                alt="Common Words"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <div ref={wordContainerRef} className='w-full flex flex-col items-start space-y-3 py-4'>
              {topWords.length > 0 ? (
                topWords.map(({ text, value }, wordIndex) => {
                  const bgColor = bgColors[wordIndex % bgColors.length];
                  const charSizeStyle = getCharSize(value, text);

                  return (
                    <div key={text} className="flex items-baseline space-x-1" title={`${text}: ${value} uses`}>

                      <div className="flex space-x-1">
                        {text.split('').map((char, index) => {
                          return (
                            <span
                              key={`${text}-${index}`}
                              className={`flex items-center justify-center rounded font-bold text-gray-800 ${bgColor}`}
                              style={{
                                fontSize: charSizeStyle,
                                width: `calc(${charSizeStyle} + 0.5rem)`,
                                height: `calc(${charSizeStyle} + 0.5rem)`,
                                lineHeight: '1'
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </div>
                      <span className="ml-2 text-xs text-gray-500 font-medium">
                        x {value}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No common words data available.</p>
              )}
            </div>
          </section>

          <section className="p-4 lg:h-full md:h-fit  border-2 border-neutral-800 rounded-lg bg-zinc-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]  hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">can&apos;t get enough of these emojis</h2>
              <Image
                src="/icons/lovely_face.svg"
                alt="Common Emojis"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <div className="flex items-center justify-center h-9/10">
              {sortedEmojis.length > 0 ? (
                <div className="grid grid-cols-3 grid-rows-2 gap-3 h-full w-full items-center justify-center my-16">
                  {sortedEmojis.slice(0, 6).map(({ emoji, count }) => (
                    <span
                      key={emoji}
                      className="flex items-center justify-center text-6xl md:text-8xl"
                      title={`${emoji}: ${count}`}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No common emojis data available.</p>
              )}
            </div>
          </section>
        </div>

        {/* ai analysis, weekday/weekend, interaction matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-purple-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]  hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">wtf was all the yapping about?</h2>
              <Image
                src="/icons/sparkle.svg"
                alt="AI Analysis"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <AIAnalysis
              summary={results.ai_analysis?.summary || 'Summary not available.'}
              people={results.ai_analysis?.people || []}
              summaryOnly={true}
            />
          </section>

          {results.stats.most_active_users_pct && Object.keys(results.stats.most_active_users_pct).length <= 2 && (
            <section className="p-4 border-2 border-neutral-800 rounded-lg bg-sky-100 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]  hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out">
              <div className='flex items-center justify-between mb-4'>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">banter on weekday or relaxing on weekend?</h2>
                <Image
                  src="/icons/tag.svg"
                  alt="Weekday vs Weekend Activity"
                  width={30}
                  height={30}
                  className="mr-3"
                />
              </div>
              <div className="h-80">
                <ResponsivePie
                  data={[
                    { id: 'Weekday', label: 'Weekday', value: results.stats.weekday_vs_weekend_avg.average_weekday_messages },
                    { id: 'Weekend', label: 'Weekend', value: results.stats.weekday_vs_weekend_avg.average_weekend_messages },
                  ]}
                  margin={{ top: 10, bottom: 10 }}
                  innerRadius={0.1}
                  padAngle={0}
                  cornerRadius={1}
                  activeOuterRadiusOffset={8}
                  borderWidth={1}
                  colors={{ scheme: 'set3' }}
                  enableArcLabels={true}
                  arcLabel={e => `${e.id}`}
                  enableArcLinkLabels={false}
                />
              </div>
            </section>
          )}

          {results.stats.user_interaction_matrix && chordKeys.length > 2 && chordMatrix.length > 2 && (
            <section className="pt-4 pr-4 pl-4 border-2 border-neutral-800 rounded-lg bg-lime-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out">
              <div className='flex items-center justify-between mb-4'>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">you guys are really chaotic huh?</h2>
                <Image
                  src="/icons/tag.svg"
                  alt="Weekday vs Weekend Activity"
                  width={30}
                  height={30}
                  className="mr-3"
                />
              </div>
              <div className="h-80 w-full">
                <ResponsiveChord
                  data={chordMatrix}
                  keys={chordKeys}
                  margin={{ top: 30, right: 40, bottom: 30, left: 40 }}
                  valueFormat=".0f"
                  padAngle={0.05}
                  innerRadiusRatio={0.96}
                  innerRadiusOffset={0}
                  enableLabel={true}
                  label="id"
                  labelOffset={15}
                  labelRotation={0}
                  colors={{ scheme: 'dark2' }}
                  isInteractive={true}
                  animate={true}
                  motionConfig="gentle"
                />
              </div>
            </section>
          )}
        </div>

        {/* people animal assignment*/}
        <div className="bg-emerald-50 px-6 rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] border-2 border-neutral-800  hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out mb-8">
          <div className="flex items-center justify-between my-6">
            <h2 className="text-xl font-semibold text-gray-700">what kinda animal are you?</h2>
            <Image
              src="/icons/sparkle.svg"
              alt="AI Analysis"
              width={30}
              height={30}
              className="mr-3"
            />
          </div>
          <AIAnalysis
            summary={results.ai_analysis?.summary || 'Summary not available.'}
            people={results.ai_analysis?.people || []}
            profilesOnly={true}
          />
        </div>

        {/* top yappers and first texters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <section
            className="p-4 border-2 border-neutral-800 rounded-lg bg-sky-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out"
            data-exclude-from-download="true"
          >
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">top yappers</h2>
              <Image
                src="/icons/users.svg"
                alt="Most Active Users"
                width={50}
                height={50}
                className="mr-3"
              />
            </div>
            <div className='h-80'>
              <ResponsivePie
                data={Object.entries(filterPhoneNumbers(results.stats.most_active_users_pct)).map(([user, percentage]) => ({
                  id: user,
                  label: user,
                  value: percentage,
                }))}
                margin={{ top: 10, bottom: 10 }}
                innerRadius={0.1}
                padAngle={0}
                cornerRadius={1}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                colors={{ scheme: 'pastel1' }}
                enableArcLabels={true}
                arcLabel={e => `${e.id}`}
                enableArcLinkLabels={false}
              />
            </div>
          </section>

          <section
            className="p-4 border-2 border-neutral-800 rounded-lg bg-sky-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out"
            data-exclude-from-download="true"
          >
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">first texters</h2>
              <Image
                src="/icons/user.svg"
                alt="Conversation Starters"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <div className='h-80'>
              <ResponsivePie
                data={Object.entries(filterPhoneNumbers(results.stats.conversation_starters_pct)).map(([user, percentage]) => ({
                  id: user,
                  label: user,
                  value: percentage,
                }))}
                margin={{ top: 10, bottom: 10 }}
                innerRadius={0.1}
                padAngle={0}
                cornerRadius={1}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                colors={{ scheme: 'pastel2' }}
                enableArcLabels={true}
                arcLabel={e => `${e.id}`}
                enableArcLinkLabels={false}
              />
            </div>
          </section>
        </div>

        {/* user monthly activity */}
        {filteredMonthlyActivity && filteredMonthlyActivity.length > 0 && (
          <section className="p-4 mb-20 border-2 border-neutral-800 rounded-lg bg-pink-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]  hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out"
            data-exclude-from-download="true">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">how your chats have evolved over time?</h2>
              <Image
                src="/icons/graph_def.svg"
                alt="User Monthly Activity"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <MonthlyActivity userMonthlyActivity={filteredMonthlyActivity} />
          </section>
        )}
      </div>
    </main>
  );
}