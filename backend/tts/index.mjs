import { PollyClient, SynthesizeSpeechCommand, DescribeVoicesCommand } from '@aws-sdk/client-polly';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const pollyClient = new PollyClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Lambda handler for text-to-speech operations
 * Routes to synthesize speech or list available voices
 */
export const handler = async (event) => {
	console.log('Event:', JSON.stringify(event, null, 2));

	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
		'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
	};

	const path = event.path || event.rawPath || '';

	// Route to appropriate handler
	if (path.endsWith('/voices')) {
		return handleGetVoices(event, headers);
	}

	return handleSynthesizeSpeech(event, headers);
};

/**
 * Get available Polly voices for en-US
 */
async function handleGetVoices(event, headers) {
	try {
		const command = new DescribeVoicesCommand({
			LanguageCode: 'en-US',
		});

		const response = await pollyClient.send(command);

		// Filter and format voices for the frontend
		const voices = response.Voices.map(voice => ({
			id: voice.Id,
			name: voice.Name,
			gender: voice.Gender,
			engine: voice.SupportedEngines,
			languageCode: voice.LanguageCode,
			languageName: voice.LanguageName,
		}));

		// Sort by name for consistent ordering
		voices.sort((a, b) => a.name.localeCompare(b.name));

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({ voices })
		};
	} catch (error) {
		console.error('Error getting voices:', error);
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				error: 'Failed to get voices',
				message: error.message
			})
		};
	}
}

/**
 * Synthesize text to speech using AWS Polly
 */
async function handleSynthesizeSpeech(event, headers) {
	try {
		// Parse request body
		const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
		const { text, voiceId = 'Joanna', engine = 'neural', outputFormat = 'mp3' } = body;

		// Validate input
		if (!text || typeof text !== 'string' || text.trim().length === 0) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ error: 'Text is required and must be a non-empty string' })
			};
		}

		if (text.length > 100000) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ error: 'Text is too long. Maximum 100,000 characters allowed.' })
			};
		}

		// Get user ID from Cognito authorizer
		const userId = event.requestContext?.authorizer?.claims?.sub || 'unknown';

		// Synthesize speech with Polly
		const pollyParams = {
			Text: text,
			OutputFormat: outputFormat,
			VoiceId: voiceId,
			Engine: engine
		};

		console.log('Polly params:', pollyParams);
		const pollyCommand = new SynthesizeSpeechCommand(pollyParams);
		const pollyResponse = await pollyClient.send(pollyCommand);

		// Convert audio stream to base64
		const audioStream = pollyResponse.AudioStream;
		const audioBuffer = await streamToBuffer(audioStream);
		const audioBase64 = audioBuffer.toString('base64');

		// Track usage in DynamoDB
		const timestamp = Date.now();
		const usageRecord = {
			userId,
			timestamp,
			characterCount: text.length,
			voiceId,
			engine,
			outputFormat,
			ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
		};

		const putCommand = new PutCommand({
			TableName: process.env.USAGE_TABLE,
			Item: usageRecord
		});

		await docClient.send(putCommand);

		return {
			statusCode: 200,
			headers: {
				...headers,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				audioContent: audioBase64,
				contentType: pollyResponse.ContentType,
				characterCount: text.length,
				voiceId,
				engine
			})
		};

	} catch (error) {
		console.error('Error:', error);

		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				error: 'Internal server error',
				message: error.message
			})
		};
	}
};

/**
 * Convert a readable stream to a buffer
 */
async function streamToBuffer(stream) {
	const chunks = [];
	for await (const chunk of stream) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}
