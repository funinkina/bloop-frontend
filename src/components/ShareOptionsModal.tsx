import { useState } from 'react';
import Image from 'next/image';

interface ShareOption {
    id: string;
    label: string;
    defaultChecked: boolean;
}

interface ShareOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedOptions: string[]) => void;
    isDownloading: boolean;
}

const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isDownloading
}) => {
    const shareOptions: ShareOption[] = [
        { id: 'chatStatistics', label: 'Chat Statistics', defaultChecked: true },
        { id: 'topWordsEmojis', label: 'Top Words and Emojis', defaultChecked: true },
        { id: 'aiAnalysis', label: 'AI Analysis', defaultChecked: true },
        { id: 'animalAssignment', label: 'Animal Assignment', defaultChecked: true },
        { id: 'overTimeGraph', label: 'Chats over time', defaultChecked: true },
    ];

    const [selectedOptions, setSelectedOptions] = useState<string[]>(
        shareOptions.filter(option => option.defaultChecked).map(option => option.id)
    );

    if (!isOpen) return null;

    const handleOptionChange = (optionId: string) => {
        setSelectedOptions(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };

    const handleConfirm = () => {
        onConfirm(selectedOptions);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-amber-50 rounded-xl p-6 mx-10 max-w-md w-full border-2 border-neutral-800 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-blue-950">what do you want to share?</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <Image src='/icons/share.svg' alt='share icon' width={20} height={20}></Image>
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    {shareOptions.map(option => (
                        <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option.id)}
                                onChange={() => handleOptionChange(option.id)}
                                className="form-checkbox h-5 w-5 text-orange-400 rounded border-gray-300 focus:ring-orange-500"
                            />
                            <span className="text-neutral-800 font-medium">{option.label}</span>
                        </label>
                    ))}
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        nah, nvm
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedOptions.length === 0 || isDownloading}
                        className="px-4 py-2 bg-orange-300 border-2 border-neutral-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)] text-blue-950 rounded-lg hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? 'Generating...' : 'Get it'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareOptionsModal;