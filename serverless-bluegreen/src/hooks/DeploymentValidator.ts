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

    if (typeof response !== 'object' || response === null) {
      throw new Error('Expected structured handler response');
    }

    if (!('statusCode' in response)) {
      throw new Error('Expected statusCode in handler response');
    }

    const structuredResponse =
      response as APIGatewayProxyStructuredResultV2;
    const { statusCode, body } = structuredResponse;

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
