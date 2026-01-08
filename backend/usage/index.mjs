import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Lambda handler for retrieving usage statistics
 * Returns usage data for the authenticated user
 */
export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  try {
    // Get user ID from Cognito authorizer
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const days = parseInt(queryParams.days || '30', 10);
    const limit = parseInt(queryParams.limit || '100', 10);

    // Calculate timestamp for filtering
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Query DynamoDB for usage records
    const queryCommand = new QueryCommand({
      TableName: process.env.USAGE_TABLE,
      KeyConditionExpression: 'userId = :userId AND #ts >= :startTime',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startTime': startTime
      },
      Limit: limit,
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(queryCommand);

    // Calculate statistics
    const totalCharacters = result.Items?.reduce((sum, item) => sum + (item.characterCount || 0), 0) || 0;
    const totalRequests = result.Items?.length || 0;

    // Group by voice
    const voiceUsage = {};
    result.Items?.forEach(item => {
      const voice = item.voiceId || 'unknown';
      if (!voiceUsage[voice]) {
        voiceUsage[voice] = { count: 0, characters: 0 };
      }
      voiceUsage[voice].count++;
      voiceUsage[voice].characters += item.characterCount || 0;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId,
        period: {
          days,
          startTime,
          endTime: Date.now()
        },
        summary: {
          totalRequests,
          totalCharacters,
          averageCharactersPerRequest: totalRequests > 0 ? Math.round(totalCharacters / totalRequests) : 0
        },
        voiceUsage,
        recentRequests: result.Items?.slice(0, 10).map(item => ({
          timestamp: item.timestamp,
          characterCount: item.characterCount,
          voiceId: item.voiceId,
          engine: item.engine
        })) || []
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
