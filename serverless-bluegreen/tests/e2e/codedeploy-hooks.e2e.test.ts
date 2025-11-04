const putLifecycleEventHookExecutionStatusPromiseMock = jest
  .fn()
  .mockResolvedValue(undefined);
const putLifecycleEventHookExecutionStatusMock = jest
  .fn()
  .mockImplementation(() => ({
    promise: putLifecycleEventHookExecutionStatusPromiseMock,
  }));

jest.mock(
  'aws-sdk',
  () => ({
    CodeDeploy: jest.fn().mockImplementation(() => ({
      putLifecycleEventHookExecutionStatus:
        putLifecycleEventHookExecutionStatusMock,
    })),
  }),
  { virtual: true }
);

import AWS from 'aws-sdk';
import { afterAllowTraffic, beforeAllowTraffic } from '../../src/codedeployHooks';

describe('CodeDeploy lifecycle hooks', () => {
  const baseEvent: Parameters<typeof beforeAllowTraffic>[0] = {
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

  it('normalizes PascalCase CodeDeploy event properties', async () => {
    const pascalCaseEvent = {
      DeploymentId: 'd-9876543210',
      LifecycleEventHookExecutionId: 'hook-9876543210',
    };

    await expect(beforeAllowTraffic(pascalCaseEvent)).resolves.toEqual({
      deploymentId: 'd-9876543210',
      status: 'BeforeAllowTraffic validation succeeded',
    });

    expect(putLifecycleEventHookExecutionStatusMock).toHaveBeenCalledWith({
      deploymentId: 'd-9876543210',
      lifecycleEventHookExecutionId: 'hook-9876543210',
      status: 'Succeeded',
    });
    expect(putLifecycleEventHookExecutionStatusPromiseMock).toHaveBeenCalled();
  });
});
