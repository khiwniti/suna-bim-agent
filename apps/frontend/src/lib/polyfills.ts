// Polyfill for Promise.withResolvers (Node.js 21+ feature)
// This is needed for react-pdf compatibility with Node.js 20
if (!Promise.withResolvers) {
  Promise.withResolvers = function <T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
  } {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    return { promise, resolve: resolve!, reject: reject! };
  };
}

// Polyfill for crypto.randomUUID (Node.js <19, older browsers)
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = function(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

// Suppress specific React warnings from third-party libraries (e.g., Syncfusion)
// These warnings are harmless but noisy - they come from libraries using deprecated patterns
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // Filter out the "selected" on <option> warning from Syncfusion components
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>')
    ) {
      return; // Suppress this specific warning
    }
    originalError.apply(console, args);
  };
}

export {};
