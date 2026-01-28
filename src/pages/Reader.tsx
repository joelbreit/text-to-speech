import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Plus, Minus, Mic } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { PollyTTSService, type PollyVoice } from "../services/pollyTTS";

const SPEED_STORAGE_KEY = "tts-playback-speed";
const VOICE_STORAGE_KEY = "tts-voice-id";
const DEFAULT_SPEED = 1.0;
const DEFAULT_VOICE_ID = "Ruth";
const DEFAULT_VOICE_ENGINE = "neural";
const DEFAULT_VOICE_KEY = `${DEFAULT_VOICE_ID}:${DEFAULT_VOICE_ENGINE}`;
const MIN_SPEED = 0.5;
const MAX_SPEED = 3.0;
const SPEED_INCREMENT = 0.1;

export default function Reader() {
	const { isAuthenticated, getAuthToken } = useAuth();
	const [text, setText] = useState("");
	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(1);
	const [speed, setSpeed] = useState(() => {
		const saved = localStorage.getItem(SPEED_STORAGE_KEY);
		return saved ? parseFloat(saved) : DEFAULT_SPEED;
	});
	const [selectedVoice, setSelectedVoice] = useState(() => {
		const saved = localStorage.getItem(VOICE_STORAGE_KEY);
		if (saved) {
			// Backwards compatibility: previously we only stored the voice ID
			return saved.includes(":")
				? saved
				: `${saved}:${DEFAULT_VOICE_ENGINE}`;
		}
		return DEFAULT_VOICE_KEY;
	});
	const [availableVoices, setAvailableVoices] = useState<PollyVoice[]>([]);
	const [voiceOptions, setVoiceOptions] = useState<
		Array<PollyVoice & { engineVariant: string }>
	>([]);
	const [isLoadingVoices, setIsLoadingVoices] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [totalTime, setTotalTime] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
	const pollyServiceRef = useRef<PollyTTSService>(new PollyTTSService());
	const startTimeRef = useRef<number>(0);
	const pausedTimeRef = useRef<number>(0);
	const audioUrlRef = useRef<string>("");

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

	// Save selected voice to localStorage
	useEffect(() => {
		localStorage.setItem(VOICE_STORAGE_KEY, selectedVoice);
	}, [selectedVoice]);

	// Load available voices when authenticated
	useEffect(() => {
		const loadVoices = async () => {
			if (!isAuthenticated) {
				setAvailableVoices([]);
				setVoiceOptions([]);
				return;
			}

			setIsLoadingVoices(true);
			try {
				const token = await getAuthToken();
				if (token) {
					const voices =
						await pollyServiceRef.current.getVoices(token);
					setAvailableVoices(voices);

					// Expand each voice into separate options for each supported engine
					const expandedOptions: Array<
						PollyVoice & { engineVariant: string }
					> = [];

					for (const voice of voices) {
						for (const engine of voice.engine) {
							if (
								engine === "neural" ||
								engine === "generative"
							) {
								expandedOptions.push({
									...voice,
									engineVariant: engine,
								});
							}
						}
					}

					// Sort options by name, then engine (neural first, then generative)
					expandedOptions.sort((a, b) => {
						const nameCompare = a.name.localeCompare(b.name);
						if (nameCompare !== 0) return nameCompare;

						const engineOrder = (engine: string) =>
							engine === "neural"
								? 0
								: engine === "generative"
									? 1
									: 2;

						return (
							engineOrder(a.engineVariant) -
							engineOrder(b.engineVariant)
						);
					});

					setVoiceOptions(expandedOptions);

					// If current voice/engine combination isn't in the list, reset to default (Ruth neural)
					const hasSelected = expandedOptions.some(
						(option) =>
							`${option.id}:${option.engineVariant}` ===
							selectedVoice,
					);

					if (!hasSelected) {
						setSelectedVoice(DEFAULT_VOICE_KEY);
					}
				}
			} catch (err) {
				console.error("Failed to load voices:", err);
			} finally {
				setIsLoadingVoices(false);
			}
		};

		loadVoices();
	}, [isAuthenticated, getAuthToken, selectedVoice]);

	// Clear cached audio when text or voice changes
	useEffect(() => {
		if (audioUrlRef.current) {
			pollyServiceRef.current.stop();
			audioUrlRef.current = "";
			setIsPlaying(false);
		}
	}, [text, selectedVoice]);

	const handlePlayPause = () => {
		setError("");

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
				if (
					audioUrlRef.current &&
					!pollyServiceRef.current.isPaused()
				) {
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

		const estimatedDuration = (text.split(" ").length * 0.4) / speed;
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
		setError("");

		try {
			const token = await getAuthToken();
			if (!token) {
				throw new Error("Not authenticated");
			}

			const [voiceId, engine] = selectedVoice.split(":");

			const loadStartTime = Date.now();
			const result = await pollyServiceRef.current.synthesizeSpeech(
				{ text, speed, voiceId, engine },
				token,
			);
			const loadTime = Date.now() - loadStartTime;
			console.log(`Audio loaded in ${loadTime}ms`);

			audioUrlRef.current = result.audioUrl;

			pollyServiceRef.current.onEnd(() => {
				setIsPlaying(false);
				setProgress(100);
				setCurrentTime(totalTime);
			});

			pollyServiceRef.current.onError(() => {
				setIsPlaying(false);
				setError("Error playing audio");
			});

			pollyServiceRef.current.setVolume(volume);
			pollyServiceRef.current.play(result.audioUrl, speed);
			setIsPlaying(true);

			const duration = pollyServiceRef.current.getDuration();
			if (duration && duration > 0) {
				setTotalTime(duration);
			} else {
				const estimatedDuration =
					(text.split(" ").length * 0.4) / speed;
				setTotalTime(estimatedDuration);
			}
		} catch (err) {
			console.error("Polly TTS error:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to synthesize speech",
			);
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
			audioUrlRef.current = "";
			setIsPlaying(false);
		} else if (window.speechSynthesis.speaking) {
			window.speechSynthesis.cancel();
			setIsPlaying(false);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="min-h-screen p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
					Text-to-Speech Reader
				</h1>
				<p className="text-gray-600 dark:text-purple-300/70 text-sm mb-8">
					Paste your text and listen at your preferred speed
				</p>

				{isAuthenticated && (
					<div className="mb-6 p-4 bg-orange-100/50 dark:bg-purple-500/20 border border-orange-200 dark:border-purple-500/30 rounded-2xl backdrop-blur-sm">
						<p className="text-sm text-orange-700 dark:text-purple-200 mb-3">
							Using AWS Polly for high-quality text-to-speech
						</p>
						<div className="flex items-center space-x-3">
							<Mic
								className="text-orange-500 dark:text-purple-400"
								size={20}
							/>
							<label
								htmlFor="voice-select"
								className="text-sm font-medium text-orange-700 dark:text-purple-300"
							>
								Voice:
							</label>
							<select
								id="voice-select"
								value={selectedVoice}
								onChange={(e) =>
									setSelectedVoice(e.target.value)
								}
								disabled={
									isLoadingVoices ||
									availableVoices.length === 0
								}
								className="flex-1 max-w-xs px-4 py-2 bg-white/80 dark:bg-slate-700/80 border border-orange-200 dark:border-purple-500/30 rounded-full text-sm text-gray-800 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300"
							>
								{isLoadingVoices ? (
									<option>Loading voices...</option>
								) : voiceOptions.length === 0 ? (
									<option value={DEFAULT_VOICE_KEY}>
										{DEFAULT_VOICE_ID} (Neural Default)
									</option>
								) : (
									voiceOptions.map((voice) => {
										const key = `${voice.id}:${voice.engineVariant}`;
										const engineLabel =
											voice.engineVariant === "neural"
												? "Neural"
												: voice.engineVariant ===
													  "generative"
													? "Generative"
													: voice.engineVariant;

										return (
											<option key={key} value={key}>
												{voice.name} ({voice.gender}) -{" "}
												{engineLabel}
											</option>
										);
									})
								)}
							</select>
						</div>
					</div>
				)}

				{error && (
					<div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-2xl">
						<p className="text-sm text-red-700 dark:text-red-300">
							{error}
						</p>
					</div>
				)}

				<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl p-8">
					<textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Enter or paste your text here..."
						className="w-full h-48 p-4 bg-orange-50/50 dark:bg-slate-700/50 border border-orange-200 dark:border-purple-500/30 rounded-2xl mb-6 text-lg text-gray-800 dark:text-purple-100 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 placeholder-gray-400 dark:placeholder-purple-400/50 transition-all duration-300"
					/>

					<div className="flex flex-col items-center space-y-6">
						<button
							onClick={handlePlayPause}
							className="w-24 h-24 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 hover:from-orange-500 hover:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl dark:shadow-purple-500/30 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
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
								className="w-full h-2 bg-orange-100 dark:bg-purple-900/50 rounded-full cursor-pointer mb-2 overflow-hidden"
								onClick={handleProgressClick}
							>
								<div
									className={`h-full bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 rounded-full transition-all duration-100 ${isPlaying ? "animate-pulse" : ""}`}
									style={{ width: `${progress}%` }}
								/>
							</div>

							<div className="flex justify-between text-sm text-gray-600 dark:text-purple-300">
								<span>{formatTime(currentTime)}</span>
								<span>{formatTime(totalTime)}</span>
							</div>
						</div>

						<div className="w-full flex items-center space-x-4">
							<Volume2
								className="text-orange-500 dark:text-purple-400"
								size={24}
							/>
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={volume}
								onChange={handleVolumeChange}
								className="flex-1 h-2 bg-orange-100 dark:bg-purple-900/50 rounded-full appearance-none cursor-pointer accent-orange-400 dark:accent-purple-500"
							/>
							<span className="text-orange-700 dark:text-purple-300 w-12 text-right font-medium">
								{Math.round(volume * 100)}%
							</span>
						</div>

						<div className="w-full flex items-center justify-center space-x-4">
							<button
								onClick={decreaseSpeed}
								disabled={speed <= MIN_SPEED}
								className="w-10 h-10 bg-orange-100 dark:bg-purple-900/50 hover:bg-orange-200 dark:hover:bg-purple-800/50 disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:text-gray-400 dark:disabled:text-slate-500 text-orange-600 dark:text-purple-300 rounded-full flex items-center justify-center transition-all duration-300"
								title="Decrease speed"
							>
								<Minus size={20} />
							</button>
							<div className="text-center min-w-[80px]">
								<div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
									{speed.toFixed(1)}x
								</div>
								<div className="text-xs text-orange-600/70 dark:text-purple-400/70 font-medium">
									Speed
								</div>
							</div>
							<button
								onClick={increaseSpeed}
								disabled={speed >= MAX_SPEED}
								className="w-10 h-10 bg-orange-100 dark:bg-purple-900/50 hover:bg-orange-200 dark:hover:bg-purple-800/50 disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:text-gray-400 dark:disabled:text-slate-500 text-orange-600 dark:text-purple-300 rounded-full flex items-center justify-center transition-all duration-300"
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
