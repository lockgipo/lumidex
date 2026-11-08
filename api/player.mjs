// Vercel Node.js route for the same audited fixed-upstream LumiDex proxy.
import proxy from '../edge/explorer-proxy.mjs';

export default {
  fetch(request) {
    return proxy.fetch(request);
  }
};
