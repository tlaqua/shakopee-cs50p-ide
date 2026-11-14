export class PythonClient {
  constructor() {
    this.worker = new Worker(new URL('./py-worker.js', import.meta.url), { type: 'module' });
    this.ready = false;
    this.busy = false;
    this.packages = [];
    this.pythonVersion = '3.13';
    this.reqId = 1;
    this.pending = new Map();

    this.canIsolate = typeof SharedArrayBuffer !== 'undefined';
    this.stdinCtrlBuffer = this.canIsolate ? new SharedArrayBuffer(16) : null;
    this.stdinDataBuffer = this.canIsolate ? new SharedArrayBuffer(65536) : null;
    this.interruptBuffer = this.canIsolate ? new SharedArrayBuffer(4) : null;

    this.stdinCtrl = this.stdinCtrlBuffer ? new Int32Array(this.stdinCtrlBuffer) : null;
    this.stdinData = this.stdinDataBuffer ? new Uint8Array(this.stdinDataBuffer) : null;
    this.interruptView = this.interruptBuffer ? new Uint8Array(this.interruptBuffer) : null;

    this.onOutput = () => {};
    this.onStdinRequest = () => {};
    this.onStatus = () => {};
    this.onReady = () => {};

    this.worker.onmessage = (e) => this._handleMessage(e.data);
  }

  init(initialFiles) {
    this.worker.postMessage({
      type: 'init',
      files: initialFiles,
      stdinCtrlBuffer: this.stdinCtrlBuffer,
      stdinDataBuffer: this.stdinDataBuffer,
      interruptBuffer: this.interruptBuffer
    });
  }

  _handleMessage(msg) {
    if (msg.type === 'status') {
      this.onStatus(msg.state, msg.text);
      return;
    }
    if (msg.type === 'ready') {
      this.ready = true;
      this.packages = msg.packages || [];
      this.pythonVersion = msg.pythonVersion || '3.13';
      this.onStatus('ready', `Python ${this.pythonVersion} Ready`);
      this.onReady(msg);
      return;
    }
    if (msg.type === 'output') {
      this.onOutput(msg.stream, msg.text);
      return;
    }
    if (msg.type === 'stdin-request') {
      this.onStdinRequest();
      return;
    }
    if (msg.type === 'response') {
      const waiter = this.pending.get(msg.id);
      if (waiter) {
        this.pending.delete(msg.id);
        waiter.resolve(msg);
      }
    }
  }

  _call(payload, timeoutMs = 0) {
    return new Promise((resolve, reject) => {
      const id = this.reqId++;
      let timer = null;
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          if (this.pending.has(id)) {
            this.pending.delete(id);
            reject(new Error('Request timed out'));
          }
        }, timeoutMs);
      }
      this.pending.set(id, {
        resolve: (data) => {
          if (timer) clearTimeout(timer);
          resolve(data);
        }
      });
      this.worker.postMessage({ id, ...payload });
    });
  }

  provideStdinLine(text) {
    if (!this.stdinCtrl || !this.stdinData) return;
    const encoded = new TextEncoder().encode(text);
    const len = Math.min(encoded.length, this.stdinData.length);
    this.stdinData.set(encoded.subarray(0, len), 0);
    Atomics.store(this.stdinCtrl, 1, len);
    Atomics.store(this.stdinCtrl, 0, 1);
    Atomics.notify(this.stdinCtrl, 0, 1);
  }

  provideEOF() {
    if (!this.stdinCtrl) return;
    Atomics.store(this.stdinCtrl, 0, 2);
    Atomics.notify(this.stdinCtrl, 0, 1);
  }

  interrupt() {
    if (this.interruptView) {
      this.interruptView[0] = 2; // SIGINT for Pyodide
    }
    if (this.stdinCtrl && Atomics.load(this.stdinCtrl, 0) === 0) {
      Atomics.store(this.stdinCtrl, 0, 3);
      Atomics.notify(this.stdinCtrl, 0, 1);
    }
  }

  async syncFiles(files) {
    if (!this.ready || this.busy) return;
    return this._call({ type: 'sync-files', files }, 3000);
  }

  async removePath(path) {
    if (!this.ready || this.busy) return;
    return this._call({ type: 'rm-path', path }, 3000);
  }

  async generateCS50PSamples() {
    if (!this.ready || this.busy) return null;
    this.busy = true;
    try {
      return await this._call({ type: 'generate-samples' });
    } finally {
      this.busy = false;
    }
  }

  async runScript(scriptPath, argv, cwd, files) {
    if (!this.ready) throw new Error('Python is still booting. Please wait a moment.');
    if (this.busy) throw new Error('A Python program is already running.');
    this.busy = true;
    try {
      return await this._call({ type: 'run-script', scriptPath, argv, cwd, files });
    } finally {
      this.busy = false;
    }
  }

  async runPytest(args, cwd, files) {
    if (!this.ready) throw new Error('Python is still booting. Please wait a moment.');
    if (this.busy) throw new Error('A Python program is already running.');
    this.busy = true;
    try {
      return await this._call({ type: 'run-pytest', args, cwd, files });
    } finally {
      this.busy = false;
    }
  }

  async analyze(code) {
    if (!this.ready || this.busy) return [];
    try {
      const res = await this._call({ type: 'analyze', code }, 800);
      return res.ok ? res.diagnostics : [];
    } catch {
      return [];
    }
  }

  async jedi(action, code, line, col, filepath, files) {
    if (!this.ready || this.busy) return [];
    try {
      const res = await this._call({ type: 'jedi', action, code, line, col, filepath, files }, 400);
      return res.ok ? res.items : [];
    } catch {
      return [];
    }
  }
}
