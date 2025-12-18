// Simple JavaScript playground that runs user code and compares
// its output against built-in sorting implementations.

(function () {
  function parseArray(raw, statusEl) {
    if (!raw.trim()) {
      return [];
    }
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    const numbers = [];
    for (const part of parts) {
      const value = Number(part);
      if (Number.isNaN(value)) {
        if (statusEl) {
          statusEl.textContent = `Unable to convert "${part}" to a number.`;
          statusEl.classList.add('visible', 'error');
        }
        return null;
      }
      numbers.push(value);
    }
    return numbers;
  }

  function runUserCode(code, input, statusEl) {
    const logs = [];
    const fakeConsole = {
      log: function () {
        const msg = Array.from(arguments)
          .map(function (x) {
            try {
              return JSON.stringify(x);
            } catch (e) {
              return String(x);
            }
          })
          .join(' ');
        logs.push(msg);
      },
    };

    try {
      /* eslint-disable no-new-func */
      const wrapped = new Function(
        'input',
        'console',
        code + '\nreturn typeof solve === "function" ? solve(input, console) : null;'
      );
      const result = wrapped(input, fakeConsole);
      if (statusEl) {
        statusEl.textContent = 'Execution completed.';
        statusEl.classList.add('visible');
        statusEl.classList.remove('error');
      }
      return { result: result, logs: logs, error: null };
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.classList.add('visible', 'error');
      }
      return { result: null, logs: logs, error: err };
    }
  }

  function formatOutput(execution) {
    var lines = [];
    if (execution.error) {
      lines.push('❌ Error: ' + execution.error.message);
    }
    lines.push('Return value: ' + JSON.stringify(execution.result, null, 2));
    if (execution.logs.length) {
      lines.push('');
      lines.push('Console output:');
      execution.logs.forEach(function (line) {
        lines.push('  ' + line);
      });
    }
    return lines.join('\n');
  }

  function getReferenceSorter(key) {
    if (!key) return null;
    if (window.SORT_IMPLEMENTATIONS && window.SORT_IMPLEMENTATIONS[key]) {
      return window.SORT_IMPLEMENTATIONS[key];
    }
    if (window.sortAlgorithms && window.sortAlgorithms[key]) {
      return function (arr) {
        return window.sortAlgorithms[key].run(arr).sorted;
      };
    }
    return null;
  }

  function compareResults(userResult, refResult) {
    try {
      var a = JSON.stringify(userResult);
      var b = JSON.stringify(refResult);
      return a === b;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var langSelect = document.getElementById('playground-language');
    var inputEl = document.getElementById('playground-input-array');
    var codeEl = document.getElementById('playground-code');
    var refSelect = document.getElementById('playground-reference');
    var statusEl = document.getElementById('playground-status');
    var outputEl = document.getElementById('playground-output');
    var compareSummaryEl = document.getElementById(
      'playground-comparison-summary'
    );
    var runBtn = document.getElementById('run-code-btn');
    var compareBtn = document.getElementById('compare-code-btn');

    if (
      !langSelect ||
      !inputEl ||
      !codeEl ||
      !refSelect ||
      !statusEl ||
      !outputEl ||
      !compareSummaryEl ||
      !runBtn ||
      !compareBtn
    ) {
      return;
    }

    runBtn.addEventListener('click', function () {
      if (langSelect.value !== 'js') {
        statusEl.textContent =
          'Only JavaScript is executable in this playground.';
        statusEl.classList.add('visible', 'error');
        return;
      }
      statusEl.classList.remove('visible', 'error');
      var arr = parseArray(inputEl.value || '', statusEl);
      if (arr === null) {
        return;
      }
      var execution = runUserCode(codeEl.value || '', arr, statusEl);
      outputEl.textContent = formatOutput(execution);
    });

    compareBtn.addEventListener('click', function () {
      if (langSelect.value !== 'js') {
        statusEl.textContent =
          'Only JavaScript is executable in this playground.';
        statusEl.classList.add('visible', 'error');
        return;
      }
      statusEl.classList.remove('visible', 'error');
      var refKey = refSelect.value;
      if (!refKey) {
        compareSummaryEl.textContent =
          'No reference algorithm selected. Choose one from the dropdown.';
        return;
      }
      var arr = parseArray(inputEl.value || '', statusEl);
      if (arr === null) {
        return;
      }
      var execution = runUserCode(codeEl.value || '', arr, statusEl);
      outputEl.textContent = formatOutput(execution);

      var sorter = getReferenceSorter(refKey);
      if (!sorter) {
        compareSummaryEl.textContent =
          'Reference implementation not available on this page.';
        return;
      }
      var refOut = sorter(arr.slice());
      var ok = compareResults(execution.result, refOut);
      if (ok) {
        compareSummaryEl.textContent =
          '✅ Outputs match the reference algorithm for this input.';
      } else {
        compareSummaryEl.textContent =
          '⚠️ Outputs differ. Your result: ' +
          JSON.stringify(execution.result) +
          ', reference: ' +
          JSON.stringify(refOut);
      }
    });
  });
})();



