import { apiConfig } from "../config/aws-config";

interface SynthesizeSpeechParams {
	text: string;
	speed: number;
	voiceId?: string;
}

interface SynthesizeSpeechResponse {
	audioUrl: string;
	characterCount: number;
}

export interface PollyVoice {
	id: string;
	name: string;
	gender: string;
	engine: string[];
	languageCode: string;
	languageName: string;
}

export class PollyTTSService {
	private audio: HTMLAudioElement | null = null;
	private onEndCallback: (() => void) | null = null;
	private onErrorCallback: (() => void) | null = null;
	private objectUrl: string | null = null;
	private voicesCache: PollyVoice[] | null = null;

	async getVoices(authToken: string): Promise<PollyVoice[]> {
		// Return cached voices if available
		if (this.voicesCache) {
			return this.voicesCache;
		}

		const response = await fetch(`${apiConfig.endpoint}/tts/voices`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to get voices: ${error}`);
		}

		const data = await response.json();
		this.voicesCache = data.voices;
		return data.voices;
	}

	async synthesizeSpeech(
		params: SynthesizeSpeechParams,
		authToken: string
	): Promise<SynthesizeSpeechResponse> {
		const response = await fetch(`${apiConfig.endpoint}/tts/synthesize`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({
				text: params.text,
				voiceId: params.voiceId || "Joanna",
				speed: params.speed,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`TTS synthesis failed: ${error}`);
		}

		const data = await response.json();
		console.log("Polly TTS response:", data);

		// Convert base64 audio content to blob URL
		const audioContent = data.audioContent;
		const contentType = data.contentType || "audio/mpeg";

		// Decode base64 to binary
		const binaryString = atob(audioContent);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		// Create blob and object URL
		const blob = new Blob([bytes], { type: contentType });
		const audioUrl = URL.createObjectURL(blob);

		// Clean up previous object URL if it exists
		if (this.objectUrl) {
			URL.revokeObjectURL(this.objectUrl);
		}
		this.objectUrl = audioUrl;

		return {
			audioUrl,
			characterCount: data.characterCount,
		};
	}

	play(audioUrl: string, speed: number = 1.0): void {
		if (this.audio) {
			this.audio.pause();
			this.audio = null;
		}

		this.audio = new Audio(audioUrl);
		this.audio.playbackRate = speed;

		if (this.onEndCallback) {
			this.audio.onended = this.onEndCallback;
		}

		if (this.onErrorCallback) {
			this.audio.onerror = this.onErrorCallback;
		}

		this.audio.play().catch((error) => {
			console.error("Error playing audio:", error);
			if (this.onErrorCallback) {
				this.onErrorCallback();
			}
		});
	}

	pause(): void {
		if (this.audio) {
			this.audio.pause();
		}
	}

	resume(): void {
		if (this.audio) {
			this.audio.play().catch((error) => {
				console.error("Error resuming audio:", error);
				if (this.onErrorCallback) {
					this.onErrorCallback();
				}
			});
		}
	}

	stop(): void {
		if (this.audio) {
			this.audio.pause();
			this.audio.currentTime = 0;
			this.audio = null;
		}
		// Clean up object URL to prevent memory leaks
		if (this.objectUrl) {
			URL.revokeObjectURL(this.objectUrl);
			this.objectUrl = null;
		}
	}

	setVolume(volume: number): void {
		if (this.audio) {
			this.audio.volume = volume;
		}
	}

	setSpeed(speed: number): void {
		if (this.audio) {
			this.audio.playbackRate = speed;
		}
	}

	getCurrentTime(): number {
		return this.audio?.currentTime || 0;
	}

	getDuration(): number {
		return this.audio?.duration || 0;
	}

	isPaused(): boolean {
		return this.audio?.paused ?? true;
	}

	onEnd(callback: () => void): void {
		this.onEndCallback = callback;
		if (this.audio) {
			this.audio.onended = callback;
		}
	}

	onError(callback: () => void): void {
		this.onErrorCallback = callback;
		if (this.audio) {
			this.audio.onerror = callback;
		}
	}
}
