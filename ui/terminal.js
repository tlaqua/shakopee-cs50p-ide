function parseShellWords(line) {
  const tokens = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (ch === '\\' && i + 1 < line.length) {
        cur += line[++i];
      } else {
        cur += ch;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (cur.length > 0) {
        tokens.push(cur);
        cur = '';
      }
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) tokens.push(cur);
  return tokens;
}

const ANSI_COLORS = {
  '30': '#374151',
  '31': '#F87171',
  '32': '#34D399',
  '33': '#FBBF24',
  '34': '#60A5FA',
  '35': '#C084FC',
  '36': '#38BDF8',
  '37': '#E5E7EB',
  '90': '#9CA3AF',
  '91': '#FCA5A5',
  '92': '#6EE7B7',
  '93': '#FDE68A'
};

function appendAnsiText(parentEl, text, defaultColor = null) {
  // Strip OSC/cursor sequences other than SGR color codes (\x1b[...m)
  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  let color = defaultColor;
  let bold = false;

  for (const part of parts) {
    if (!part) continue;
    const match = part.match(/^\x1b\[([0-9;]*)m$/);
    if (match) {
      const codes = match[1] ? match[1].split(';') : ['0'];
      for (const c of codes) {
        if (c === '0' || c === '39') {
          color = defaultColor;
          bold = false;
        } else if (c === '1') {
          bold = true;
        } else if (c === '22') {
          bold = false;
        } else if (ANSI_COLORS[c]) {
          color = ANSI_COLORS[c];
        }
      }
      continue;
    }

    const clean = part.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
    if (!clean) continue;
    const span = document.createElement('span');
    span.textContent = clean;
    if (color) span.style.color = color;
    if (bold) span.style.fontWeight = '700';
    parentEl.appendChild(span);
  }
}

export class IdeTerminal {
  constructor({ outputEl, inputEl, inputRowEl, promptEl, onCommand }) {
    this.outputEl = outputEl;
    this.inputEl = inputEl;
    this.inputRowEl = inputRowEl;
    this.promptEl = promptEl;
    this.onCommand = onCommand;

    this.history = [];
    this.historyIdx = -1;
    this.cwd = ''; // relative to /workspace ('' means /workspace)
    this.waitingStdin = false;
    this.onStdinLine = null;
    this.onStdinEOF = null;
    this.onInterrupt = null;

    this._bindEvents();
    this.updatePrompt();
  }

  _bindEvents() {
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = this.inputEl.value;
        this.inputEl.value = '';

        if (this.waitingStdin) {
          this.appendStream('stdout', `${val}\n`);
          this.setStdinWaiting(false);
          this.onStdinLine?.(val);
        } else {
          const trimmed = val.trim();
          this.appendLine(`${this.formatPrompt()} ${val}`, 'term-line-cmd');
          if (trimmed) {
            this.history.push(trimmed);
            this.historyIdx = this.history.length;
            this.onCommand(parseShellWords(trimmed), trimmed);
          }
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (this.waitingStdin) {
          this.appendLine('^D (EOF)', 'term-line-sys');
          this.setStdinWaiting(false);
          this.onStdinEOF?.();
        }
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.appendLine('^C', 'term-line-err');
        this.setStdinWaiting(false);
        this.onInterrupt?.();
        return;
      }

      if (!this.waitingStdin && e.key === 'ArrowUp') {
        if (this.history.length > 0 && this.historyIdx > 0) {
          e.preventDefault();
          this.historyIdx--;
          this.inputEl.value = this.history[this.historyIdx];
        }
      } else if (!this.waitingStdin && e.key === 'ArrowDown') {
        if (this.historyIdx < this.history.length - 1) {
          e.preventDefault();
          this.historyIdx++;
          this.inputEl.value = this.history[this.historyIdx];
        } else {
          this.historyIdx = this.history.length;
          this.inputEl.value = '';
        }
      }
    });
  }

  formatPrompt() {
    return this.cwd ? `~/${this.cwd} $` : '~/workspace $';
  }

  setCwd(relPath) {
    this.cwd = relPath.replace(/^\/+|\/+$/g, '');
    this.updatePrompt();
  }

  updatePrompt() {
    if (this.waitingStdin) {
      this.promptEl.textContent = 'stdin >';
      this.inputEl.placeholder = 'Enter input for program (or click Send EOF / Ctrl+D)...';
    } else {
      this.promptEl.textContent = this.formatPrompt();
      this.inputEl.placeholder = 'Type command (python file.py, pytest, ls, cat, cd, help)...';
    }
  }

  setStdinWaiting(waiting) {
    this.waitingStdin = waiting;
    this.inputRowEl.classList.toggle('waiting-stdin', waiting);
    this.updatePrompt();
    if (waiting) {
      this.inputEl.focus();
    }
  }

  appendStream(stream, text) {
    const color = stream === 'stderr' ? '#F87171' : null;
    appendAnsiText(this.outputEl, text, color);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  appendLine(text, className = '') {
    const div = document.createElement('div');
    if (className) div.className = className;
    div.textContent = text;
    this.outputEl.appendChild(div);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  clear() {
    this.outputEl.innerHTML = '';
  }

  focus() {
    this.inputEl.focus();
  }
}

export { parseShellWords };
