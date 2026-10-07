import { describe, expect, it } from 'vitest';
import { SHARED_VERSION } from './index';

describe('shared package', () => {
  it('should export version', () => {
    expect(SHARED_VERSION).toBe('0.1.0');
  });
});
