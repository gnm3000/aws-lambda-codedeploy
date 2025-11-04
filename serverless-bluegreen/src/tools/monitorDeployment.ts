import AWS from 'aws-sdk';

type DeploymentTerminalStatus =
  | AWS.CodeDeploy.DeploymentStatus
  | 'Failed'
  | 'Stopped'
  | 'Succeeded';

interface MonitorOptions {
  deploymentId: string;
  pollIntervalMs: number;
}

const codeDeploy = new AWS.CodeDeploy();

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const parseArguments = (): MonitorOptions => {
  const [, , ...args] = process.argv;

  let deploymentId = '';
  let pollIntervalMs = 5000;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    switch (arg) {
      case '--deployment-id':
      case '-d':
        deploymentId = args[index + 1] ?? '';
        index += 1;
        break;
      case '--interval':
      case '-i':
        pollIntervalMs = Number(args[index + 1] ?? pollIntervalMs);
        index += 1;
        break;
      default:
        break;
    }
  }

  if (!deploymentId) {
    throw new Error('Usage: ts-node monitorDeployment.ts --deployment-id <deployment-id> [--interval <ms>]');
  }

  if (Number.isNaN(pollIntervalMs) || pollIntervalMs <= 0) {
    throw new Error('Poll interval must be a positive number of milliseconds');
  }

  return { deploymentId, pollIntervalMs };
};

const logLifecycleEvents = (
  lifecycleEvents: AWS.CodeDeploy.LifecycleEvent[] | undefined,
  indent = '  '
): void => {
  lifecycleEvents?.forEach((event) => {
    const start = event.startTime?.toISOString() ?? 'pending';
    const end = event.endTime?.toISOString() ?? 'pending';
    const status = event.status ?? 'Unknown';

    console.log(`${indent}${event.lifecycleEventName}: ${status} (start: ${start}, end: ${end})`);
  });
};

const isTerminalStatus = (status: AWS.CodeDeploy.DeploymentStatus | undefined): status is DeploymentTerminalStatus =>
  status === 'Failed' || status === 'Stopped' || status === 'Succeeded';

const monitorDeployment = async ({ deploymentId, pollIntervalMs }: MonitorOptions): Promise<void> => {
  console.log(`🔍 Monitoring deployment ${deploymentId} every ${pollIntervalMs}ms`);

  while (true) {
    const { deploymentInfo } = await codeDeploy
      .getDeployment({
        deploymentId,
      })
      .promise();

    if (!deploymentInfo) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Deployment status: ${deploymentInfo.status ?? 'Unknown'}`);

    const targetIdsResponse = await codeDeploy
      .listDeploymentTargets({
        deploymentId,
      })
      .promise();

    const targetIds = targetIdsResponse.targetIds ?? [];

    if (targetIds.length === 0) {
      console.log('  No deployment targets available yet.');
    }

    for (const targetId of targetIds) {
      if (!targetId) {
        continue;
      }

      const targetResponse = await codeDeploy
        .getDeploymentTarget({
          deploymentId,
          targetId,
        })
        .promise();

      const lambdaTarget = targetResponse.deploymentTarget?.lambdaTarget;

      if (!lambdaTarget) {
        console.log(`  Target ${targetId} has no Lambda target details.`);
        continue;
      }

      console.log(`  Target ${targetId} status: ${lambdaTarget.status ?? 'Unknown'}`);
      logLifecycleEvents(lambdaTarget.lifecycleEvents);
    }

    if (isTerminalStatus(deploymentInfo.status)) {
      console.log(`✅ Deployment reached terminal state: ${deploymentInfo.status}`);
      return;
    }

    await sleep(pollIntervalMs);
  }
};

void monitorDeployment(parseArguments())
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error: unknown) => {
    console.error('Deployment monitoring failed:', error);
    process.exitCode = 1;
  });

