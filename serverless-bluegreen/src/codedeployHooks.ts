import AWS from 'aws-sdk';
import type {
  APIGatewayProxyEventV2,
  CodeDeployLifecycleEvent,
} from 'aws-lambda';
import { handler } from './handler';

const codeDeployClient = new AWS.CodeDeploy();

const runEndToEndValidation = async (): Promise<void> => {
  const event: APIGatewayProxyEventV2 = {
    version: '2.0',
    routeKey: 'GET /',
    rawPath: '/',
    rawQueryString: '',
    headers: {},
    requestContext: {} as any,
    isBase64Encoded: false,
  };

  const response = await handler(event);

  if (response.statusCode !== 200) {
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  }

  if (!response.body) {
    throw new Error('Expected body in handler response');
  }

  const payload = JSON.parse(response.body);

  if (payload.message !== 'Hello Blue/Green!') {
    throw new Error('Unexpected response message');
  }
};

const notifyCodeDeploy = async (
  event: CodeDeployLifecycleEvent,
  status: AWS.CodeDeploy.LifecycleEventStatus
): Promise<void> => {
  if (!event.lifecycleEventHookExecutionId) {
    throw new Error('Missing lifecycleEventHookExecutionId on CodeDeploy event');
  }

  await codeDeployClient
    .putLifecycleEventHookExecutionStatus({
      deploymentId: event.deploymentId,
      lifecycleEventHookExecutionId: event.lifecycleEventHookExecutionId,
      status,
    })
    .promise();
};

export const beforeAllowTraffic = async (
  event: CodeDeployLifecycleEvent
): Promise<{ deploymentId: string; status: string }> => {
  try {
    await runEndToEndValidation();
  } catch (error) {
    await notifyCodeDeploy(event, 'Failed');
    throw error;
  }

  await notifyCodeDeploy(event, 'Succeeded');

  return {
    deploymentId: event.deploymentId,
    status: 'BeforeAllowTraffic validation succeeded',
  };
};

export const afterAllowTraffic = async (
  event: CodeDeployLifecycleEvent
): Promise<{ deploymentId: string; status: string }> => {
  try {
    await runEndToEndValidation();
  } catch (error) {
    await notifyCodeDeploy(event, 'Failed');
    throw error;
  }

  await notifyCodeDeploy(event, 'Succeeded');

  return {
    deploymentId: event.deploymentId,
    status: 'AfterAllowTraffic validation succeeded',
  };
};
