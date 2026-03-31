// test-framework.js — Tiny test framework
//
// A minimal but complete test framework: describe, it, expect, hooks, and runner.
// Outputs TAP (Test Anything Protocol) for compatibility.

let currentSuite = null;
const suites = [];

export function describe(name, fn) {
  const suite = {
    name,
    tests: [],
    beforeEach: [],
    afterEach: [],
    beforeAll: [],
    afterAll: [],
    children: [],
    parent: currentSuite,
  };

  if (currentSuite) {
    currentSuite.children.push(suite);
  } else {
    suites.push(suite);
  }

  const prev = currentSuite;
  currentSuite = suite;
  fn();
  currentSuite = prev;
}

export function it(name, fn) {
  if (!currentSuite) throw new Error('it() must be inside describe()');
  currentSuite.tests.push({ name, fn });
}

// Aliases
export const test = it;

export function beforeEach(fn) {
  if (!currentSuite) throw new Error('beforeEach() must be inside describe()');
  currentSuite.beforeEach.push(fn);
}

export function afterEach(fn) {
  if (!currentSuite) throw new Error('afterEach() must be inside describe()');
  currentSuite.afterEach.push(fn);
}

export function beforeAll(fn) {
  if (!currentSuite) throw new Error('beforeAll() must be inside describe()');
  currentSuite.beforeAll.push(fn);
}

export function afterAll(fn) {
  if (!currentSuite) throw new Error('afterAll() must be inside describe()');
  currentSuite.afterAll.push(fn);
}

// === Assertions ===
export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new AssertionError(`Expected ${fmt(expected)}, got ${fmt(actual)}`);
    },
    toEqual(expected) {
      if (!deepEqual(actual, expected)) throw new AssertionError(`Expected ${fmt(expected)}, got ${fmt(actual)}`);
    },
    toBeTruthy() {
      if (!actual) throw new AssertionError(`Expected truthy, got ${fmt(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new AssertionError(`Expected falsy, got ${fmt(actual)}`);
    },
    toBeNull() {
      if (actual !== null) throw new AssertionError(`Expected null, got ${fmt(actual)}`);
    },
    toBeUndefined() {
      if (actual !== undefined) throw new AssertionError(`Expected undefined, got ${fmt(actual)}`);
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) throw new AssertionError(`Expected ${fmt(actual)} > ${fmt(expected)}`);
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) throw new AssertionError(`Expected ${fmt(actual)} < ${fmt(expected)}`);
    },
    toContain(item) {
      if (Array.isArray(actual)) {
        if (!actual.includes(item)) throw new AssertionError(`Expected array to contain ${fmt(item)}`);
      } else if (typeof actual === 'string') {
        if (!actual.includes(item)) throw new AssertionError(`Expected string to contain ${fmt(item)}`);
      }
    },
    toThrow(expectedMessage) {
      let threw = false;
      try { actual(); } catch (e) {
        threw = true;
        if (expectedMessage && !e.message.includes(expectedMessage)) {
          throw new AssertionError(`Expected error "${expectedMessage}", got "${e.message}"`);
        }
      }
      if (!threw) throw new AssertionError('Expected function to throw');
    },
    toHaveLength(expected) {
      if (actual.length !== expected) throw new AssertionError(`Expected length ${expected}, got ${actual.length}`);
    },
    toBeInstanceOf(cls) {
      if (!(actual instanceof cls)) throw new AssertionError(`Expected instance of ${cls.name}`);
    },
    not: {
      toBe(expected) {
        if (actual === expected) throw new AssertionError(`Expected not ${fmt(expected)}`);
      },
      toEqual(expected) {
        if (deepEqual(actual, expected)) throw new AssertionError(`Expected not equal to ${fmt(expected)}`);
      },
      toContain(item) {
        if (Array.isArray(actual) && actual.includes(item)) {
          throw new AssertionError(`Expected array not to contain ${fmt(item)}`);
        }
      },
    },
  };
}

class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

// === Runner ===
export async function run({ verbose = true } = {}) {
  let passed = 0, failed = 0, skipped = 0;
  const failures = [];
  let testNum = 0;

  if (verbose) console.log('TAP version 13');

  async function runSuite(suite, prefix = '') {
    const fullName = prefix ? `${prefix} > ${suite.name}` : suite.name;

    // beforeAll
    for (const fn of suite.beforeAll) await fn();

    // Tests
    for (const test of suite.tests) {
      testNum++;
      try {
        for (const fn of suite.beforeEach) await fn();
        await test.fn();
        for (const fn of suite.afterEach) await fn();
        passed++;
        if (verbose) console.log(`ok ${testNum} - ${fullName} > ${test.name}`);
      } catch (err) {
        failed++;
        failures.push({ name: `${fullName} > ${test.name}`, error: err });
        if (verbose) {
          console.log(`not ok ${testNum} - ${fullName} > ${test.name}`);
          console.log(`  ---`);
          console.log(`  message: ${err.message}`);
          console.log(`  ---`);
        }
      }
    }

    // Children
    for (const child of suite.children) {
      await runSuite(child, fullName);
    }

    // afterAll
    for (const fn of suite.afterAll) await fn();
  }

  for (const suite of suites) {
    await runSuite(suite);
  }

  if (verbose) {
    console.log(`\n1..${testNum}`);
    console.log(`# tests ${testNum}`);
    console.log(`# pass ${passed}`);
    console.log(`# fail ${failed}`);
  }

  // Clear suites for next run
  suites.length = 0;

  return { passed, failed, skipped, total: testNum, failures };
}

// Helpers
function fmt(v) {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return `"${v}"`;
  if (Array.isArray(v)) return `[${v.map(fmt).join(', ')}]`;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a), keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}
