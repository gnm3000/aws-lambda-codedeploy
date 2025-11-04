import type { CodeDeployLifecycleEvent } from 'aws-lambda';

const putLifecycleEventHookExecutionStatusPromiseMock = jest
  .fn()
  .mockResolvedValue(undefined);
const putLifecycleEventHookExecutionStatusMock = jest
  .fn()
  .mockImplementation(() => ({
    promise: putLifecycleEventHookExecutionStatusPromiseMock,
  }));

jest.mock('aws-sdk', () => ({
  CodeDeploy: jest.fn().mockImplementation(() => ({
    putLifecycleEventHookExecutionStatus: putLifecycleEventHookExecutionStatusMock,
  })),
}));

import AWS from 'aws-sdk';
import { afterAllowTraffic, beforeAllowTraffic } from '../../src/codedeployHooks';

describe('CodeDeploy lifecycle hooks', () => {
  const baseEvent: CodeDeployLifecycleEvent = {
    deploymentId: 'd-1234567890',
    lifecycleEventHookExecutionId: 'hook-1234567890',
  };

  const codeDeployMock = AWS.CodeDeploy as jest.MockedClass<typeof AWS.CodeDeploy>;

  beforeEach(() => {
    putLifecycleEventHookExecutionStatusMock.mockClear();
    putLifecycleEventHookExecutionStatusPromiseMock.mockClear();
    codeDeployMock.mockClear();
  });

  it('runs end-to-end validation in the before traffic hook', async () => {
    await expect(beforeAllowTraffic(baseEvent)).resolves.toEqual({
      deploymentId: baseEvent.deploymentId,
      status: 'BeforeAllowTraffic validation succeeded',
    });

    expect(putLifecycleEventHookExecutionStatusMock).toHaveBeenCalledWith({
      deploymentId: baseEvent.deploymentId,
      lifecycleEventHookExecutionId: baseEvent.lifecycleEventHookExecutionId,
      status: 'Succeeded',
    });
    expect(putLifecycleEventHookExecutionStatusPromiseMock).toHaveBeenCalled();
  });

  it('runs end-to-end validation in the after traffic hook', async () => {
    await expect(afterAllowTraffic(baseEvent)).resolves.toEqual({
      deploymentId: baseEvent.deploymentId,
      status: 'AfterAllowTraffic validation succeeded',
    });

    expect(putLifecycleEventHookExecutionStatusMock).toHaveBeenCalledWith({
      deploymentId: baseEvent.deploymentId,
      lifecycleEventHookExecutionId: baseEvent.lifecycleEventHookExecutionId,
      status: 'Succeeded',
    });
    expect(putLifecycleEventHookExecutionStatusPromiseMock).toHaveBeenCalled();
  });
});
