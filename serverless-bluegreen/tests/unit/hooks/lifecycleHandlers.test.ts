import { createLifecycleHookHandlers } from '../../../src/hooks/bootstrap';
import type {
  HookDependencies,
  ExtendedCodeDeployLifecycleEvent,
} from '../../../src/hooks/bootstrap';

describe('Lifecycle hook handlers', () => {
  const baseEvent: ExtendedCodeDeployLifecycleEvent = {
    deploymentId: 'd-123',
    lifecycleEventHookExecutionId: 'l-456',
  };

  const createDeps = (): HookDependencies => ({
    deploymentValidator: { validate: jest.fn().mockResolvedValue(undefined) },
    lifecycleNotifier: { notify: jest.fn().mockResolvedValue(undefined) } as any,
  });

  it('notifies CodeDeploy when validation succeeds', async () => {
    const deps = createDeps();
    const handlers = createLifecycleHookHandlers(deps);

    const result = await handlers.beforeAllowTraffic(baseEvent);

    expect(deps.deploymentValidator.validate).toHaveBeenCalledTimes(1);
    expect(deps.lifecycleNotifier.notify).toHaveBeenNthCalledWith(
      1,
      {
        deploymentId: 'd-123',
        lifecycleEventHookExecutionId: 'l-456',
      },
      'Succeeded'
    );
    expect(result).toEqual({
      deploymentId: 'd-123',
      status: 'BeforeAllowTraffic validation succeeded',
    });
  });

  it('reports failure to CodeDeploy when validation throws', async () => {
    const deps = createDeps();
    const failure = new Error('validation failed');
    deps.deploymentValidator.validate = jest.fn().mockRejectedValue(failure);
    const handlers = createLifecycleHookHandlers(deps);

    await expect(handlers.afterAllowTraffic(baseEvent)).rejects.toThrow(
      'validation failed'
    );

    expect(deps.lifecycleNotifier.notify).toHaveBeenCalledWith(
      {
        deploymentId: 'd-123',
        lifecycleEventHookExecutionId: 'l-456',
      },
      'Failed'
    );
  });

  it('supports events using legacy property names', async () => {
    const deps = createDeps();
    const handlers = createLifecycleHookHandlers(deps);

    const event: ExtendedCodeDeployLifecycleEvent = {
      DeploymentId: 'legacy-d',
      LifecycleEventHookExecutionId: 'legacy-l',
    };

    await handlers.beforeAllowTraffic(event);

    expect(deps.lifecycleNotifier.notify).toHaveBeenCalledWith(
      {
        deploymentId: 'legacy-d',
        lifecycleEventHookExecutionId: 'legacy-l',
      },
      'Succeeded'
    );
  });

  it('throws when deployment identifiers are missing', async () => {
    const deps = createDeps();
    const handlers = createLifecycleHookHandlers(deps);

    await expect(handlers.beforeAllowTraffic({})).rejects.toThrow(
      'Missing deploymentId on CodeDeploy event'
    );

    expect(deps.deploymentValidator.validate).not.toHaveBeenCalled();
  });
});
