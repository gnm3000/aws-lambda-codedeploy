import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

export type ApiGatewayHandler = (
  event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyResultV2>;

export interface DeploymentValidatorOptions {
  event?: APIGatewayProxyEventV2;
  expectedMessage?: string;
}

export interface DeploymentValidatorContract {
  validate(): Promise<void>;
}

const isStructuredResult = (
  response: APIGatewayProxyResultV2
): response is APIGatewayProxyStructuredResultV2 =>
  typeof response === 'object' && response !== null && 'statusCode' in response;

export class DeploymentValidator implements DeploymentValidatorContract {
  private readonly event: APIGatewayProxyEventV2;
  private readonly expectedMessage: string;

  constructor(
    private readonly handler: ApiGatewayHandler,
    options: DeploymentValidatorOptions = {}
  ) {
    this.event =
      options.event ??
      ({
        version: '2.0',
        routeKey: 'GET /',
        rawPath: '/',
        rawQueryString: '',
        headers: {},
        requestContext: {} as any,
        isBase64Encoded: false,
      } satisfies APIGatewayProxyEventV2);
    this.expectedMessage = options.expectedMessage ?? 'Hello Blue/Green!';
  }

  public async validate(): Promise<void> {
    const response = await this.handler(this.event);

    if (!isStructuredResult(response)) {
      throw new Error('Expected statusCode in handler response');
    }
    const { statusCode, body } = response;

    if (statusCode !== 200) {
      throw new Error(`Unexpected status code: ${statusCode}`);
    }

    if (!body) {
      throw new Error('Expected body in handler response');
    }

    const payload = JSON.parse(body);

    if (payload.message !== this.expectedMessage) {
      throw new Error('Unexpected response message');
    }
  }
}
