export interface Stats {
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
    user_monthly_activity: Array<{
        id: string;
        data: Array<{
            x: string;
            y: number;
        }>;
    }> | object[]; // Adjusted to accommodate both specific and generic object array
    weekday_vs_weekend_avg: {
        average_weekday_messages: number;
        average_weekend_messages: number;
        difference: number;
        percentage_difference: number;
    };
    user_interaction_matrix: (string | number | null)[][] | null;
}

export interface PersonAnalysis {
    name: string;
    animal: string;
    description: string;
    fun_lines?: string[];
}

export interface AiAnalysisData {
    summary: string;
    people?: PersonAnalysis[];
    error?: string;
}

export interface AnalysisResults {
    chat_name?: string;
    stats: Stats;
    ai_analysis: AiAnalysisData | null;
    processing_time_seconds?: number;
    error?: string;
}

export const isPhoneNumber = (str: string): boolean => {
    return /^\+\d+\s?\d[\d\s-]{5,}$/.test(str);
};

export const formatPeakHour = (hour: number | null): string => {
    if (hour === null || hour < 0 || hour > 23) {
        return 'N/A';
    }
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour} ${ampm}`;
};

export const formatFirstTextChampion = (champion: Stats['first_text_champion']): string => {
    if (!champion || !champion.user) {
        return 'N/A';
    }
    const displayName = isPhoneNumber(champion.user) ? champion.user : champion.user.split(' ')[0];
    return `${displayName} (${champion.count} times)`;
};

export const formatMostIgnored = (ignoredData: Stats['most_ignored_users_pct']): string => {
    if (!ignoredData || Object.keys(ignoredData).length === 0) {
        return 'N/A';
    }
    const sortedIgnored = Object.entries(ignoredData)
        .sort(([, percentageA], [, percentageB]) => percentageB - percentageA);

    if (sortedIgnored.length === 0) {
        return 'N/A';
    }
    const [user, percentage] = sortedIgnored[0];
    const displayName = isPhoneNumber(user) ? user : user.split(' ')[0];
    return `${displayName} (${percentage.toFixed(1)}%)`;
};