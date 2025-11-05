import { HookBootstrap } from './hooks/bootstrap';

const bootstrap = new HookBootstrap();
const { beforeAllowTraffic, afterAllowTraffic } = bootstrap.createHandlers();

export { beforeAllowTraffic, afterAllowTraffic };
