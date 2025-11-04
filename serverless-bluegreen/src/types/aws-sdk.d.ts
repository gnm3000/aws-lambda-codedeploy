declare module 'aws-sdk' {
  export namespace CodeDeploy {
    type LifecycleEventStatus =
      | 'Pending'
      | 'InProgress'
      | 'Succeeded'
      | 'Failed'
      | 'Skipped'
      | 'Unknown'
      | 'Ready';

    interface PutLifecycleEventHookExecutionStatusInput {
      deploymentId: string;
      lifecycleEventHookExecutionId: string;
      status: LifecycleEventStatus;
    }
  }

  class CodeDeploy {
    constructor(options?: Record<string, unknown>);
    putLifecycleEventHookExecutionStatus(
      params: CodeDeploy.PutLifecycleEventHookExecutionStatusInput
    ): { promise(): Promise<void> };
  }

  interface AWSExport {
    CodeDeploy: typeof CodeDeploy;
  }

  const AWS: AWSExport;
  export = AWS;
}
