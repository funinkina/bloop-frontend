import React from 'react';

interface Person {
  name: string;
  animal: string;
  description: string;
}

interface AIAnalysisProps {
  summary: string;
  people?: Person[];
  summaryOnly?: boolean;
  profilesOnly?: boolean;
  useSimpleStyles?: boolean;
}

const getAnimalEmoji = (animal: string): string => {
  const animalMap: { [key: string]: string } = {
    'owl': '🦉',
    'lion': '🦁',
    'dolphin': '🐬',
    'fox': '🦊',
    'bear': '🐻',
    'rabbit': '🐰',
    'monkey': '🐵',
    'tiger': '🐯',
    'wolf': '🐺',
    'eagle': '🦅',
    'elephant': '🐘',
    'penguin': '🐧',
    'cat': '🐱',
    'dog': '🐶',
    'koala': '🐨',
    'panda': '🐼',
    'sheep': '🐑',
  };

  return animalMap[animal?.toLowerCase()] || '🦄';
};

const AIAnalysis: React.FC<AIAnalysisProps> = ({
  summary,
  people = [],
  summaryOnly,
  profilesOnly,
  useSimpleStyles = false
}) => {
  const showSummary = profilesOnly !== true;
  const showProfiles = summaryOnly !== true && people && people.length > 0;

  return (
    <div className={useSimpleStyles ? (profilesOnly ? "mb-5" : "mb-10") : (profilesOnly ? "mb-8" : "mb-16")}>
      {/* Summary Section */}
      {showSummary && (
        summary ? (
          <div>
            <p
              className={useSimpleStyles ? "text-3xl font-medium text-purple-900 mb-5" : "text-purple-900 text-2xl font-medium"}
            >
              {summary}
            </p>
          </div>
        ) : (
          <p className={useSimpleStyles ? "text-gray-700 italic" : "text-gray-700 italic"}>
            No AI summary available
          </p>
        )
      )}

      {/* Personality Profiles */}
      {showProfiles ? (
        <>
          <div
            className={useSimpleStyles ? "grid grid-cols-2 gap-4 mt-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"}
          >
            {people.map((person, index) => (
              <div
                key={index}
                className={useSimpleStyles ? "bg-amber-50 p-4 rounded-lg border-2 border-gray-800" : "bg-amber-50 rounded-lg p-4 border-2 border-neutral-800"}
              >
                <div
                  className="flex items-center mb-2"
                >
                  <span
                    className={useSimpleStyles ? "text-4xl mr-3" : "text-4xl mr-3"}
                  >
                    {getAnimalEmoji(person.animal)}
                  </span>
                  <div className={useSimpleStyles ? "flex flex-col" : ""}>
                    <h4
                      className={useSimpleStyles ? "font-bold text-lg text-blue-950" : "font-bold text-xl text-blue-950"}
                    >
                      {person.name}
                    </h4>
                    <p
                      className={useSimpleStyles ? "text-sm italic text-gray-800" : "text-sm text-gray-800 italic"}
                    >
                      The {person.animal.charAt(0).toUpperCase() + person.animal.slice(1)} {people.length > 2 ? 'of the group' : ''}
                    </p>
                  </div>
                </div>
                <p
                  className={useSimpleStyles ? "text-xl text-blue-950 font-medium" : "text-blue-950 text-lg font-medium"}
                >
                  {person.description}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        profilesOnly && (
          <div
            className={useSimpleStyles ? "bg-gray-50 p-6 rounded-xl border-2 border-gray-800 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.25)]" : "bg-gray-50 rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.25)] border-2 border-neutral-800"}
          >
            <p
              className={useSimpleStyles ? "text-gray-700 italic" : "text-gray-700 italic"}
            >
              {people && people.length === 0 ?
                "No personality profiles available - there are more than 15 users in this chat." :
                "No personality profiles available"}
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default AIAnalysis;