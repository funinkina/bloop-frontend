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
  useSimpleStyles?: boolean; // Add this prop
}

// Function to get animal emoji based on animal type
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

  // Return the emoji if it exists, otherwise return a default
  return animalMap[animal?.toLowerCase()] || '🦄';
};

const AIAnalysis: React.FC<AIAnalysisProps> = ({
  summary,
  people = [],
  summaryOnly,
  profilesOnly,
  useSimpleStyles = false
}) => {
  // If neither flag is set, show both sections (default behavior)
  const showSummary = profilesOnly !== true;
  const showProfiles = summaryOnly !== true && people && people.length > 0;

  // Define styles conditionally based on useSimpleStyles
  const containerStyle = useSimpleStyles
    ? { marginBottom: profilesOnly ? '20px' : '40px' }
    : {};

  const summaryStyle = useSimpleStyles
    ? { fontSize: '18px', fontWeight: 500, color: '#553C9A', marginBottom: '20px', lineHeight: '1.5' }
    : {};

  const profilesGridStyle = useSimpleStyles
    ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '16px' }
    : {};

  const profileCardStyle = useSimpleStyles
    ? { backgroundColor: '#FFFBEB', padding: '16px', borderRadius: '8px', border: '2px solid #1F2937' }
    : {};

  const profileHeaderStyle = useSimpleStyles
    ? { display: 'flex', alignItems: 'center', marginBottom: '8px' }
    : {};

  const emojiStyle = useSimpleStyles
    ? { fontSize: '32px', marginRight: '12px' }
    : {};

  const nameContainerStyle = useSimpleStyles ? { display: 'flex', flexDirection: 'column' as const } : {};

  const nameStyle = useSimpleStyles
    ? { fontWeight: 'bold', fontSize: '18px', color: '#1A365D' }
    : {};

  const animalTypeStyle = useSimpleStyles
    ? { fontSize: '14px', fontStyle: 'italic', color: '#4A5568' }
    : {};

  const descriptionStyle = useSimpleStyles
    ? { fontSize: '16px', color: '#1A365D', fontWeight: 500, lineHeight: '1.4' }
    : {};

  return (
    <div className={!useSimpleStyles ? (profilesOnly ? "mb-8" : "mb-16") : ""} style={useSimpleStyles ? containerStyle : undefined}>
      {/* Summary Section */}
      {showSummary && (
        summary ? (
          <div>
            <p
              className={!useSimpleStyles ? "text-purple-900 text-2xl font-medium" : ""}
              style={useSimpleStyles ? summaryStyle : undefined}
            >
              {summary}
            </p>
          </div>
        ) : (
          <p className={!useSimpleStyles ? "text-gray-700 italic" : ""} style={useSimpleStyles ? { color: '#4A5568', fontStyle: 'italic' } : undefined}>
            No AI summary available
          </p>
        )
      )}

      {/* Personality Profiles */}
      {showProfiles ? (
        <>
          <div
            className={!useSimpleStyles ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}
            style={useSimpleStyles ? profilesGridStyle : undefined}
          >
            {people.map((person, index) => (
              <div
                key={index}
                className={!useSimpleStyles ? "bg-amber-50 rounded-lg p-4 border-2 border-neutral-800" : ""}
                style={useSimpleStyles ? profileCardStyle : undefined}
              >
                <div
                  className={!useSimpleStyles ? "flex items-center mb-2" : ""}
                  style={useSimpleStyles ? profileHeaderStyle : undefined}
                >
                  <span
                    className={!useSimpleStyles ? "text-4xl mr-3" : ""}
                    style={useSimpleStyles ? emojiStyle : undefined}
                  >
                    {getAnimalEmoji(person.animal)}
                  </span>
                  <div style={useSimpleStyles ? nameContainerStyle : undefined}>
                    <h4
                      className={!useSimpleStyles ? "font-bold text-xl text-blue-950" : ""}
                      style={useSimpleStyles ? nameStyle : undefined}
                    >
                      {person.name}
                    </h4>
                    <p
                      className={!useSimpleStyles ? "text-sm text-gray-800 italic" : ""}
                      style={useSimpleStyles ? animalTypeStyle : undefined}
                    >
                      The {person.animal.charAt(0).toUpperCase() + person.animal.slice(1)} {people.length > 2 ? 'of the group' : ''}
                    </p>
                  </div>
                </div>
                <p
                  className={!useSimpleStyles ? "text-blue-950 text-lg font-medium" : ""}
                  style={useSimpleStyles ? descriptionStyle : undefined}
                >
                  {person.description}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        // Only show this if we explicitly requested profiles but there aren't any
        profilesOnly && (
          <div
            className={!useSimpleStyles ? "bg-gray-50 rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.25)] border-2 border-neutral-800" : ""}
            style={useSimpleStyles ? { backgroundColor: '#F7FAFC', padding: '24px', borderRadius: '12px', border: '2px solid #1F2937', boxShadow: '5px 5px 0px 0px rgba(0,0,0,0.25)' } : undefined}
          >
            <p
              className={!useSimpleStyles ? "text-gray-700 italic" : ""}
              style={useSimpleStyles ? { color: '#4A5568', fontStyle: 'italic' } : undefined}
            >
              {people && people.length === 0 ?
                "No personality profiles available - there might be more than 10 users in this chat." :
                "No personality profiles available"}
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default AIAnalysis;