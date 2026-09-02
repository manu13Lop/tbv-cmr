import { describe, it, expect } from 'vitest';
import { createChildLogger } from './logger';

describe('logger', () => {
  it('createChildLogger returns an object with log methods', () => {
    const log = createChildLogger('test-module');
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.debug).toBe('function');
  });

  it('child logger has module name', () => {
    const log = createChildLogger('my-module');
    const bindings = log.bindings();
    expect(bindings.module).toBe('my-module');
    expect(bindings.service).toBe('tbv-cmr');
  });
});
