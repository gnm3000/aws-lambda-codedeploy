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

export class LifecycleNotifier {
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
