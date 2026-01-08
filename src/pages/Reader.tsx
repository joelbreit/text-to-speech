import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Plus, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PollyTTSService } from '../services/pollyTTS';

const SPEED_STORAGE_KEY = 'tts-playback-speed';
const DEFAULT_SPEED = 1.0;
const MIN_SPEED = 0.5;
const MAX_SPEED = 3.0;
const SPEED_INCREMENT = 0.1;

export default function Reader() {
  const { isAuthenticated, getAuthToken } = useAuth();
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(() => {
    const saved = localStorage.getItem(SPEED_STORAGE_KEY);
    return saved ? parseFloat(saved) : DEFAULT_SPEED;
  });
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pollyServiceRef = useRef<PollyTTSService>(new PollyTTSService());
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const audioUrlRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      pollyServiceRef.current.stop();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SPEED_STORAGE_KEY, speed.toString());
  }, [speed]);

  // Clear cached audio when text changes
  useEffect(() => {
    if (audioUrlRef.current) {
      pollyServiceRef.current.stop();
      audioUrlRef.current = '';
      setIsPlaying(false);
    }
  }, [text]);

  const handlePlayPause = () => {
    setError('');

    if (isPlaying) {
      if (isAuthenticated) {
        pollyServiceRef.current.pause();
      } else {
        window.speechSynthesis.pause();
        pausedTimeRef.current = Date.now() - startTimeRef.current;
      }
      setIsPlaying(false);
    } else {
      if (isAuthenticated) {
        if (audioUrlRef.current && !pollyServiceRef.current.isPaused()) {
          pollyServiceRef.current.resume();
          setIsPlaying(true);
        } else if (audioUrlRef.current) {
          pollyServiceRef.current.resume();
          setIsPlaying(true);
        } else {
          startSpeech();
        }
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          startTimeRef.current = Date.now() - pausedTimeRef.current;
          setIsPlaying(true);
        } else {
          startSpeech();
        }
      }
    }
  };

  const startSpeech = async () => {
    if (!text.trim()) return;

    setProgress(0);
    setCurrentTime(0);

    if (isAuthenticated) {
      await startPollySpeech();
    } else {
      startBrowserSpeech();
    }
  };

  const startBrowserSpeech = () => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = speed;
    utteranceRef.current = utterance;

    const estimatedDuration = (text.split(' ').length * 0.4) / speed;
    setTotalTime(estimatedDuration);

    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;

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

  const startPollySpeech = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const result = await pollyServiceRef.current.synthesizeSpeech(
        { text, speed },
        token
      );

      audioUrlRef.current = result.audioUrl;

      pollyServiceRef.current.onEnd(() => {
        setIsPlaying(false);
        setProgress(100);
        setCurrentTime(totalTime);
      });

      pollyServiceRef.current.onError(() => {
        setIsPlaying(false);
        setError('Error playing audio');
      });

      pollyServiceRef.current.setVolume(volume);
      pollyServiceRef.current.play(result.audioUrl, speed);
      setIsPlaying(true);

      const duration = pollyServiceRef.current.getDuration();
      if (duration && duration > 0) {
        setTotalTime(duration);
      } else {
        const estimatedDuration = (text.split(' ').length * 0.4) / speed;
        setTotalTime(estimatedDuration);
      }
    } catch (err) {
      console.error('Polly TTS error:', err);
      setError(err instanceof Error ? err.message : 'Failed to synthesize speech');
      setIsLoading(false);
      startBrowserSpeech();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: number | undefined;

    if (isPlaying) {
      interval = window.setInterval(() => {
        let elapsed: number;

        if (isAuthenticated) {
          elapsed = pollyServiceRef.current.getCurrentTime();
          const duration = pollyServiceRef.current.getDuration();
          if (duration && duration > 0) {
            setTotalTime(duration);
          }
        } else {
          elapsed = (Date.now() - startTimeRef.current) / 1000;
        }

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
  }, [isPlaying, totalTime, isAuthenticated]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (isAuthenticated) {
      pollyServiceRef.current.setVolume(newVolume);
    } else if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const increaseSpeed = () => {
    setSpeed((prev) => {
      const newSpeed = Math.min(prev + SPEED_INCREMENT, MAX_SPEED);
      if (isAuthenticated && audioUrlRef.current) {
        pollyServiceRef.current.setSpeed(newSpeed);
      }
      return newSpeed;
    });
  };

  const decreaseSpeed = () => {
    setSpeed((prev) => {
      const newSpeed = Math.max(prev - SPEED_INCREMENT, MIN_SPEED);
      if (isAuthenticated && audioUrlRef.current) {
        pollyServiceRef.current.setSpeed(newSpeed);
      }
      return newSpeed;
    });
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;

    setProgress(newProgress);
    setCurrentTime((newProgress / 100) * totalTime);

    if (isAuthenticated) {
      pollyServiceRef.current.stop();
      audioUrlRef.current = '';
      setIsPlaying(false);
    } else if (window.speechSynthesis.speaking) {
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

        {isAuthenticated && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Using AWS Polly for high-quality text-to-speech
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

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
              className="w-24 h-24 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!text.trim() || isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
              ) : isPlaying ? (
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

            <div className="w-full flex items-center justify-center space-x-4">
              <button
                onClick={decreaseSpeed}
                disabled={speed <= MIN_SPEED}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg flex items-center justify-center transition-colors"
                title="Decrease speed"
              >
                <Minus size={20} />
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {speed.toFixed(1)}x
                </div>
                <div className="text-xs text-gray-500">Speed</div>
              </div>
              <button
                onClick={increaseSpeed}
                disabled={speed >= MAX_SPEED}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg flex items-center justify-center transition-colors"
                title="Increase speed"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
