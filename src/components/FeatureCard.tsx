import Image from 'next/image';

interface FeatureCardProps {
    bgColor: string;
    textColor: string;
    iconSrc: string;
    iconAlt: string;
    iconWidth: number;
    iconHeight: number;
    title: string;
}

const FeatureCard = ({
    bgColor,
    textColor,
    iconSrc,
    iconAlt,
    iconWidth,
    iconHeight,
    title
}: FeatureCardProps) => {
    return (
        <div className={`w-full h-64 ${bgColor} ${textColor} rounded-lg border-2 border-neutral-800 shadow-thick-black p-4 sm:p-6 flex flex-col items-start justify-between hover:shadow-thick-hover transition duration-150 ease-in-out`}>
            <Image src={iconSrc} alt={iconAlt} width={iconWidth} height={iconHeight} className="mb-4 w-10 h-10 sm:w-12 sm:h-12" />
            <h2 className="text-2xl sm:text-3xl font-semibold text-start">{title}</h2>
        </div>
    );
};

export default FeatureCard;