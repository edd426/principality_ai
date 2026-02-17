import { useRef, useEffect } from 'react';

interface GameLogProps {
  logs: string[];
  maxHeight?: string;
}

export default function GameLog({ logs, maxHeight = '200px' }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Game Log</h3>
      <div
        className="overflow-y-auto font-mono text-xs text-gray-300 space-y-1"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">No moves yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`py-0.5 ${
                log.includes('Turn') ? 'text-blue-400 font-medium mt-2' : ''
              } ${
                log.includes('wins') || log.includes('Game Over') ? 'text-green-400 font-bold' : ''
              }`}
            >
              {log}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
