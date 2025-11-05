import { PutLifecycleEventHookExecutionStatusCommand } from '@aws-sdk/client-codedeploy';
import {
  LifecycleNotifier,
  type LifecycleEventDetails,
} from '../../../src/hooks/LifecycleNotifier';

describe('LifecycleNotifier', () => {
  const details: LifecycleEventDetails = {
    deploymentId: 'd-123',
    lifecycleEventHookExecutionId: 'l-456',
  };

  it('sends status updates to CodeDeploy', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const client = { send } as any;
    const notifier = new LifecycleNotifier(client);

    await expect(notifier.notify(details, 'Succeeded')).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutLifecycleEventHookExecutionStatusCommand);
    expect(command.input).toEqual({
      deploymentId: 'd-123',
      lifecycleEventHookExecutionId: 'l-456',
      status: 'Succeeded',
    });
  });

  it('propagates errors from the AWS SDK client', async () => {
    const error = new Error('boom');
    const client = { send: jest.fn().mockRejectedValue(error) } as any;
    const notifier = new LifecycleNotifier(client);

    await expect(notifier.notify(details, 'Failed')).rejects.toThrow('boom');
  });
});
