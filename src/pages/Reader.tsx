import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function Reader() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        startTimeRef.current = Date.now() - pausedTimeRef.current;
        setIsPlaying(true);
      } else {
        startSpeech();
      }
    }
  };

  const startSpeech = () => {
    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utteranceRef.current = utterance;

    const estimatedDuration = text.split(' ').length * 0.4;
    setTotalTime(estimatedDuration);

    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setProgress(0);
    setCurrentTime(0);

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      setCurrentTime(totalTime);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let interval: number | undefined;

    if (isPlaying) {
      interval = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);

        if (totalTime > 0) {
          const progressPercent = (elapsed / totalTime) * 100;
          setProgress(Math.min(progressPercent, 100));
        }
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, totalTime]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;

    setProgress(newProgress);
    setCurrentTime((newProgress / 100) * totalTime);

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Text-to-Speech Reader</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter or paste your text here..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg mb-6 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex flex-col items-center space-y-6">
            <button
              onClick={handlePlayPause}
              className="w-24 h-24 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              disabled={!text.trim()}
            >
              {isPlaying ? (
                <Pause size={48} />
              ) : (
                <Play size={48} className="ml-1" />
              )}
            </button>

            <div className="w-full">
              <div
                className="w-full h-3 bg-gray-200 rounded-full cursor-pointer mb-2"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalTime)}</span>
              </div>
            </div>

            <div className="w-full flex items-center space-x-4">
              <Volume2 className="text-gray-600" size={24} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-gray-600 w-12 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
