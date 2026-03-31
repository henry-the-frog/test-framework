// Testing the test framework using itself (meta!)
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, run } from '../src/index.js';

describe('expect.toBe', () => {
  it('should pass for equal primitives', () => {
    expect(42).toBe(42);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
    expect(null).toBe(null);
  });

  it('should fail for different values', () => {
    expect(() => expect(1).toBe(2)).toThrow();
  });
});

describe('expect.toEqual', () => {
  it('should deep compare objects', () => {
    expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
  });

  it('should deep compare arrays', () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it('should fail for different objects', () => {
    expect(() => expect({ a: 1 }).toEqual({ a: 2 })).toThrow();
  });

  it('should handle nested objects', () => {
    expect({ a: { b: [1, 2] } }).toEqual({ a: { b: [1, 2] } });
  });
});

describe('expect.toBeTruthy/toBeFalsy', () => {
  it('should check truthy', () => {
    expect(1).toBeTruthy();
    expect('hello').toBeTruthy();
    expect(true).toBeTruthy();
    expect([]).toBeTruthy();
  });

  it('should check falsy', () => {
    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(false).toBeFalsy();
    expect(null).toBeFalsy();
  });
});

describe('expect.toBeNull/toBeUndefined', () => {
  it('should check null', () => {
    expect(null).toBeNull();
    expect(() => expect(0).toBeNull()).toThrow();
  });

  it('should check undefined', () => {
    expect(undefined).toBeUndefined();
  });
});

describe('expect.comparison', () => {
  it('should check greater than', () => {
    expect(5).toBeGreaterThan(3);
    expect(() => expect(3).toBeGreaterThan(5)).toThrow();
  });

  it('should check less than', () => {
    expect(3).toBeLessThan(5);
  });
});

describe('expect.toContain', () => {
  it('should check array contains', () => {
    expect([1, 2, 3]).toContain(2);
    expect(() => expect([1, 2]).toContain(5)).toThrow();
  });

  it('should check string contains', () => {
    expect('hello world').toContain('world');
  });
});

describe('expect.toThrow', () => {
  it('should detect thrown errors', () => {
    expect(() => { throw new Error('oops'); }).toThrow();
  });

  it('should check error message', () => {
    expect(() => { throw new Error('bad input'); }).toThrow('bad input');
  });

  it('should fail when no error thrown', () => {
    // This is a meta-test: expect that expect().toThrow() throws when fn doesn't throw
    let threw = false;
    try {
      expect(() => {}).toThrow();
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe('expect.toHaveLength', () => {
  it('should check length', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect('hello').toHaveLength(5);
  });
});

describe('expect.not', () => {
  it('should negate toBe', () => {
    expect(1).not.toBe(2);
    expect(() => expect(1).not.toBe(1)).toThrow();
  });

  it('should negate toEqual', () => {
    expect({ a: 1 }).not.toEqual({ a: 2 });
  });

  it('should negate toContain', () => {
    expect([1, 2]).not.toContain(5);
  });
});

describe('Hooks', () => {
  let counter;

  beforeEach(() => { counter = 0; });
  afterEach(() => { counter = -1; });

  it('should run beforeEach', () => {
    expect(counter).toBe(0);
  });

  it('should reset between tests', () => {
    counter = 99;
    expect(counter).toBe(99);
  });
});

describe('Async tests', () => {
  it('should handle async tests', async () => {
    const result = await new Promise(resolve => setTimeout(() => resolve(42), 10));
    expect(result).toBe(42);
  });
});

// Run the meta-tests
const results = await run({ verbose: true });

// Final check (outside the framework)
if (results.failed > 0) {
  console.error(`\n❌ ${results.failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${results.passed} tests passed!`);
}
