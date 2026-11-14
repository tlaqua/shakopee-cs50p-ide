import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './styles.css';

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';

import {
  extractLocalPythonSymbols,
  registerPythonProviders,
  registerSabersThemes
} from './intellisense/monacoPythonProvider.js';
import { CS50P_SNIPPETS } from './intellisense/pythonCatalog.js';
import { CS50P_WEEKS } from './curriculum/cs50pData.js';
import { PythonClient } from './runtime/py-client.js';
import {
  getDefaultWorkspaceFiles,
  loadWorkspaceFiles,
  saveWorkspaceFiles
} from './storage/workspace-db.js';
import {
  exportWorkspaceZip,
  readUploadedFileList,
  saveSingleFileToComputer
} from './storage/file-transfer.js';
import { IdeTerminal, parseShellWords } from './ui/terminal.js';
import {
  clearPreviewResources,
  isPreviewOnlyFile,
  renderFilePreview
} from './ui/filePreview.js';
import { setupDocsModal } from './ui/docsModal.js';

// Self-hosted Monaco workers (zero CDN calls)
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker();
    return new editorWorker();
  }
};

// State
let files = {};
let openTabs = [];
let activeFile = null;
let theme = localStorage.getItem('sabers_theme') || 'dark';
let editor = null;
const models = new Map();
let currentDiagnostics = [];
let diagTimer = null;
let persistTimer = null;

// DOM refs
const el = {
  runtimeStatus: document.getElementById('runtimeStatus'),
  runtimeStatusText: document.getElementById('runtimeStatusText'),
  statusIsolation: document.getElementById('statusIsolation'),
  statusCwd: document.getElementById('statusCwd'),
  cliArgsInput: document.getElementById('cliArgsInput'),
  btnRun: document.getElementById('btnRun'),
  btnPytest: document.getElementById('btnPytest'),
  btnStop: document.getElementById('btnStop'),
  btnSaveFile: document.getElementById('btnSaveFile'),
  btnExportZip: document.getElementById('btnExportZip'),
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  btnDocs: document.getElementById('btnDocs'),
  btnNewFile: document.getElementById('btnNewFile'),
  btnNewFolder: document.getElementById('btnNewFolder'),
  btnUploadFiles: document.getElementById('btnUploadFiles'),
  fileUploadInput: document.getElementById('fileUploadInput'),
  btnRestoreSamples: document.getElementById('btnRestoreSamples'),
  fileTree: document.getElementById('fileTree'),
  curriculumList: document.getElementById('curriculumList'),
  symbolOutline: document.getElementById('symbolOutline'),
  snippetList: document.getElementById('snippetList'),
  editorTabs: document.getElementById('editorTabs'),
  monacoHost: document.getElementById('monacoHost'),
  previewHost: document.getElementById('previewHost'),
  cursorPos: document.getElementById('cursorPos'),
  diagSummary: document.getElementById('diagSummary'),
  problemBadge: document.getElementById('problemBadge'),
  outputBadge: document.getElementById('outputBadge'),
  problemsList: document.getElementById('problemsList'),
  outputsList: document.getElementById('outputsList'),
  btnSendEOF: document.getElementById('btnSendEOF'),
  btnClearTerm: document.getElementById('btnClearTerm'),
  sidebar: document.getElementById('sidebar'),
  sidebarResizer: document.getElementById('sidebarResizer'),
  terminalResizer: document.getElementById('terminalResizer'),
  bottomPanel: document.querySelector('.bottom-panel')
};

const pyClient = new PythonClient();

const terminal = new IdeTerminal({
  outputEl: document.getElementById('terminalOutput'),
  inputEl: document.getElementById('terminalInput'),
  inputRowEl: document.getElementById('terminalInputRow'),
  promptEl: document.getElementById('terminalPromptLabel'),
  onCommand: handleTerminalCommand
});

const docsModal = setupDocsModal({
  modalEl: document.getElementById('docsModal'),
  bodyEl: document.getElementById('docsBody'),
  searchInputEl: document.getElementById('docsSearchInput'),
  openBtn: el.btnDocs,
  closeBtn: document.getElementById('btnCloseDocs')
});

function scheduleWorkspaceSave() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveWorkspaceFiles(files);
  }, 250);
}

function applyTheme(nextTheme) {
  theme = nextTheme;
  localStorage.setItem('sabers_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  monaco.editor.setTheme(theme === 'light' ? 'sabers-light' : 'sabers-dark');
  el.btnThemeToggle.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
}

function getLanguageForPath(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'py') return 'python';
  if (ext === 'json') return 'json';
  return 'plaintext';
}

function getOrCreateModel(path) {
  if (models.has(path)) return models.get(path);
  const content = files[path]?.content || '';
  const model = monaco.editor.createModel(content, getLanguageForPath(path));
  model.onDidChangeContent(() => {
    if (files[path]) {
      files[path].content = model.getValue();
      scheduleWorkspaceSave();
      if (path === activeFile) {
        updateSymbolOutline();
        scheduleDiagnostics();
      }
    }
  });
  models.set(path, model);
  return model;
}

function openFile(path) {
  if (!files[path] || files[path].type === 'dir') return;
  activeFile = path;
  if (!openTabs.includes(path)) openTabs.push(path);

  if (isPreviewOnlyFile(path)) {
    el.monacoHost.classList.add('hidden');
    el.previewHost.classList.remove('hidden');
    renderFilePreview(el.previewHost, path, files[path]);
  } else {
    clearPreviewResources();
    el.previewHost.classList.add('hidden');
    el.monacoHost.classList.remove('hidden');
    const model = getOrCreateModel(path);
    editor.setModel(model);
    editor.focus();
    updateSymbolOutline();
    scheduleDiagnostics();
  }

  renderTabs();
  renderFileTree();
}

function closeTab(path) {
  openTabs = openTabs.filter((t) => t !== path);
  if (activeFile === path) {
    activeFile = openTabs[openTabs.length - 1] || null;
    if (activeFile) {
      openFile(activeFile);
    } else {
      el.previewHost.classList.add('hidden');
      el.monacoHost.classList.remove('hidden');
      editor.setModel(null);
      renderTabs();
      renderFileTree();
    }
  } else {
    renderTabs();
  }
}

function renderTabs() {
  el.editorTabs.innerHTML = '';
  for (const path of openTabs) {
    const tab = document.createElement('div');
    tab.className = `tab-item ${path === activeFile ? 'active' : ''}`;
    tab.title = path;

    const label = document.createElement('span');
    label.textContent = path.split('/').pop();

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close tab';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTab(path);
    };

    tab.onclick = () => openFile(path);
    tab.append(label, closeBtn);
    el.editorTabs.appendChild(tab);
  }
}

function getFileBadge(path, entry) {
  if (entry.type === 'dir') return { text: 'DIR', cls: 'dir' };
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (ext === 'py') return { text: 'PY', cls: 'py' };
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return { text: ext.toUpperCase(), cls: 'img' };
  if (ext === 'pdf') return { text: 'PDF', cls: 'pdf' };
  if (ext === 'csv') return { text: 'CSV', cls: '' };
  return { text: ext.toUpperCase() || 'FILE', cls: '' };
}

function renderFileTree() {
  el.fileTree.innerHTML = '';
  const sortedPaths = Object.keys(files).sort((a, b) => {
    const aDir = files[a].type === 'dir' ? 0 : 1;
    const bDir = files[b].type === 'dir' ? 0 : 1;
    if (aDir !== bDir && a.split('/').length === b.split('/').length) return aDir - bDir;
    return a.localeCompare(b);
  });

  for (const path of sortedPaths) {
    const entry = files[path];
    const depth = path.split('/').length - 1;
    const name = path.split('/').pop();
    const row = document.createElement('div');
    row.className = `tree-row ${path === activeFile ? 'active' : ''}`;
    row.style.paddingLeft = `${10 + depth * 14}px`;

    const left = document.createElement('div');
    left.className = 'tree-left';
    const badge = getFileBadge(path, entry);
    const tag = document.createElement('span');
    tag.className = `tree-tag ${badge.cls}`;
    tag.textContent = badge.text;

    const span = document.createElement('span');
    span.textContent = name;
    left.append(tag, span);

    const actions = document.createElement('div');
    actions.className = 'tree-actions';

    if (entry.type === 'file') {
      const dlBtn = document.createElement('button');
      dlBtn.className = 'tree-act-btn';
      dlBtn.textContent = '↓';
      dlBtn.title = 'Save to computer';
      dlBtn.onclick = (e) => {
        e.stopPropagation();
        saveSingleFileToComputer(path, entry);
      };
      actions.appendChild(dlBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'tree-act-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Delete';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete "${path}"?`)) return;
      for (const k of Object.keys(files)) {
        if (k === path || k.startsWith(`${path}/`)) {
          delete files[k];
          models.get(k)?.dispose();
          models.delete(k);
          openTabs = openTabs.filter((t) => t !== k);
        }
      }
      if (activeFile && !files[activeFile]) {
        activeFile = openTabs[0] || null;
        if (activeFile) openFile(activeFile);
        else editor.setModel(null);
      }
      await pyClient.removePath(path);
      scheduleWorkspaceSave();
      renderTabs();
      renderFileTree();
      renderOutputsList();
    };
    actions.appendChild(delBtn);

    row.onclick = () => {
      if (entry.type === 'dir') {
        terminal.setCwd(path);
        el.statusCwd.textContent = `cwd: /workspace/${path}`;
      } else {
        openFile(path);
      }
    };

    row.append(left, actions);
    el.fileTree.appendChild(row);
  }
}

function renderOutputsList() {
  const outputFiles = Object.entries(files).filter(([path, entry]) => {
    if (entry.type !== 'file') return false;
    const ext = path.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'pdf', 'csv'].includes(ext);
  });

  el.outputBadge.textContent = String(outputFiles.length);
  el.outputsList.innerHTML = '';

  if (outputFiles.length === 0) {
    el.outputsList.innerHTML = '<p style="color:#9ca3af">No images, PDFs, or CSV files yet. Run your Week 6/8 scripts or load CS50P sample assets.</p>';
    return;
  }

  for (const [path, entry] of outputFiles) {
    const item = document.createElement('div');
    item.className = 'output-item';
    const left = document.createElement('span');
    left.textContent = path;

    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = '6px';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-xs btn-secondary';
    viewBtn.textContent = 'Preview';
    viewBtn.onclick = () => openFile(path);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-xs btn-primary';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => saveSingleFileToComputer(path, entry);

    btns.append(viewBtn, saveBtn);
    item.append(left, btns);
    el.outputsList.appendChild(item);
  }
}

function renderCurriculumPanel() {
  el.curriculumList.innerHTML = '';
  CS50P_WEEKS.forEach((wk, idx) => {
    const card = document.createElement('div');
    card.className = `week-card ${idx === 0 ? 'open' : ''}`;

    const header = document.createElement('div');
    header.className = 'week-header';
    header.innerHTML = `<span>${wk.title}</span><span class="week-badge">${wk.week}</span>`;
    header.onclick = () => card.classList.toggle('open');

    const body = document.createElement('div');
    body.className = 'week-body';

    const desc = document.createElement('p');
    desc.style.margin = '0 0 8px';
    desc.textContent = wk.summary;
    body.appendChild(desc);

    for (const prob of wk.problems) {
      const row = document.createElement('div');
      row.className = 'pset-item';
      const name = document.createElement('span');
      name.className = 'pset-name';
      name.textContent = prob.label;

      const btn = document.createElement('button');
      btn.className = 'btn btn-xs btn-secondary';
      btn.textContent = files[prob.file] ? 'Open' : 'Create Starter';
      btn.onclick = () => {
        ensureFolderForFile(prob.file);
        if (!files[prob.file]) {
          files[prob.file] = { type: 'file', encoding: 'utf8', content: prob.starter };
          scheduleWorkspaceSave();
        }
        openFile(prob.file);
        renderCurriculumPanel();
      };

      row.append(name, btn);
      body.appendChild(row);
    }

    card.append(header, body);
    el.curriculumList.appendChild(card);
  });
}

function renderSnippetsPanel() {
  el.snippetList.innerHTML = '';
  for (const snip of CS50P_SNIPPETS) {
    const row = document.createElement('div');
    row.className = 'snippet-row';
    row.title = snip.detail;
    row.innerHTML = `<span>${snip.label}</span><span style="color:var(--text-muted);font-size:10.5px">${snip.detail}</span>`;
    row.onclick = () => {
      if (!editor || !activeFile || isPreviewOnlyFile(activeFile)) return;
      const cleanText = snip.insertText.replace(/\$\{\d+:?([^}]*)\}/g, '$1');
      const sel = editor.getSelection();
      editor.executeEdits('snippet', [{ range: sel, text: cleanText }]);
      editor.focus();
    };
    el.snippetList.appendChild(row);
  }
}

function updateSymbolOutline() {
  if (!activeFile || !files[activeFile] || getLanguageForPath(activeFile) !== 'python') {
    el.symbolOutline.innerHTML = '<div style="color:var(--text-muted);font-size:11px;padding:4px 8px">Open a .py file to view symbols</div>';
    return;
  }
  const sym = extractLocalPythonSymbols(files[activeFile].content || '');
  el.symbolOutline.innerHTML = '';

  for (const cls of sym.classes) {
    const row = document.createElement('div');
    row.className = 'symbol-row';
    row.innerHTML = `<span>class ${cls.name}</span><span style="color:var(--cyan)">L${cls.line}</span>`;
    row.onclick = () => {
      editor.revealLineInCenter(cls.line);
      editor.setPosition({ lineNumber: cls.line, column: 1 });
      editor.focus();
    };
    el.symbolOutline.appendChild(row);
  }

  for (const fn of sym.functions) {
    const row = document.createElement('div');
    row.className = 'symbol-row';
    row.innerHTML = `<span>def ${fn.name}()</span><span style="color:var(--saber-red)">L${fn.line}</span>`;
    row.onclick = () => {
      editor.revealLineInCenter(fn.line);
      editor.setPosition({ lineNumber: fn.line, column: 1 });
      editor.focus();
    };
    el.symbolOutline.appendChild(row);
  }
}

function scheduleDiagnostics() {
  clearTimeout(diagTimer);
  diagTimer = setTimeout(runDiagnostics, 320);
}

async function runDiagnostics() {
  if (!activeFile || !files[activeFile] || getLanguageForPath(activeFile) !== 'python') {
    currentDiagnostics = [];
    renderProblems();
    return;
  }
  const model = models.get(activeFile);
  if (!model) return;

  const code = model.getValue();
  const diags = await pyClient.analyze(code);
  currentDiagnostics = diags;

  const markers = diags.map((d) => ({
    severity:
      d.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : d.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
    startLineNumber: d.line,
    startColumn: d.col,
    endLineNumber: d.endLine || d.line,
    endColumn: d.endCol || d.col + 1,
    message: d.message
  }));

  monaco.editor.setModelMarkers(model, 'cs50p-python', markers);
  renderProblems();
}

function renderProblems() {
  const errCount = currentDiagnostics.filter((d) => d.severity === 'error').length;
  el.problemBadge.textContent = String(currentDiagnostics.length);
  el.diagSummary.textContent = `${errCount} error${errCount === 1 ? '' : 's'}, ${currentDiagnostics.length} total`;
  el.diagSummary.classList.toggle('has-errors', errCount > 0);

  el.problemsList.innerHTML = '';
  if (currentDiagnostics.length === 0) {
    el.problemsList.innerHTML = '<p style="color:#34d399">No syntax or undefined symbol issues detected.</p>';
    return;
  }

  for (const d of currentDiagnostics) {
    const row = document.createElement('div');
    row.className = 'problem-item';
    row.innerHTML = `<span><strong style="color:${d.severity === 'error' ? '#f87171' : '#fbbf24'}">[${d.severity.toUpperCase()}]</strong> ${d.message}</span><span style="color:#9ca3af">${activeFile}:${d.line}:${d.col}</span>`;
    row.onclick = () => {
      editor.revealLineInCenter(d.line);
      editor.setPosition({ lineNumber: d.line, column: d.col });
      editor.focus();
    };
    el.problemsList.appendChild(row);
  }
}

function ensureFolderForFile(filepath) {
  const parts = filepath.split('/').filter(Boolean);
  let cur = '';
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur ? `${cur}/${parts[i]}` : parts[i];
    if (!files[cur]) {
      files[cur] = { type: 'dir' };
    }
  }
}

function syncSnapshotBack(workspace) {
  if (!workspace) return;
  files = workspace;
  for (const [path, entry] of Object.entries(files)) {
    if (entry.type === 'file' && entry.encoding === 'utf8' && models.has(path)) {
      const m = models.get(path);
      if (m.getValue() !== entry.content) {
        m.setValue(entry.content || '');
      }
    }
  }
  if (activeFile && files[activeFile] && isPreviewOnlyFile(activeFile)) {
    renderFilePreview(el.previewHost, activeFile, files[activeFile]);
  }
  scheduleWorkspaceSave();
  renderFileTree();
  renderOutputsList();
}

function setRunningUi(running) {
  el.btnRun.disabled = running;
  el.btnPytest.disabled = running;
  el.btnStop.classList.toggle('hidden', !running);
}

function resolveRelPath(baseDir, inputPath) {
  const combined = inputPath.startsWith('/')
    ? inputPath.replace(/^\/workspace\/?/, '')
    : baseDir
      ? `${baseDir}/${inputPath}`
      : inputPath;

  const stack = [];
  for (const seg of combined.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') stack.pop();
    else stack.push(seg);
  }
  return stack.join('/');
}

async function executePythonFile(relPath, argvList, cwdRel) {
  if (!pyClient.ready) {
    terminal.appendLine('Python is still loading. Please wait a couple seconds...', 'term-line-sys');
    return;
  }
  if (pyClient.busy) {
    terminal.appendLine('A program is already running. Click Stop or press Ctrl+C first.', 'term-line-err');
    return;
  }

  switchBottomTab('terminal');
  setRunningUi(true);
  terminal.appendLine(`▶ python ${relPath}${argvList.length ? ' ' + argvList.join(' ') : ''}`, 'term-line-sys');

  try {
    const absScript = `/workspace/${relPath}`;
    const absCwd = cwdRel ? `/workspace/${cwdRel}` : '/workspace';
    const res = await pyClient.runScript(absScript, argvList, absCwd, files);
    if (!res.ok) {
      terminal.appendLine(res.error || 'Execution error', 'term-line-err');
    } else if (res.workspace) {
      syncSnapshotBack(res.workspace);
    }
  } catch (err) {
    terminal.appendLine(err.message, 'term-line-err');
  } finally {
    terminal.setStdinWaiting(false);
    setRunningUi(false);
  }
}

async function executePytest(argsList, cwdRel) {
  if (!pyClient.ready) {
    terminal.appendLine('Python is still loading. Please wait a couple seconds...', 'term-line-sys');
    return;
  }
  if (pyClient.busy) {
    terminal.appendLine('A program is already running. Click Stop or press Ctrl+C first.', 'term-line-err');
    return;
  }

  switchBottomTab('terminal');
  setRunningUi(true);
  terminal.appendLine(`▶ pytest${argsList.length ? ' ' + argsList.join(' ') : ''}`, 'term-line-sys');

  try {
    const absCwd = cwdRel ? `/workspace/${cwdRel}` : '/workspace';
    const res = await pyClient.runPytest(argsList, absCwd, files);
    if (!res.ok) {
      terminal.appendLine(res.error || 'pytest execution error', 'term-line-err');
    } else if (res.workspace) {
      syncSnapshotBack(res.workspace);
    }
  } catch (err) {
    terminal.appendLine(err.message, 'term-line-err');
  } finally {
    terminal.setStdinWaiting(false);
    setRunningUi(false);
  }
}

async function handleTerminalCommand(tokens) {
  const cmd = tokens[0];
  const args = tokens.slice(1);

  if (cmd === 'clear') {
    terminal.clear();
    return;
  }

  if (cmd === 'pwd') {
    terminal.appendLine(terminal.cwd ? `/workspace/${terminal.cwd}` : '/workspace');
    return;
  }

  if (cmd === 'help') {
    terminal.appendLine(
      [
        'CS50P Terminal Commands:',
        '  python <file.py> [args...]   Run a Python script with optional CLI args',
        '  pytest [file_or_args...]     Run unit tests with pytest',
        '  ls [dir]                     List files and directories',
        '  cd <dir>                     Change working directory (use .. or ~)',
        '  pwd                          Show current directory',
        '  cat <file>                   Print a text file',
        '  touch <file>                 Create an empty file',
        '  mkdir <dir>                  Create a folder',
        '  rm <file>                    Delete a file',
        '  pip list                     Show pre-installed offline packages',
        '  clear                        Clear terminal output'
      ].join('\n'),
      'term-line-sys'
    );
    return;
  }

  if (cmd === 'ls') {
    const targetDir = args[0] ? resolveRelPath(terminal.cwd, args[0]) : terminal.cwd;
    const prefix = targetDir ? `${targetDir}/` : '';
    const seen = new Set();

    for (const p of Object.keys(files).sort()) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      if (!rest) continue;
      const top = rest.split('/')[0];
      if (!seen.has(top)) {
        seen.add(top);
        const full = prefix + top;
        const isDir = files[full]?.type === 'dir' || rest.includes('/');
        terminal.appendLine(isDir ? `${top}/` : top);
      }
    }
    if (seen.size === 0) terminal.appendLine('(empty)', 'term-line-sys');
    return;
  }

  if (cmd === 'cd') {
    const target = args[0] || '';
    if (!target || target === '~' || target === '/') {
      terminal.setCwd('');
      el.statusCwd.textContent = 'cwd: /workspace';
      return;
    }
    const next = resolveRelPath(terminal.cwd, target);
    if (!next) {
      terminal.setCwd('');
      el.statusCwd.textContent = 'cwd: /workspace';
      return;
    }
    const exists =
      files[next]?.type === 'dir' ||
      Object.keys(files).some((k) => k.startsWith(`${next}/`));
    if (!exists) {
      terminal.appendLine(`cd: ${target}: No such directory`, 'term-line-err');
      return;
    }
    terminal.setCwd(next);
    el.statusCwd.textContent = `cwd: /workspace/${next}`;
    return;
  }

  if (cmd === 'cat') {
    if (!args[0]) {
      terminal.appendLine('Usage: cat <file>', 'term-line-err');
      return;
    }
    const target = resolveRelPath(terminal.cwd, args[0]);
    const entry = files[target];
    if (!entry || entry.type === 'dir') {
      terminal.appendLine(`cat: ${args[0]}: No such file`, 'term-line-err');
      return;
    }
    if (entry.encoding === 'binary') {
      terminal.appendLine(`[binary file: ${target}, ${entry.data?.length || 0} bytes]`, 'term-line-sys');
      return;
    }
    terminal.appendLine(entry.content || '');
    return;
  }

  if (cmd === 'touch') {
    if (!args[0]) return;
    const target = resolveRelPath(terminal.cwd, args[0]);
    ensureFolderForFile(target);
    if (!files[target]) {
      files[target] = { type: 'file', encoding: 'utf8', content: '' };
      scheduleWorkspaceSave();
      await pyClient.syncFiles(files);
      renderFileTree();
    }
    return;
  }

  if (cmd === 'mkdir') {
    if (!args[0]) return;
    const target = resolveRelPath(terminal.cwd, args[0]);
    files[target] = { type: 'dir' };
    scheduleWorkspaceSave();
    await pyClient.syncFiles(files);
    renderFileTree();
    return;
  }

  if (cmd === 'rm') {
    if (!args[0]) return;
    const target = resolveRelPath(terminal.cwd, args[0]);
    if (!files[target]) {
      terminal.appendLine(`rm: ${args[0]}: No such file`, 'term-line-err');
      return;
    }
    delete files[target];
    models.get(target)?.dispose();
    models.delete(target);
    openTabs = openTabs.filter((t) => t !== target);
    if (activeFile === target) {
      activeFile = openTabs[0] || null;
      if (activeFile) openFile(activeFile);
    }
    await pyClient.removePath(target);
    scheduleWorkspaceSave();
    renderTabs();
    renderFileTree();
    renderOutputsList();
    return;
  }

  if (cmd === 'pip') {
    if (args[0] === 'list') {
      terminal.appendLine('Pre-installed self-hosted packages:', 'term-line-ok');
      terminal.appendLine(pyClient.packages.join(', ') || '(loading...)', 'term-line-sys');
    } else {
      terminal.appendLine('All CS50P packages are pre-bundled offline! Run `pip list` to inspect.', 'term-line-sys');
    }
    return;
  }

  if (cmd === 'python' || cmd === 'python3') {
    if (!args[0]) {
      terminal.appendLine('Usage: python <script.py> [args...]', 'term-line-err');
      return;
    }
    const rel = resolveRelPath(terminal.cwd, args[0]);
    if (!files[rel] || files[rel].type === 'dir') {
      terminal.appendLine(`python: can't open file '${args[0]}': No such file`, 'term-line-err');
      return;
    }
    await executePythonFile(rel, args.slice(1), terminal.cwd);
    return;
  }

  if (cmd === 'pytest') {
    await executePytest(args, terminal.cwd);
    return;
  }

  terminal.appendLine(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'term-line-err');
}

function switchBottomTab(name) {
  document.querySelectorAll('.bottom-tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.bottom === name);
  });
  document.querySelectorAll('.bottom-pane').forEach((p) => {
    p.classList.toggle('active', p.id === `bottom-${name}`);
  });
}

function switchSidePanel(name) {
  document.querySelectorAll('.rail-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.panel === name);
  });
  document.querySelectorAll('.side-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${name}`);
  });
}

async function handleUploadFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  const imported = await readUploadedFileList(fileList);
  for (const [name, entry] of Object.entries(imported)) {
    const rel = terminal.cwd ? `${terminal.cwd}/${name}` : name;
    ensureFolderForFile(rel);
    files[rel] = entry;
  }
  scheduleWorkspaceSave();
  await pyClient.syncFiles(files);
  renderFileTree();
  renderOutputsList();
  const firstUploaded = Object.keys(imported)[0];
  if (firstUploaded) {
    openFile(terminal.cwd ? `${terminal.cwd}/${firstUploaded}` : firstUploaded);
  }
}

function runActiveScript() {
  if (!activeFile || !activeFile.endsWith('.py')) {
    terminal.appendLine('Open a .py file to run it, or use the terminal below.', 'term-line-sys');
    return;
  }
  const argText = el.cliArgsInput.value.trim();
  const argvList = argText ? parseShellWords(argText) : [];
  const fileDir = activeFile.includes('/') ? activeFile.split('/').slice(0, -1).join('/') : '';
  executePythonFile(activeFile, argvList, fileDir);
}

function runActivePytest() {
  if (activeFile && activeFile.split('/').pop().startsWith('test_') && activeFile.endsWith('.py')) {
    const fileDir = activeFile.includes('/') ? activeFile.split('/').slice(0, -1).join('/') : '';
    const baseName = activeFile.split('/').pop();
    executePytest(['-v', baseName], fileDir);
  } else {
    executePytest(['-v'], terminal.cwd);
  }
}

function setupResizers() {
  let draggingSidebar = false;
  let draggingTerm = false;

  el.sidebarResizer.addEventListener('mousedown', () => {
    draggingSidebar = true;
    document.body.style.cursor = 'col-resize';
  });

  el.terminalResizer.addEventListener('mousedown', () => {
    draggingTerm = true;
    document.body.style.cursor = 'row-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (draggingSidebar) {
      const nextWidth = Math.max(180, Math.min(480, e.clientX - 44));
      el.sidebar.style.width = `${nextWidth}px`;
      editor?.layout();
    } else if (draggingTerm) {
      const rect = document.querySelector('.main-area').getBoundingClientRect();
      const nextHeight = Math.max(110, Math.min(rect.height - 160, rect.bottom - e.clientY));
      el.bottomPanel.style.height = `${nextHeight}px`;
      editor?.layout();
    }
  });

  window.addEventListener('mouseup', () => {
    if (draggingSidebar || draggingTerm) {
      draggingSidebar = false;
      draggingTerm = false;
      document.body.style.cursor = '';
      editor?.layout();
    }
  });
}

async function init() {
  files = (await loadWorkspaceFiles()) || getDefaultWorkspaceFiles();

  registerSabersThemes(monaco);
  registerPythonProviders(monaco, {
    pyClient,
    getActiveWorkspacePath: () => (activeFile ? `/workspace/${activeFile}` : '/workspace/main.py'),
    getFilesSnapshot: () => files
  });

  editor = monaco.editor.create(el.monacoHost, {
    value: '',
    language: 'python',
    theme: theme === 'light' ? 'sabers-light' : 'sabers-dark',
    automaticLayout: true,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13.5,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    quickSuggestions: { other: true, comments: false, strings: true },
    parameterHints: { enabled: true },
    hover: { enabled: true, delay: 200 },
    bracketPairColorization: { enabled: true },
    tabSize: 4,
    insertSpaces: true
  });

  editor.onDidChangeCursorPosition((e) => {
    el.cursorPos.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
  });

  applyTheme(theme);
  el.statusIsolation.textContent = pyClient.canIsolate
    ? 'COOP/COEP Isolated (Full Stdin/EOF)'
    : 'Fallback Mode (No SharedArrayBuffer)';

  pyClient.onStatus = (state, text) => {
    el.runtimeStatus.className = `status-pill ${state}`;
    el.runtimeStatusText.textContent = text;
  };

  pyClient.onReady = (info) => {
    terminal.appendLine(
      `Shakopee CS50P Studio ready — Python ${info.pythonVersion} (${info.packages.length} offline libraries loaded).`,
      'term-line-ok'
    );
    terminal.appendLine('Type "help" for terminal commands, or click Run / pytest above.', 'term-line-sys');
    scheduleDiagnostics();
  };

  pyClient.onOutput = (stream, text) => {
    terminal.appendStream(stream, text);
  };

  pyClient.onStdinRequest = () => {
    terminal.setStdinWaiting(true);
  };

  terminal.onStdinLine = (line) => pyClient.provideStdinLine(line);
  terminal.onStdinEOF = () => pyClient.provideEOF();
  terminal.onInterrupt = () => {
    pyClient.interrupt();
    setRunningUi(false);
  };

  document.querySelectorAll('.rail-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchSidePanel(btn.dataset.panel));
  });

  document.querySelectorAll('.bottom-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchBottomTab(btn.dataset.bottom));
  });

  el.btnRun.addEventListener('click', runActiveScript);
  el.btnPytest.addEventListener('click', runActivePytest);
  el.btnStop.addEventListener('click', () => {
    pyClient.interrupt();
    terminal.setStdinWaiting(false);
    terminal.appendLine('^C (Interrupted)', 'term-line-err');
  });

  el.btnSendEOF.addEventListener('click', () => {
    if (terminal.waitingStdin) {
      terminal.appendLine('^D (EOF)', 'term-line-sys');
      terminal.setStdinWaiting(false);
      pyClient.provideEOF();
    } else {
      terminal.appendLine('Program is not currently waiting at input().', 'term-line-sys');
    }
  });

  el.btnClearTerm.addEventListener('click', () => terminal.clear());

  el.btnSaveFile.addEventListener('click', async () => {
    if (activeFile && files[activeFile]) {
      await saveSingleFileToComputer(activeFile, files[activeFile]);
    }
  });

  el.btnExportZip.addEventListener('click', () => exportWorkspaceZip(files));

  el.btnThemeToggle.addEventListener('click', () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  });

  el.btnNewFile.addEventListener('click', async () => {
    const raw = prompt('New file path (e.g. indoor.py or week2/coke.py):');
    if (!raw) return;
    const rel = resolveRelPath(terminal.cwd, raw.trim());
    if (!rel) return;
    ensureFolderForFile(rel);
    if (!files[rel]) {
      files[rel] = { type: 'file', encoding: 'utf8', content: '' };
    }
    scheduleWorkspaceSave();
    await pyClient.syncFiles(files);
    openFile(rel);
    renderCurriculumPanel();
  });

  el.btnNewFolder.addEventListener('click', async () => {
    const raw = prompt('New folder name:');
    if (!raw) return;
    const rel = resolveRelPath(terminal.cwd, raw.trim());
    if (!rel) return;
    files[rel] = { type: 'dir' };
    scheduleWorkspaceSave();
    await pyClient.syncFiles(files);
    renderFileTree();
  });

  el.btnUploadFiles.addEventListener('click', () => el.fileUploadInput.click());
  el.fileUploadInput.addEventListener('change', async (e) => {
    await handleUploadFiles(e.target.files);
    e.target.value = '';
  });

  el.fileTree.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.fileTree.classList.add('drag-over');
  });
  el.fileTree.addEventListener('dragleave', () => {
    el.fileTree.classList.remove('drag-over');
  });
  el.fileTree.addEventListener('drop', async (e) => {
    e.preventDefault();
    el.fileTree.classList.remove('drag-over');
    await handleUploadFiles(e.dataTransfer?.files);
  });

  el.btnRestoreSamples.addEventListener('click', async () => {
    if (!pyClient.ready) {
      terminal.appendLine('Wait for Python runtime to finish booting first.', 'term-line-sys');
      return;
    }
    const res = await pyClient.generateCS50PSamples();
    if (res?.ok && res.workspace) {
      syncSnapshotBack(res.workspace);
      terminal.appendLine(
        'Generated offline CS50P sample assets: week6_pizza/, week6_scourgify/, week6_shirt/, week8_shirtificate/.',
        'term-line-ok'
      );
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runActiveScript();
    } else if (e.key === 'F5') {
      e.preventDefault();
      runActiveScript();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (activeFile && files[activeFile]) {
        saveSingleFileToComputer(activeFile, files[activeFile]);
      }
    } else if (e.key === 'F1') {
      e.preventDefault();
      docsModal.open();
    } else if (e.key === 'Escape') {
      docsModal.close();
    }
  });

  setupResizers();
  renderCurriculumPanel();
  renderSnippetsPanel();
  renderFileTree();
  renderOutputsList();

  const firstFile = files['welcome.py']
    ? 'welcome.py'
    : Object.keys(files).find((k) => files[k].type === 'file');
  if (firstFile) openFile(firstFile);

  pyClient.init(files);
}

init();import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './styles.css';

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker';

import {
  extractLocalPythonSymbols,
  registerPythonProviders,
  registerSabersThemes
} from './intellisense/monacoPythonProvider.js';
import { CS50P_SNIPPETS } from './intellisense/pythonCatalog.js';
import { CS50P_WEEKS } from './curriculum/cs50pData.js';
import { PythonClient } from './runtime/py-client.js';
import {
  getDefaultWorkspaceFiles,
  loadWorkspaceFiles,
  saveWorkspaceFiles
} from './storage/workspace-db.js';
import {
  exportWorkspaceZip,
  readUploadedFileList,
  saveSingleFileToComputer
} from './storage/file-transfer.js';
import { IdeTerminal, parseShellWords } from './ui/terminal.js';
import {
  clearPreviewResources,
  isPreviewOnlyFile,
  renderFilePreview
} from './ui/filePreview.js';
import { setupDocsModal } from './ui/docsModal.js';

// Self-hosted Monaco workers (zero CDN calls)
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker();
    return new editorWorker();
  }
};

// State
let files = {};
let openTabs = [];
let activeFile = null;
let theme = localStorage.getItem('sabers_theme') || 'dark';
let editor = null;
const models = new Map();
let currentDiagnostics = [];
let diagTimer = null;
let persistTimer = null;

// DOM refs
const el = {
  runtimeStatus: document.getElementById('runtimeStatus'),
  runtimeStatusText: document.getElementById('runtimeStatusText'),
  statusIsolation: document.getElementById('statusIsolation'),
  statusCwd: document.getElementById('statusCwd'),
  cliArgsInput: document.getElementById('cliArgsInput'),
  btnRun: document.getElementById('btnRun'),
  btnPytest: document.getElementById('btnPytest'),
  btnStop: document.getElementById('btnStop'),
  btnSaveFile: document.getElementById('btnSaveFile'),
  btnExportZip: document.getElementById('btnExportZip'),
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  btnDocs: document.getElementById('btnDocs'),
  btnNewFile: document.getElementById('btnNewFile'),
  btnNewFolder: document.getElementById('btnNewFolder'),
  btnUploadFiles: document.getElementById('btnUploadFiles'),
  fileUploadInput: document.getElementById('fileUploadInput'),
  btnRestoreSamples: document.getElementById('btnRestoreSamples'),
  fileTree: document.getElementById('fileTree'),
  curriculumList: document.getElementById('curriculumList'),
  symbolOutline: document.getElementById('symbolOutline'),
  snippetList: document.getElementById('snippetList'),
  editorTabs: document.getElementById('editorTabs'),
  monacoHost: document.getElementById('monacoHost'),
  previewHost: document.getElementById('previewHost'),
  cursorPos: document.getElementById('cursorPos'),
  diagSummary: document.getElementById('diagSummary'),
  problemBadge: document.getElementById('problemBadge'),
  outputBadge: document.getElementById('outputBadge'),
  problemsList: document.getElementById('problemsList'),
  outputsList: document.getElementById('outputsList'),
  btnSendEOF: document.getElementById('btnSendEOF'),
  btnClearTerm: document.getElementById('btnClearTerm'),
  sidebar: document.getElementById('sidebar'),
  sidebarResizer: document.getElementById('sidebarResizer'),
  terminalResizer: document.getElementById('terminalResizer'),
  bottomPanel: document.querySelector('.bottom-panel')
};

const pyClient = new PythonClient();

const terminal = new IdeTerminal({
  outputEl: document.getElementById('terminalOutput'),
  inputEl: document.getElementById('terminalInput'),
  inputRowEl: document.getElementById('terminalInputRow'),
  promptEl: document.getElementById('terminalPromptLabel'),
  onCommand: handleTerminalCommand
});

const docsModal = setupDocsModal({
  modalEl: document.getElementById('docsModal'),
  bodyEl: document.getElementById('docsBody'),
  searchInputEl: document.getElementById('docsSearchInput'),
  openBtn: el.btnDocs,
  closeBtn: document.getElementById('btnCloseDocs')
});

function scheduleWorkspaceSave() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveWorkspaceFiles(files);
  }, 250);
}

function applyTheme(nextTheme) {
  theme = nextTheme;
  localStorage.setItem('sabers_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  monaco.editor.setTheme(theme === 'light' ? 'sabers-light' : 'sabers-dark');
  el.btnThemeToggle.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
}

function getLanguageForPath(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'py') return 'python';
  if (ext === 'json') return 'json';
  return 'plaintext';
}

function getOrCreateModel(path) {
  if (models.has(path)) return models.get(path);
  const content = files[path]?.content || '';
  const model = monaco.editor.createModel(content, getLanguageForPath(path));
  model.onDidChangeContent(() => {
    if (files[path]) {
      files[path].content = model.getValue();
      scheduleWorkspaceSave();
      if (path === activeFile) {
        updateSymbolOutline();
        scheduleDiagnostics();
      }
    }
  });
  models.set(path, model);
  return model;
}

function openFile(path) {
  if (!files[path] || files[path].type === 'dir') return;
  activeFile = path;
  if (!openTabs.includes(path)) openTabs.push(path);

  if (isPreviewOnlyFile(path)) {
    el.monacoHost.classList.add('hidden');
    el.previewHost.classList.remove('hidden');
    renderFilePreview(el.previewHost, path, files[path]);
  } else {
    clearPreviewResources();
    el.previewHost.classList.add('hidden');
    el.monacoHost.classList.remove('hidden');
    const model = getOrCreateModel(path);
    editor.setModel(model);
    editor.focus();
    updateSymbolOutline();
    scheduleDiagnostics();
  }

  renderTabs();
  renderFileTree();
}

function closeTab(path) {
  openTabs = openTabs.filter((t) => t !== path);
  if (activeFile === path) {
    activeFile = openTabs[openTabs.length - 1] || null;
    if (activeFile) {
      openFile(activeFile);
    } else {
      el.previewHost.classList.add('hidden');
      el.monacoHost.classList.remove('hidden');
      editor.setModel(null);
      renderTabs();
      renderFileTree();
    }
  } else {
    renderTabs();
  }
}

function renderTabs() {
  el.editorTabs.innerHTML = '';
  for (const path of openTabs) {
    const tab = document.createElement('div');
    tab.className = `tab-item ${path === activeFile ? 'active' : ''}`;
    tab.title = path;

    const label = document.createElement('span');
    label.textContent = path.split('/').pop();

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close tab';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTab(path);
    };

    tab.onclick = () => openFile(path);
    tab.append(label, closeBtn);
    el.editorTabs.appendChild(tab);
  }
}

function getFileBadge(path, entry) {
  if (entry.type === 'dir') return { text: 'DIR', cls: 'dir' };
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (ext === 'py') return { text: 'PY', cls: 'py' };
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return { text: ext.toUpperCase(), cls: 'img' };
  if (ext === 'pdf') return { text: 'PDF', cls: 'pdf' };
  if (ext === 'csv') return { text: 'CSV', cls: '' };
  return { text: ext.toUpperCase() || 'FILE', cls: '' };
}

function renderFileTree() {
  el.fileTree.innerHTML = '';
  const sortedPaths = Object.keys(files).sort((a, b) => {
    const aDir = files[a].type === 'dir' ? 0 : 1;
    const bDir = files[b].type === 'dir' ? 0 : 1;
    if (aDir !== bDir && a.split('/').length === b.split('/').length) return aDir - bDir;
    return a.localeCompare(b);
  });

  for (const path of sortedPaths) {
    const entry = files[path];
    const depth = path.split('/').length - 1;
    const name = path.split('/').pop();
    const row = document.createElement('div');
    row.className = `tree-row ${path === activeFile ? 'active' : ''}`;
    row.style.paddingLeft = `${10 + depth * 14}px`;

    const left = document.createElement('div');
    left.className = 'tree-left';
    const badge = getFileBadge(path, entry);
    const tag = document.createElement('span');
    tag.className = `tree-tag ${badge.cls}`;
    tag.textContent = badge.text;

    const span = document.createElement('span');
    span.textContent = name;
    left.append(tag, span);

    const actions = document.createElement('div');
    actions.className = 'tree-actions';

    if (entry.type === 'file') {
      const dlBtn = document.createElement('button');
      dlBtn.className = 'tree-act-btn';
      dlBtn.textContent = '↓';
      dlBtn.title = 'Save to computer';
      dlBtn.onclick = (e) => {
        e.stopPropagation();
        saveSingleFileToComputer(path, entry);
      };
      actions.appendChild(dlBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'tree-act-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Delete';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete "${path}"?`)) return;
      for (const k of Object.keys(files)) {
        if (k === path || k.startsWith(`${path}/`)) {
          delete files[k];
          models.get(k)?.dispose();
          models.delete(k);
          openTabs = openTabs.filter((t) => t !== k);
        }
      }
      if (activeFile && !files[activeFile]) {
        activeFile = openTabs[0] || null;
        if (activeFile) openFile(activeFile);
        else editor.setModel(null);
      }
      await pyClient.removePath(path);
      scheduleWorkspaceSave();
      renderTabs();
      renderFileTree();
      renderOutputsList();
    };
    actions.appendChild(delBtn);

    row.onclick = () => {
      if (entry.type === 'dir') {
        terminal.setCwd(path);
        el.statusCwd.textContent = `cwd: /workspace/${path}`;
      } else {
        openFile(path);
      }
    };

    row.append(left, actions);
    el.fileTree.appendChild(row);
  }
}

function renderOutputsList() {
  const outputFiles = Object.entries(files).filter(([path, entry]) => {
    if (entry.type !== 'file') return false;
    const ext = path.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'pdf', 'csv'].includes(ext);
  });

  el.outputBadge.textContent = String(outputFiles.length);
  el.outputsList.innerHTML = '';

  if (outputFiles.length === 0) {
    el.outputsList.innerHTML = '<p style="color:#9ca3af">No images, PDFs, or CSV files yet. Run your Week 6/8 scripts or load CS50P sample assets.</p>';
    return;
  }

  for (const [path, entry] of outputFiles) {
    const item = document.createElement('div');
    item.className = 'output-item';
    const left = document.createElement('span');
    left.textContent = path;

    const btns = document.createElement('div');
    btns.style.display = 'flex';
    btns.style.gap = '6px';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-xs btn-secondary';
    viewBtn.textContent = 'Preview';
    viewBtn.onclick = () => openFile(path);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-xs btn-primary';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => saveSingleFileToComputer(path, entry);

    btns.append(viewBtn, saveBtn);
    item.append(left, btns);
    el.outputsList.appendChild(item);
  }
}

function renderCurriculumPanel() {
  el.curriculumList.innerHTML = '';
  CS50P_WEEKS.forEach((wk, idx) => {
    const card = document.createElement('div');
    card.className = `week-card ${idx === 0 ? 'open' : ''}`;

    const header = document.createElement('div');
    header.className = 'week-header';
    header.innerHTML = `<span>${wk.title}</span><span class="week-badge">${wk.week}</span>`;
    header.onclick = () => card.classList.toggle('open');

    const body = document.createElement('div');
    body.className = 'week-body';

    const desc = document.createElement('p');
    desc.style.margin = '0 0 8px';
    desc.textContent = wk.summary;
    body.appendChild(desc);

    for (const prob of wk.problems) {
      const row = document.createElement('div');
      row.className = 'pset-item';
      const name = document.createElement('span');
      name.className = 'pset-name';
      name.textContent = prob.label;

      const btn = document.createElement('button');
      btn.className = 'btn btn-xs btn-secondary';
      btn.textContent = files[prob.file] ? 'Open' : 'Create Starter';
      btn.onclick = () => {
        ensureFolderForFile(prob.file);
        if (!files[prob.file]) {
          files[prob.file] = { type: 'file', encoding: 'utf8', content: prob.starter };
          scheduleWorkspaceSave();
        }
        openFile(prob.file);
        renderCurriculumPanel();
      };

      row.append(name, btn);
      body.appendChild(row);
    }

    card.append(header, body);
    el.curriculumList.appendChild(card);
  });
}

function renderSnippetsPanel() {
  el.snippetList.innerHTML = '';
  for (const snip of CS50P_SNIPPETS) {
    const row = document.createElement('div');
    row.className = 'snippet-row';
    row.title = snip.detail;
    row.innerHTML = `<span>${snip.label}</span><span style="color:var(--text-muted);font-size:10.5px">${snip.detail}</span>`;
    row.onclick = () => {
      if (!editor || !activeFile || isPreviewOnlyFile(activeFile)) return;
      const cleanText = snip.insertText.replace(/\$\{\d+:?([^}]*)\}/g, '$1');
      const sel = editor.getSelection();
      editor.executeEdits('snippet', [{ range: sel, text: cleanText }]);
      editor.focus();
    };
    el.snippetList.appendChild(row);
  }
}

function updateSymbolOutline() {
  if (!activeFile || !files[activeFile] || getLanguageForPath(activeFile) !== 'python') {
    el.symbolOutline.innerHTML = '<div style="color:var(--text-muted);font-size:11px;padding:4px 8px">Open a .py file to view symbols</div>';
    return;
  }
  const sym = extractLocalPythonSymbols(files[activeFile].content || '');
  el.symbolOutline.innerHTML = '';

  for (const cls of sym.classes) {
    const row = document.createElement('div');
    row.className = 'symbol-row';
    row.innerHTML = `<span>class ${cls.name}</span><span style="color:var(--cyan)">L${cls.line}</span>`;
    row.onclick = () => {
      editor.revealLineInCenter(cls.line);
      editor.setPosition({ lineNumber: cls.line, column: 1 });
      editor.focus();
    };
    el.symbolOutline.appendChild(row);
  }

  for (const fn of sym.functions) {
    const row = document.createElement('div');
    row.className = 'symbol-row';
    row.innerHTML = `<span>def ${fn.name}()</span><span style="color:var(--saber-red)">L${fn.line}</span>`;
    row.onclick = () => {
      editor.revealLineInCenter(fn.line);
      editor.setPosition({ lineNumber: fn.line, column: 1 });
      editor.focus();
    };
    el.symbolOutline.appendChild(row);
  }
}

function scheduleDiagnostics() {
  clearTimeout(diagTimer);
  diagTimer = setTimeout(runDiagnostics, 320);
}

async function runDiagnostics() {
  if (!activeFile || !files[activeFile] || getLanguageForPath(activeFile) !== 'python') {
    currentDiagnostics = [];
    renderProblems();
    return;
  }
  const model = models.get(activeFile);
  if (!model) return;

  const code = model.getValue();
  const diags = await pyClient.analyze(code);
  currentDiagnostics = diags;

  const markers = diags.map((d) => ({
    severity:
      d.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : d.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
    startLineNumber: d.line,
    startColumn: d.col,
    endLineNumber: d.endLine || d.line,
    endColumn: d.endCol || d.col + 1,
    message: d.message
  }));

  monaco.editor.setModelMarkers(model, 'cs50p-python', markers);
  renderProblems();
}

function renderProblems() {
  const errCount = currentDiagnostics.filter((d) => d.severity === 'error').length;
  el.problemBadge.textContent = String(currentDiagnostics.length);
  el.diagSummary.textContent = `${errCount} error${errCount === 1 ? '' : 's'}, ${currentDiagnostics.length} total`;
  el.diagSummary.classList.toggle('has-errors', errCount > 0);

  el.problemsList.innerHTML = '';
  if (currentDiagnostics.length === 0) {
    el.problemsList.innerHTML = '<p style="color:#34d399">No syntax or undefined symbol issues detected.</p>';
    return;
  }

  for (const d of currentDiagnostics) {
    const row = document.createElement('div');
    row.className = 'problem-item';
    row.innerHTML = `<span><strong style="color:${d.severity === 'error' ? '#f87171' : '#fbbf24'}">[${d.severity.toUpperCase()}]</strong> ${d.message}</span><span style="color:#9ca3af">${activeFile}:${d.line}:${d.col}</span>`;
    row.onclick = () => {
      editor.revealLineInCenter(d.line);
      editor.setPosition({ lineNumber: d.line, column: d.col });
      editor.focus();
    };
    el.problemsList.appendChild(row);
  }
}

function ensureFolderForFile(filepath) {
  const parts = filepath.split('/').filter(Boolean);
  let cur = '';
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur ? `${cur}/${parts[i]}` : parts[i];
    if (!files[cur]) {
      files[cur] = { type: 'dir' };
    }
  }
}

function syncSnapshotBack(workspace) {
  if (!workspace) return;
  files = workspace;
  for (const [path, entry] of Object.entries(files)) {
    if (entry.type === 'file' && entry.encoding === 'utf8' && models.has(path)) {
      const m = models.get(path);
      if (m.getValue() !== entry.content) {
        m.setValue(entry.content || '');
      }
    }
  }
  if (activeFile && files[activeFile] && isPreviewOnlyFile(activeFile)) {
    renderFilePreview(el.previewHost, activeFile, files[activeFile]);
  }
  scheduleWorkspaceSave();
  renderFileTree();
  renderOutputsList();
}

function setRunningUi(running) {
  el.btnRun.disabled = running;
  el.btnPytest.disabled = running;
  el.btnStop.classList.toggle('hidden', !running);
}

function resolveRelPath(baseDir, inputPath) {
  const combined = inputPath.startsWith('/')
    ? inputPath.replace(/^\/workspace\/?/, '')
    : baseDir
      ? `${baseDir}/${inputPath}`
      : inputPath;

  const stack = [];
  for (const seg of combined.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') stack.pop();
    else stack.push(seg);
  }
  return stack.join('/');
}

async function executePythonFile(relPath, argvList, cwdRel) {
  if (!pyClient.ready) {
    terminal.appendLine('Python is still loading. Please wait a couple seconds...', 'term-line-sys');
    return;
  }
  if (pyClient.busy) {
    terminal.appendLine('A program is already running. Click Stop or press Ctrl+C first.', 'term-line-err');
    return;
  }

  switchBottomTab('terminal');
  setRunningUi(true);
  terminal.appendLine(`▶ python ${relPath}${argvList.length ? ' ' + argvList.join(' ') : ''}`, 'term-line-sys');

  try {
    const absScript = `/workspace/${relPath}`;
    const absCwd = cwdRel ? `/workspace/${cwdRel}` : '/workspace';
    const res = await pyClient.runScript(absScript, argvList, absCwd, files);
    if (!res.ok) {
      terminal.appendLine(res.error || 'Execution error', 'term-line-err');
    } else if (res.workspace) {
      syncSnapshotBack(res.workspace);
    }
  } catch (err) {
    terminal.appendLine(err.message, 'term-line-err');
  } finally {
    terminal.setStdinWaiting(false);
    setRunningUi(false);
  }
}

async function executePytest(argsList, cwdRel) {
  if (!pyClient.ready) {
    terminal.appendLine('Python is still loading. Please wait a couple seconds...', 'term-line-sys');
    return;
  }
  if (pyClient.busy) {
    terminal.appendLine('A program is already running. Click Stop or press Ctrl+C first.', 'term-line-err');
    return;
  }

  switchBottomTab('terminal');
  setRunningUi(true);
  terminal.appendLine(`▶ pytest${argsList.length ? ' ' + argsList.join(' ') : ''}`, 'term-line-sys');

  try {
    const absCwd = cwdRel ? `/workspace/${cwdRel}` : '/workspace';
    const res = await pyClient.runPytest(argsList, absCwd, files);
    if (!res.ok) {
      terminal.appendLine(res.error || 'pytest execution error', 'term-line-err');
    } else if (res.workspace) {
      syncSnapshotBack(res.workspace);
    }
  } catch (err) {
    terminal.appendLine(err.message, 'term-line-err');
  } finally {
    terminal.setStdinWaiting(false);
    setRunningUi(false);
  }
}

async function handleTerminalCommand(tokens) {
  const cmd = tokens[0];
  const args = tokens.slice(1);

  if (cmd === 'clear') {
    terminal.clear();
    return;
  }

  if (cmd === 'pwd') {
    terminal.appendLine(terminal.cwd ? `/workspace/${terminal.cwd}` : '/workspace');
    return;
  }

  if (cmd === 'help') {
    terminal.appendLine(
      [
        'CS50P Terminal Commands:',
        '  python <file.py> [args...]   Run a Python script with optional CLI args',
        '  pytest [file_or_args...]     Run unit tests with pytest',
        '  ls [dir]                     List files and directories',
        '  cd <dir>                     Change working directory (use .. or ~)',
        '  pwd                          Show current directory',
        '  cat <file>                   Print a text file',
        '  touch <file>                 Create an empty file',
        '  mkdir <dir>                  Create a folder',
        '  rm <file>                    Delete a file',
        '  pip list                     Show pre-installed offline packages',
        '  clear                        Clear terminal output'
      ].join('\n'),
      'term-line-sys'
    );
    return;
  }

  if (cmd === 'ls') {
    const targetDir = args[0] ? resolveRelPath(terminal.cwd, args[0]) : terminal.cwd;
    const prefix = targetDir ? `${targetDir}/` : '';
    const seen = new Set();

    for (const p of Object.keys(files).sort()) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      if (!rest) continue;
      const top = rest.split('/')[0];
      if (!seen.has(top)) {
        seen.add(top);
        const full = prefix + top;
        const isDir = files[full]?.type === 'dir' || rest.includes('/');
        terminal.appendLine(isDir ? `${top}/` : top);
      }
    }
    if (seen.size === 0) terminal.appendLine('(empty)', 'term-line-sys');
    return;
  }

  if (cmd === 'cd') {
    const target = args[0] || '';
    if (!target || target === '~' || target === '/') {
      terminal.setCwd('');
      el.statusCwd.textContent = 'cwd: /workspace';
      return;
    }
    const next = resolveRelPath(terminal.cwd, target);
    if (!next) {
      terminal.setCwd('');
      el.statusCwd.textContent = 'cwd: /workspace';
      return;
    }
    const exists =
      files[next]?.type === 'dir' ||
      Object.keys(files).some((k) => k.startsWith(`${next}/`));
    if (!exists) {
      terminal.appendLine(`cd: ${target}: No such directory`, 'term-line-err');
      return;
    }
    terminal.setCwd(next);
    el.statusCwd.textContent = `cwd: /workspace/${next}`;
    return;
  }

  if (cmd === 'cat') {
    if (!args[0]) {
      terminal.appendLine('Usage: cat <file>', 'term-line-err');
      return;
    }
    const target = resolveRelPath(terminal.cwd, args[0]);
    const entry = files[target];
    if (!entry || entry.type === 'dir') {
      terminal.appendLine(`cat: ${args[0]}: No such file`, 'term-line-err');
      return;
    }
    if (entry.encoding === 'binary') {
      terminal.appendLine(`[binary file: ${target}, ${entry.data?.length || 0} bytes]`, 'term-line-sys');
      return;
    }
    terminal.appendLine(entry.content || '');
    return;
  }

  if (cmd === 'touch') {
    if (!args[0]) return;
    const target = resolveRelPath(terminal.cwd, args[0]);
    ensureFolderForFile(target);
    if (!files[target]) {
      files[target] = { type: 'file', encoding: 'utf8', content: '' };
      scheduleWorkspaceSave();
      await pyClient.syncFiles(files);
      renderFileTree();
    }
    return;
  }

  if (cmd === 'mkdir') {
    if (!args[0]) return;
    const target = resolveRelPath(terminal.cwd, args[0]);
    files[target] = { type: 'dir' };
    scheduleWorkspaceSave();
    await pyClient.syncFiles(files);
    renderFileTree();
    return;
  }

  if (cmd === 'rm') {
    if (!args[0]) return;
    const target = resolveRelPath(terminal.cwd, args[0]);
    if (!files[target]) {
      terminal.appendLine(`rm: ${args[0]}: No such file`, 'term-line-err');
      return;
    }
    delete files[target];
    models.get(target)?.dispose();
    models.delete(target);
    openTabs = openTabs.filter((t) => t !== target);
    if (activeFile === target) {
      activeFile = openTabs[0] || null;
      if (activeFile) openFile(activeFile);
    }
    await pyClient.removePath(target);
    scheduleWorkspaceSave();
    renderTabs();
    renderFileTree();
    renderOutputsList();
    return;
  }

  if (cmd === 'pip') {
    if (args[0] === 'list') {
      terminal.appendLine('Pre-installed self-hosted packages:', 'term-line-ok');
      terminal.appendLine(pyClient.packages.join(', ') || '(loading...)', 'term-line-sys');
    } else {
      terminal.appendLine('All CS50P packages are pre-bundled offline! Run `pip list` to inspect.', 'term-line-sys');
    }
    return;
  }

  if (cmd === 'python' || cmd === 'python3') {
    if (!args[0]) {
      terminal.appendLine('Usage: python <script.py> [args...]', 'term-line-err');
      return;
    }
    const rel = resolveRelPath(terminal.cwd, args[0]);
    if (!files[rel] || files[rel].type === 'dir') {
      terminal.appendLine(`python: can't open file '${args[0]}': No such file`, 'term-line-err');
      return;
    }
    await executePythonFile(rel, args.slice(1), terminal.cwd);
    return;
  }

  if (cmd === 'pytest') {
    await executePytest(args, terminal.cwd);
    return;
  }

  terminal.appendLine(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'term-line-err');
}

function switchBottomTab(name) {
  document.querySelectorAll('.bottom-tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.bottom === name);
  });
  document.querySelectorAll('.bottom-pane').forEach((p) => {
    p.classList.toggle('active', p.id === `bottom-${name}`);
  });
}

function switchSidePanel(name) {
  document.querySelectorAll('.rail-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.panel === name);
  });
  document.querySelectorAll('.side-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${name}`);
  });
}

async function handleUploadFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  const imported = await readUploadedFileList(fileList);
  for (const [name, entry] of Object.entries(imported)) {
    const rel = terminal.cwd ? `${terminal.cwd}/${name}` : name;
    ensureFolderForFile(rel);
    files[rel] = entry;
  }
  scheduleWorkspaceSave();
  await pyClient.syncFiles(files);
  renderFileTree();
  renderOutputsList();
  const firstUploaded = Object.keys(imported)[0];
  if (firstUploaded) {
    openFile(terminal.cwd ? `${terminal.cwd}/${firstUploaded}` : firstUploaded);
  }
}

function runActiveScript() {
  if (!activeFile || !activeFile.endsWith('.py')) {
    terminal.appendLine('Open a .py file to run it, or use the terminal below.', 'term-line-sys');
    return;
  }
  const argText = el.cliArgsInput.value.trim();
  const argvList = argText ? parseShellWords(argText) : [];
  const fileDir = activeFile.includes('/') ? activeFile.split('/').slice(0, -1).join('/') : '';
  executePythonFile(activeFile, argvList, fileDir);
}

function runActivePytest() {
  if (activeFile && activeFile.split('/').pop().startsWith('test_') && activeFile.endsWith('.py')) {
    const fileDir = activeFile.includes('/') ? activeFile.split('/').slice(0, -1).join('/') : '';
    const baseName = activeFile.split('/').pop();
    executePytest(['-v', baseName], fileDir);
  } else {
    executePytest(['-v'], terminal.cwd);
  }
}

function setupResizers() {
  let draggingSidebar = false;
  let draggingTerm = false;

  el.sidebarResizer.addEventListener('mousedown', () => {
    draggingSidebar = true;
    document.body.style.cursor = 'col-resize';
  });

  el.terminalResizer.addEventListener('mousedown', () => {
    draggingTerm = true;
    document.body.style.cursor = 'row-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (draggingSidebar) {
      const nextWidth = Math.max(180, Math.min(480, e.clientX - 44));
      el.sidebar.style.width = `${nextWidth}px`;
      editor?.layout();
    } else if (draggingTerm) {
      const rect = document.querySelector('.main-area').getBoundingClientRect();
      const nextHeight = Math.max(110, Math.min(rect.height - 160, rect.bottom - e.clientY));
      el.bottomPanel.style.height = `${nextHeight}px`;
      editor?.layout();
    }
  });

  window.addEventListener('mouseup', () => {
    if (draggingSidebar || draggingTerm) {
      draggingSidebar = false;
      draggingTerm = false;
      document.body.style.cursor = '';
      editor?.layout();
    }
  });
}

async function init() {
  files = (await loadWorkspaceFiles()) || getDefaultWorkspaceFiles();

  registerSabersThemes(monaco);
  registerPythonProviders(monaco, {
    pyClient,
    getActiveWorkspacePath: () => (activeFile ? `/workspace/${activeFile}` : '/workspace/main.py'),
    getFilesSnapshot: () => files
  });

  editor = monaco.editor.create(el.monacoHost, {
    value: '',
    language: 'python',
    theme: theme === 'light' ? 'sabers-light' : 'sabers-dark',
    automaticLayout: true,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13.5,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    quickSuggestions: { other: true, comments: false, strings: true },
    parameterHints: { enabled: true },
    hover: { enabled: true, delay: 200 },
    bracketPairColorization: { enabled: true },
    tabSize: 4,
    insertSpaces: true
  });

  editor.onDidChangeCursorPosition((e) => {
    el.cursorPos.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
  });

  applyTheme(theme);
  el.statusIsolation.textContent = pyClient.canIsolate
    ? 'COOP/COEP Isolated (Full Stdin/EOF)'
    : 'Fallback Mode (No SharedArrayBuffer)';

  pyClient.onStatus = (state, text) => {
    el.runtimeStatus.className = `status-pill ${state}`;
    el.runtimeStatusText.textContent = text;
  };

  pyClient.onReady = (info) => {
    terminal.appendLine(
      `Shakopee CS50P Studio ready — Python ${info.pythonVersion} (${info.packages.length} offline libraries loaded).`,
      'term-line-ok'
    );
    terminal.appendLine('Type "help" for terminal commands, or click Run / pytest above.', 'term-line-sys');
    scheduleDiagnostics();
  };

  pyClient.onOutput = (stream, text) => {
    terminal.appendStream(stream, text);
  };

  pyClient.onStdinRequest = () => {
    terminal.setStdinWaiting(true);
  };

  terminal.onStdinLine = (line) => pyClient.provideStdinLine(line);
  terminal.onStdinEOF = () => pyClient.provideEOF();
  terminal.onInterrupt = () => {
    pyClient.interrupt();
    setRunningUi(false);
  };

  document.querySelectorAll('.rail-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchSidePanel(btn.dataset.panel));
  });

  document.querySelectorAll('.bottom-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchBottomTab(btn.dataset.bottom));
  });

  el.btnRun.addEventListener('click', runActiveScript);
  el.btnPytest.addEventListener('click', runActivePytest);
  el.btnStop.addEventListener('click', () => {
    pyClient.interrupt();
    terminal.setStdinWaiting(false);
    terminal.appendLine('^C (Interrupted)', 'term-line-err');
  });

  el.btnSendEOF.addEventListener('click', () => {
    if (terminal.waitingStdin) {
      terminal.appendLine('^D (EOF)', 'term-line-sys');
      terminal.setStdinWaiting(false);
      pyClient.provideEOF();
    } else {
      terminal.appendLine('Program is not currently waiting at input().', 'term-line-sys');
    }
  });

  el.btnClearTerm.addEventListener('click', () => terminal.clear());

  el.btnSaveFile.addEventListener('click', async () => {
    if (activeFile && files[activeFile]) {
      await saveSingleFileToComputer(activeFile, files[activeFile]);
    }
  });

  el.btnExportZip.addEventListener('click', () => exportWorkspaceZip(files));

  el.btnThemeToggle.addEventListener('click', () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  });

  el.btnNewFile.addEventListener('click', async () => {
    const raw = prompt('New file path (e.g. indoor.py or week2/coke.py):');
    if (!raw) return;
    const rel = resolveRelPath(terminal.cwd, raw.trim());
    if (!rel) return;
    ensureFolderForFile(rel);
    if (!files[rel]) {
      files[rel] = { type: 'file', encoding: 'utf8', content: '' };
    }
    scheduleWorkspaceSave();
    await pyClient.syncFiles(files);
    openFile(rel);
    renderCurriculumPanel();
  });

  el.btnNewFolder.addEventListener('click', async () => {
    const raw = prompt('New folder name:');
    if (!raw) return;
    const rel = resolveRelPath(terminal.cwd, raw.trim());
    if (!rel) return;
    files[rel] = { type: 'dir' };
    scheduleWorkspaceSave();
    await pyClient.syncFiles(files);
    renderFileTree();
  });

  el.btnUploadFiles.addEventListener('click', () => el.fileUploadInput.click());
  el.fileUploadInput.addEventListener('change', async (e) => {
    await handleUploadFiles(e.target.files);
    e.target.value = '';
  });

  el.fileTree.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.fileTree.classList.add('drag-over');
  });
  el.fileTree.addEventListener('dragleave', () => {
    el.fileTree.classList.remove('drag-over');
  });
  el.fileTree.addEventListener('drop', async (e) => {
    e.preventDefault();
    el.fileTree.classList.remove('drag-over');
    await handleUploadFiles(e.dataTransfer?.files);
  });

  el.btnRestoreSamples.addEventListener('click', async () => {
    if (!pyClient.ready) {
      terminal.appendLine('Wait for Python runtime to finish booting first.', 'term-line-sys');
      return;
    }
    const res = await pyClient.generateCS50PSamples();
    if (res?.ok && res.workspace) {
      syncSnapshotBack(res.workspace);
      terminal.appendLine(
        'Generated offline CS50P sample assets: week6_pizza/, week6_scourgify/, week6_shirt/, week8_shirtificate/.',
        'term-line-ok'
      );
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runActiveScript();
    } else if (e.key === 'F5') {
      e.preventDefault();
      runActiveScript();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (activeFile && files[activeFile]) {
        saveSingleFileToComputer(activeFile, files[activeFile]);
      }
    } else if (e.key === 'F1') {
      e.preventDefault();
      docsModal.open();
    } else if (e.key === 'Escape') {
      docsModal.close();
    }
  });

  setupResizers();
  renderCurriculumPanel();
  renderSnippetsPanel();
  renderFileTree();
  renderOutputsList();

  const firstFile = files['welcome.py']
    ? 'welcome.py'
    : Object.keys(files).find((k) => files[k].type === 'file');
  if (firstFile) openFile(firstFile);

  pyClient.init(files);
}

init();
