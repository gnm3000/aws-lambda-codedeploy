import { handler } from '../../src/handler';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('hello handler', () => {
  it('should return 200 and message', async () => {
    const event: APIGatewayProxyEventV2 = {
      version: '2.0',
      routeKey: 'GET /',
      rawPath: '/',
      rawQueryString: '',
      headers: {},
      requestContext: {} as any,
      isBase64Encoded: false
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    if (!result.body) {
      throw new Error('Expected response body to be present');
    }
    expect(JSON.parse(result.body)).toHaveProperty('message', 'Hello Blue/Green!');
  });
});
