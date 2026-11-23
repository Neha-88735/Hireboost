import vm from 'node:vm';
import { spawn } from 'node:child_process';
import type {
  CodingExecutionResult,
  CodingLanguage,
  CodingTestCase,
  CodingTestCaseResult
} from '../src/types/hireboost';

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function safeFormat(val: unknown): string {
  if (val === undefined) return 'undefined';
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

async function runJavascriptTestCases(
  code: string,
  functionName: string,
  testCases: CodingTestCase[],
  timeoutMs: number
): Promise<{ executionResults: CodingExecutionResult; testCaseResults: CodingTestCaseResult[] }> {
  const startAll = Date.now();
  const stdoutLines: string[] = [];
  const results: CodingTestCaseResult[] = [];
  let timedOut = false;
  let hadRuntimeError = false;
  let globalError = '';

  const sandboxConsole = {
    log: (...args: unknown[]) => {
      if (stdoutLines.length < 30) {
        stdoutLines.push(args.map((a) => (typeof a === 'string' ? a : safeFormat(a))).join(' '));
      }
    },
    warn: (...args: unknown[]) => {
      if (stdoutLines.length < 30) {
        stdoutLines.push(args.map((a) => (typeof a === 'string' ? a : safeFormat(a))).join(' '));
      }
    },
    error: (...args: unknown[]) => {
      if (stdoutLines.length < 30) {
        stdoutLines.push(args.map((a) => (typeof a === 'string' ? a : safeFormat(a))).join(' '));
      }
    }
  };

  const context = vm.createContext({
    console: sandboxConsole,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    Date,
    RegExp,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite
  });

  try {
    vm.runInContext(code, context, { timeout: timeoutMs });
  } catch (err: any) {
    const msg = err?.message || 'Syntax or initialization error';
    const isTimeout = /timed out/i.test(msg);
    return {
      executionResults: {
        status: isTimeout ? 'Timeout' : 'Runtime Error',
        stdout: stdoutLines.join('\n'),
        stderr: msg,
        executionTimeMs: Date.now() - startAll,
        passedCount: 0,
        totalCount: testCases.length
      },
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: isTimeout ? 'Timeout' : 'Error',
        passed: false,
        error: msg
      }))
    };
  }

  const fn = context[functionName];
  if (typeof fn !== 'function') {
    const msg = `Function "${functionName}" was not defined. Keep the required function signature.`;
    return {
      executionResults: {
        status: 'Runtime Error',
        stdout: stdoutLines.join('\n'),
        stderr: msg,
        executionTimeMs: Date.now() - startAll,
        passedCount: 0,
        totalCount: testCases.length
      },
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: 'undefined',
        passed: false,
        error: msg
      }))
    };
  }

  for (const tc of testCases) {
    try {
      const args = JSON.parse(tc.input);
      const expected = JSON.parse(tc.expectedOutput);
      const argList = Array.isArray(args) ? args : [args];
      context.__tc_args__ = argList;
      const actual = vm.runInContext(`${functionName}(...__tc_args__)`, context, {
        timeout: Math.max(800, Math.floor(timeoutMs / Math.max(1, testCases.length)))
      });
      const passed = deepEqual(actual, expected);
      results.push({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: safeFormat(actual),
        passed
      });
    } catch (err: any) {
      const msg = err?.message || 'Execution error';
      if (/timed out/i.test(msg)) timedOut = true;
      else hadRuntimeError = true;
      if (!globalError) globalError = msg;
      results.push({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: 'Error',
        passed: false,
        error: msg
      });
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const status: CodingExecutionResult['status'] = timedOut
    ? 'Timeout'
    : hadRuntimeError && passedCount === 0
      ? 'Runtime Error'
      : passedCount === testCases.length && testCases.length > 0
        ? 'Passed'
        : 'Failed';

  return {
    executionResults: {
      status,
      stdout: stdoutLines.join('\n'),
      stderr: globalError || undefined,
      executionTimeMs: Date.now() - startAll,
      passedCount,
      totalCount: testCases.length
    },
    testCaseResults: results
  };
}

async function runPythonTestCases(
  code: string,
  functionName: string,
  testCases: CodingTestCase[],
  timeoutMs: number
): Promise<{ executionResults: CodingExecutionResult; testCaseResults: CodingTestCaseResult[] }> {
  const startAll = Date.now();
  const payload = JSON.stringify({ code, functionName, testCases });

  const pyHarness = `
import json, sys, io, traceback
from contextlib import redirect_stdout

data = json.loads(sys.stdin.read())
user_code = data["code"]
fn_name = data["functionName"]
test_cases = data["testCases"]

stdout_buf = io.StringIO()
ns = {}
try:
    with redirect_stdout(stdout_buf):
        exec(compile(user_code, "<candidate_solution>", "exec"), ns, ns)
except Exception as e:
    err_msg = f"{type(e).__name__}: {e}"
    print(json.dumps({
        "status": "Runtime Error",
        "stdout": stdout_buf.getvalue()[:2000],
        "stderr": err_msg,
        "results": [
            {
                "id": tc["id"],
                "input": tc["input"],
                "expectedOutput": tc["expectedOutput"],
                "actualOutput": "Error",
                "passed": False,
                "error": err_msg
            } for tc in test_cases
        ]
    }))
    sys.exit(0)

fn = ns.get(fn_name)
if not callable(fn):
    err_msg = f'Function "{fn_name}" was not defined. Keep the required function signature.'
    print(json.dumps({
        "status": "Runtime Error",
        "stdout": stdout_buf.getvalue()[:2000],
        "stderr": err_msg,
        "results": [
            {
                "id": tc["id"],
                "input": tc["input"],
                "expectedOutput": tc["expectedOutput"],
                "actualOutput": "None",
                "passed": False,
                "error": err_msg
            } for tc in test_cases
        ]
    }))
    sys.exit(0)

results = []
had_error = False
first_err = ""
for tc in test_cases:
    try:
        args = json.loads(tc["input"])
        expected = json.loads(tc["expectedOutput"])
        if not isinstance(args, list):
            args = [args]
        with redirect_stdout(stdout_buf):
            actual = fn(*args)
        passed = (actual == expected) and (type(actual) is type(expected) or not isinstance(actual, bool) and not isinstance(expected, bool))
        results.append({
            "id": tc["id"],
            "input": tc["input"],
            "expectedOutput": tc["expectedOutput"],
            "actualOutput": json.dumps(actual),
            "passed": bool(passed)
        })
    except Exception as e:
        had_error = True
        err_msg = f"{type(e).__name__}: {e}"
        if not first_err:
            first_err = err_msg
        results.append({
            "id": tc["id"],
            "input": tc["input"],
            "expectedOutput": tc["expectedOutput"],
            "actualOutput": "Error",
            "passed": False,
            "error": err_msg
        })

passed_count = sum(1 for r in results if r["passed"])
status = "Passed" if passed_count == len(test_cases) and len(test_cases) > 0 else ("Runtime Error" if had_error and passed_count == 0 else "Failed")
print(json.dumps({
    "status": status,
    "stdout": stdout_buf.getvalue()[:2000],
    "stderr": first_err,
    "results": results
}))
`;

  return new Promise((resolve) => {
    const child = spawn('python3', ['-I', '-c', pyHarness], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill('SIGKILL');
      } catch {
        // ignore
      }
      const timeoutMsg = `Execution timed out after ${timeoutMs}ms (possible infinite loop)`;
      resolve({
        executionResults: {
          status: 'Timeout',
          stdout: stdout.slice(0, 1000),
          stderr: timeoutMsg,
          executionTimeMs: Date.now() - startAll,
          passedCount: 0,
          totalCount: testCases.length
        },
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: 'Timeout',
          passed: false,
          error: timeoutMsg
        }))
      });
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const errMsg = `Python runtime error: ${err.message}`;
      resolve({
        executionResults: {
          status: 'Runtime Error',
          stderr: errMsg,
          executionTimeMs: Date.now() - startAll,
          passedCount: 0,
          totalCount: testCases.length
        },
        testCaseResults: testCases.map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: 'Error',
          passed: false,
          error: errMsg
        }))
      });
    });

    child.on('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(stdout.trim());
        const results: CodingTestCaseResult[] = Array.isArray(parsed.results) ? parsed.results : [];
        const passedCount = results.filter((r) => r.passed).length;
        resolve({
          executionResults: {
            status: parsed.status || (passedCount === testCases.length ? 'Passed' : 'Failed'),
            stdout: parsed.stdout || '',
            stderr: parsed.stderr || stderr || undefined,
            executionTimeMs: Date.now() - startAll,
            passedCount,
            totalCount: testCases.length
          },
          testCaseResults: results
        });
      } catch {
        const errMsg = stderr.trim() || 'Could not execute Python submission';
        resolve({
          executionResults: {
            status: 'Runtime Error',
            stdout: stdout.slice(0, 1000),
            stderr: errMsg,
            executionTimeMs: Date.now() - startAll,
            passedCount: 0,
            totalCount: testCases.length
          },
          testCaseResults: testCases.map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: 'Error',
            passed: false,
            error: errMsg
          }))
        });
      }
    });

    try {
      child.stdin.write(payload);
      child.stdin.end();
    } catch {
      // ignore
    }
  });
}

export async function executeCodeWithTestCases(params: {
  code: string;
  language: CodingLanguage;
  functionName: string;
  testCases: CodingTestCase[];
  timeoutMs?: number;
}): Promise<{ executionResults: CodingExecutionResult; testCaseResults: CodingTestCaseResult[] }> {
  const { code, language, functionName, testCases, timeoutMs = 3500 } = params;
  const trimmed = (code || '').trim();

  if (!trimmed) {
    return {
      executionResults: {
        status: 'Failed',
        stderr: 'Empty submission — no code was written.',
        executionTimeMs: 0,
        passedCount: 0,
        totalCount: testCases.length
      },
      testCaseResults: testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: '(empty)',
        passed: false,
        error: 'No code written'
      }))
    };
  }

  if (language === 'python') {
    return runPythonTestCases(code, functionName, testCases, timeoutMs);
  }
  return runJavascriptTestCases(code, functionName, testCases, timeoutMs);
}
