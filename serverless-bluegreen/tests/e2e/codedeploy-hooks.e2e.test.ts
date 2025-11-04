const sendMock = jest.fn().mockResolvedValue(undefined);
const commandMock = jest.fn().mockImplementation((input) => ({ input }));
const codeDeployClientMock = jest
  .fn()
  .mockImplementation(() => ({ send: sendMock }));

jest.mock('@aws-sdk/client-codedeploy', () => ({
  CodeDeployClient: codeDeployClientMock,
  PutLifecycleEventHookExecutionStatusCommand: commandMock,
}));

import { afterAllowTraffic, beforeAllowTraffic } from '../../src/codedeployHooks';

describe('CodeDeploy lifecycle hooks', () => {
  const baseEvent: Parameters<typeof beforeAllowTraffic>[0] = {
    deploymentId: 'd-1234567890',
    lifecycleEventHookExecutionId: 'hook-1234567890',
  };

  beforeEach(() => {
    sendMock.mockClear();
    commandMock.mockClear();
    codeDeployClientMock.mockClear();
  });

  it('runs end-to-end validation in the before traffic hook', async () => {
    await expect(beforeAllowTraffic(baseEvent)).resolves.toEqual({
      deploymentId: baseEvent.deploymentId,
      status: 'BeforeAllowTraffic validation succeeded',
    });

    expect(commandMock).toHaveBeenCalledWith({
      deploymentId: baseEvent.deploymentId,
      lifecycleEventHookExecutionId: baseEvent.lifecycleEventHookExecutionId,
      status: 'Succeeded',
    });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          deploymentId: baseEvent.deploymentId,
          lifecycleEventHookExecutionId: baseEvent.lifecycleEventHookExecutionId,
          status: 'Succeeded',
        },
      })
    );
  });

  it('runs end-to-end validation in the after traffic hook', async () => {
    await expect(afterAllowTraffic(baseEvent)).resolves.toEqual({
      deploymentId: baseEvent.deploymentId,
      status: 'AfterAllowTraffic validation succeeded',
    });

    expect(commandMock).toHaveBeenCalledWith({
      deploymentId: baseEvent.deploymentId,
      lifecycleEventHookExecutionId: baseEvent.lifecycleEventHookExecutionId,
      status: 'Succeeded',
    });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          deploymentId: baseEvent.deploymentId,
          lifecycleEventHookExecutionId: baseEvent.lifecycleEventHookExecutionId,
          status: 'Succeeded',
        },
      })
    );
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

    expect(commandMock).toHaveBeenCalledWith({
      deploymentId: 'd-9876543210',
      lifecycleEventHookExecutionId: 'hook-9876543210',
      status: 'Succeeded',
    });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          deploymentId: 'd-9876543210',
          lifecycleEventHookExecutionId: 'hook-9876543210',
          status: 'Succeeded',
        },
      })
    );
  });
});
