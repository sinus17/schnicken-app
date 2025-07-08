import React from 'react';
import type { GameWithPlayers } from '../types/Game';

type SchnickHistoryProps = {
  onGameSelect: (game: GameWithPlayers) => void;
};

const SchnickHistory: React.FC<SchnickHistoryProps> = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Game History</h2>
      </div>
      
      <div className="text-center py-8">
        <p className="text-gray-500">History feature temporarily disabled for deployment.</p>
      </div>
    </div>
  );
};

export { SchnickHistory };
