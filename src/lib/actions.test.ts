import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, fail } from './actions';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('ok', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success true', () => {
    const result = ok();
    expect(result).toEqual({ success: true });
  });

  it('revalidates path when provided', async () => {
    const { revalidatePath } = await import('next/cache');
    ok('/test');
    expect(revalidatePath).toHaveBeenCalledWith('/test');
  });

  it('does not revalidate when no path', async () => {
    const { revalidatePath } = await import('next/cache');
    ok();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('fail', () => {
  it('returns success false with error message', () => {
    const result = fail('something went wrong');
    expect(result).toEqual({ success: false, error: 'something went wrong' });
  });
});
