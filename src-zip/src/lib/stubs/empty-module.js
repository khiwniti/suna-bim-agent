/**
 * Empty module stub for Node.js modules in browser environment
 *
 * Used by Turbopack and Webpack for client-side builds where
 * Node.js modules (fs, path, crypto, etc.) are not available.
 *
 * xeokit-sdk and web-ifc bundle these modules but only use them
 * in Node.js environment for server-side rendering or CLI tools.
 */

// CommonJS exports for require()
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
  module.exports.readFileSync = () => '';
  module.exports.existsSync = () => false;
  module.exports.readFile = (path, callback) => {
    if (typeof callback === 'function') {
      callback(new Error('Not available in browser'));
    }
  };
  module.exports.writeFileSync = () => {};
  module.exports.mkdirSync = () => {};
  module.exports.join = (...args) => args.filter(Boolean).join('/');
  module.exports.resolve = (...args) => args.filter(Boolean).join('/');
  module.exports.dirname = (path) => (path || '').split('/').slice(0, -1).join('/') || '.';
  module.exports.basename = (path) => (path || '').split('/').pop() || '';
  module.exports.extname = (path) => {
    const parts = (path || '').split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  };
  module.exports.normalize = (path) => path;
  module.exports.isAbsolute = () => false;
  module.exports.relative = () => '';
  module.exports.sep = '/';
  // Crypto stubs
  module.exports.randomBytes = (size) => new Uint8Array(size);
  module.exports.createHash = () => ({
    update: () => ({ digest: () => '' }),
  });
}

// ESM default export
export default {};

// Named exports for ES modules
export const readFileSync = () => '';
export const existsSync = () => false;
export const readFile = (path, callback) => {
  if (typeof callback === 'function') {
    callback(new Error('Not available in browser'));
  }
};
export const writeFileSync = () => {};
export const mkdirSync = () => {};
export const join = (...args) => args.filter(Boolean).join('/');
export const resolve = (...args) => args.filter(Boolean).join('/');
export const dirname = (path) => (path || '').split('/').slice(0, -1).join('/') || '.';
export const basename = (path) => (path || '').split('/').pop() || '';
export const extname = (path) => {
  const parts = (path || '').split('.');
  return parts.length > 1 ? '.' + parts.pop() : '';
};
export const normalize = (path) => path;
export const isAbsolute = () => false;
export const relative = () => '';
export const sep = '/';
// Crypto exports
export const randomBytes = (size) => new Uint8Array(size);
export const createHash = () => ({
  update: () => ({ digest: () => '' }),
});
