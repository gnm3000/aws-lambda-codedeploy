import { CodeDeployClient } from '@aws-sdk/client-codedeploy';
import { handler } from '../handler';
import {
  DeploymentValidator,
  type DeploymentValidatorContract,
} from './DeploymentValidator';
import {
  LifecycleNotifier,
  type LifecycleEventDetails,
  type LifecycleNotifierContract,
} from './LifecycleNotifier';

export interface HookDependencies {
  deploymentValidator: DeploymentValidatorContract;
  lifecycleNotifier: LifecycleNotifierContract;
}

export type LifecycleHookHandler = (
  event: ExtendedCodeDeployLifecycleEvent
) => Promise<{ deploymentId: string; status: string }>;

export interface LifecycleHookHandlers {
  beforeAllowTraffic: LifecycleHookHandler;
  afterAllowTraffic: LifecycleHookHandler;
}

export class HookBootstrap {
  public createDependencies(): HookDependencies {
    const codeDeployClient = new CodeDeployClient({});

    return {
      deploymentValidator: new DeploymentValidator(handler),
      lifecycleNotifier: new LifecycleNotifier(codeDeployClient),
    };
  }

  public createHandlers(): LifecycleHookHandlers {
    return createLifecycleHookHandlers(this.createDependencies());
  }
}

export const createLifecycleHookHandlers = ({
  deploymentValidator,
  lifecycleNotifier,
}: HookDependencies): LifecycleHookHandlers => {
  const handleEvent = async (
    event: ExtendedCodeDeployLifecycleEvent,
    hookName: 'BeforeAllowTraffic' | 'AfterAllowTraffic'
  ) => {
    const lifecycleEventDetails = extractLifecycleEventDetails(event);

    try {
      await deploymentValidator.validate();
    } catch (error) {
      console.error(`${hookName} validation failed`, error);
      await lifecycleNotifier.notify(lifecycleEventDetails, 'Failed');
      throw error;
    }

    await lifecycleNotifier.notify(lifecycleEventDetails, 'Succeeded');

    return {
      deploymentId: lifecycleEventDetails.deploymentId,
      status: `${hookName} validation succeeded`,
    };
  };

  return {
    beforeAllowTraffic: (event: ExtendedCodeDeployLifecycleEvent) =>
      handleEvent(event, 'BeforeAllowTraffic'),
    afterAllowTraffic: (event: ExtendedCodeDeployLifecycleEvent) =>
      handleEvent(event, 'AfterAllowTraffic'),
  };
};

interface CodeDeployLifecycleEvent {
  deploymentId?: string;
  lifecycleEventHookExecutionId?: string;
  [key: string]: unknown;
}

export type ExtendedCodeDeployLifecycleEvent = CodeDeployLifecycleEvent & {
  DeploymentId?: string;
  LifecycleEventHookExecutionId?: string;
};

const extractLifecycleEventDetails = (
  event: ExtendedCodeDeployLifecycleEvent
): LifecycleEventDetails => {
  console.log('CodeDeploy lifecycle event keys:', Object.keys(event));

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
