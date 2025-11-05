import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { DeploymentValidator } from '../../../src/hooks/DeploymentValidator';

describe('DeploymentValidator', () => {
  const createHandler = (result: APIGatewayProxyResultV2) =>
    jest.fn().mockResolvedValue(result);

  it('passes when handler returns expected response', async () => {
    const handler = createHandler({
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello Blue/Green!' }),
    });

    const validator = new DeploymentValidator(handler);

    await expect(validator.validate()).resolves.toBeUndefined();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fails when handler returns non-200 status', async () => {
    const handler = createHandler({
      statusCode: 500,
      body: JSON.stringify({ message: 'Hello Blue/Green!' }),
    });

    const validator = new DeploymentValidator(handler);

    await expect(validator.validate()).rejects.toThrow(
      'Unexpected status code: 500'
    );
  });

  it('fails when handler does not return a body', async () => {
    const handler = createHandler({ statusCode: 200 });

    const validator = new DeploymentValidator(handler);

    await expect(validator.validate()).rejects.toThrow(
      'Expected body in handler response'
    );
  });

  it('fails when handler returns unexpected message', async () => {
    const handler = createHandler({
      statusCode: 200,
      body: JSON.stringify({ message: 'Different message' }),
    });

    const validator = new DeploymentValidator(handler);

    await expect(validator.validate()).rejects.toThrow(
      'Unexpected response message'
    );
  });
});
