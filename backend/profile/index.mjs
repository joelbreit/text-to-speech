import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Lambda handler for retrieving user profile information
 * Returns user details and basic usage statistics
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
    // Get user information from Cognito authorizer
    const claims = event.requestContext?.authorizer?.claims;

    if (!claims) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const userId = claims.sub;
    const email = claims.email;

    // Get recent usage statistics (last 30 days)
    const startTime = Date.now() - (30 * 24 * 60 * 60 * 1000);

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
      ScanIndexForward: false
    });

    const result = await docClient.send(queryCommand);

    // Calculate statistics
    const totalCharacters = result.Items?.reduce((sum, item) => sum + (item.characterCount || 0), 0) || 0;
    const totalRequests = result.Items?.length || 0;

    // Get first and last usage timestamps
    const timestamps = result.Items?.map(item => item.timestamp).sort((a, b) => a - b) || [];
    const firstUsage = timestamps.length > 0 ? timestamps[0] : null;
    const lastUsage = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId,
        email,
        usage: {
          last30Days: {
            totalRequests,
            totalCharacters
          },
          firstUsage,
          lastUsage
        }
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
