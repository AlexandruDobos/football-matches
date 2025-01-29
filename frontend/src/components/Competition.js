import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Match from './Match';

const Competition = ({ competition }) => {
  const [showMatches, setShowMatches] = useState(false);
  const location = useLocation();

  return (
    <div className="my-4 mx-auto p-8 bg-white shadow rounded-lg max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-8">
          <img
            src={competition.logo}
            alt={`${competition.name} logo`}
            className="w-20 h-20 md:w-16 md:h-16 sm:w-12 sm:h-12"
          />
          <h2 className="text-sm sm:text-lg font-bold text-center sm:text-left">
            {competition.name}
          </h2>
        </div>
        <button
          onClick={() => setShowMatches(!showMatches)}
          className="bg-blue-500 text-white font-bold rounded 
             py-1 px-2 sm:py-2 sm:px-3 md:py-3 md:px-4 
             text-xs sm:text-sm md:text-base whitespace-nowrap min-w-[140px]
             mt-4 sm:mt-0" // Adaugă margine de sus pe ecrane mici
        >
          {showMatches ? 'Ascunde meciurile' : 'Arată meciurile'}
        </button>
      </div>
      {showMatches && (
        <div className="space-y-2 mt-4">
          {competition.matches.map((match) => (
            <Match
              key={`${match.home_team}-${match.away_team}-${match.date}`}
              match={match}
              competitionId={competition.id}
              showEditButton={location.pathname === '/admin/dashboard'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Competition;
