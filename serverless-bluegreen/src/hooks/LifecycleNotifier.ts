import {
  PutLifecycleEventHookExecutionStatusCommand,
  type CodeDeployClient,
} from '@aws-sdk/client-codedeploy';
import type { PutLifecycleEventHookExecutionStatusCommandInput } from '@aws-sdk/client-codedeploy';

export type LifecycleEventStatus =
  PutLifecycleEventHookExecutionStatusCommandInput['status'];

export interface LifecycleEventDetails {
  deploymentId: string;
  lifecycleEventHookExecutionId: string;
}

export interface LifecycleNotifierContract {
  notify(
    details: LifecycleEventDetails,
    status: LifecycleEventStatus
  ): Promise<void>;
}

export class LifecycleNotifier implements LifecycleNotifierContract {
  constructor(private readonly client: CodeDeployClient) {}

  public async notify(
    details: LifecycleEventDetails,
    status: LifecycleEventStatus
  ): Promise<void> {
    await this.client.send(
      new PutLifecycleEventHookExecutionStatusCommand({
        deploymentId: details.deploymentId,
        lifecycleEventHookExecutionId: details.lifecycleEventHookExecutionId,
        status,
      })
    );
  }
}
