import Image from 'next/image';
import { ReactNode } from 'react';

interface ChatStatisticProps {
    title: string;
    value: ReactNode;
    icon: string;
    altText: string;
    bgColor?: string;
    textColor?: string;
    iconWidth?: number;
    iconHeight?: number;
}

const ChatStatistic = ({
    title,
    value,
    icon,
    altText,
    bgColor = 'bg-purple-100',
    textColor = 'text-violet-800',
    iconWidth = 40,
    iconHeight = 40,
}: ChatStatisticProps) => {
    return (
        <section className={`p-4 border-2 border-neutral-800 rounded-lg ${bgColor} shadow-thick-black flex items-center hover:shadow-thick-hover transition duration-150 ease-in-out`}>
            <Image
                src={`/icons/${icon}`}
                alt={altText}
                width={iconWidth}
                height={iconHeight}
                className="mr-4"
            />
            <div>
                <h2 className="text-xl font-semibold mb-1 text-gray-700">{title}</h2>
                <p className={`text-2xl font-bold leading-1.5 w-full ${textColor}`}>{value}</p>
            </div>
        </section>
    );
};

export default ChatStatistic;