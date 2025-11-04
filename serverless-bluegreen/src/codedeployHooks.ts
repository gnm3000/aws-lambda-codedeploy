import AWS from 'aws-sdk';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from './handler';

interface CodeDeployLifecycleEvent {
  deploymentId?: string;
  lifecycleEventHookExecutionId?: string;
  [key: string]: unknown;
}

type ExtendedCodeDeployLifecycleEvent = CodeDeployLifecycleEvent & {
  DeploymentId?: string;
  LifecycleEventHookExecutionId?: string;
};

interface LifecycleEventDetails {
  deploymentId: string;
  lifecycleEventHookExecutionId: string;
}

const codeDeployClient = new AWS.CodeDeploy();

const extractLifecycleEventDetails = (
  event: ExtendedCodeDeployLifecycleEvent
): LifecycleEventDetails => {
  const deploymentId = event.deploymentId ?? event.DeploymentId;
  if (!deploymentId) {
    throw new Error('Missing deploymentId on CodeDeploy event');
  }

  const lifecycleEventHookExecutionId =
    event.lifecycleEventHookExecutionId ?? event.LifecycleEventHookExecutionId;
  if (!lifecycleEventHookExecutionId) {
    throw new Error('Missing lifecycleEventHookExecutionId on CodeDeploy event');
  }

  return { deploymentId, lifecycleEventHookExecutionId };
};

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
  details: LifecycleEventDetails,
  status: AWS.CodeDeploy.LifecycleEventStatus
): Promise<void> => {
  await codeDeployClient
    .putLifecycleEventHookExecutionStatus({
      deploymentId: details.deploymentId,
      lifecycleEventHookExecutionId: details.lifecycleEventHookExecutionId,
      status,
    })
    .promise();
};

export const beforeAllowTraffic = async (
  event: ExtendedCodeDeployLifecycleEvent
): Promise<{ deploymentId: string; status: string }> => {
  const lifecycleEventDetails = extractLifecycleEventDetails(event);

  try {
    await runEndToEndValidation();
  } catch (error) {
    await notifyCodeDeploy(lifecycleEventDetails, 'Failed');
    throw error;
  }

  await notifyCodeDeploy(lifecycleEventDetails, 'Succeeded');

  return {
    deploymentId: lifecycleEventDetails.deploymentId,
    status: 'BeforeAllowTraffic validation succeeded',
  };
};

export const afterAllowTraffic = async (
  event: ExtendedCodeDeployLifecycleEvent
): Promise<{ deploymentId: string; status: string }> => {
  const lifecycleEventDetails = extractLifecycleEventDetails(event);

  try {
    await runEndToEndValidation();
  } catch (error) {
    await notifyCodeDeploy(lifecycleEventDetails, 'Failed');
    throw error;
  }

  await notifyCodeDeploy(lifecycleEventDetails, 'Succeeded');

  return {
    deploymentId: lifecycleEventDetails.deploymentId,
    status: 'AfterAllowTraffic validation succeeded',
  };
};
