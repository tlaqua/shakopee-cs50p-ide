let pyodide = null;
let stdinCtrl = null;
let stdinData = null;
let interruptView = null;

function emit(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

function writeOut(stream, text) {
  emit('output', { stream, text });
}

function readLineSync() {
  if (!stdinCtrl || !stdinData) {
    return null;
  }
  Atomics.store(stdinCtrl, 0, 0);
  emit('stdin-request');
  Atomics.wait(stdinCtrl, 0, 0);

  const status = Atomics.load(stdinCtrl, 0);
  if (status === 2) {
    return null; // EOF (Ctrl+D) -> raises EOFError in Python input()
  }
  if (status === 3) {
    return '__IDE_INTERRUPT__';
  }
  const len = Atomics.load(stdinCtrl, 1);
  const copy = new Uint8Array(len);
  copy.set(stdinData.subarray(0, len));
  return new TextDecoder().decode(copy);
}

function syncFetchBridge(url, method, headersJson) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${self.location.origin}/api/cs50-fetch`, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(
      JSON.stringify({
        url,
        method,
        headers: headersJson ? JSON.parse(headersJson) : {}
      })
    );
    return xhr.responseText;
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: err?.message || 'Network bridge request failed'
    });
  }
}

globalThis.__ideBridge = {
  writeOut,
  readLineSync,
  syncFetchBridge
};

const BOOTSTRAP_PYTHON = `
import ast
import builtins
import importlib
import io
import json
import linecache
import os
import sys
import traceback
from pathlib import Path
from js import __ideBridge

WORKSPACE_ROOT = "/workspace"
os.makedirs(WORKSPACE_ROOT, exist_ok=True)
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

class _IdeStream(io.TextIOBase):
    def __init__(self, stream_name):
        self._name = stream_name
    @property
    def encoding(self):
        return "utf-8"
    def writable(self):
        return True
    def isatty(self):
        return True
    def write(self, s):
        if s:
            __ideBridge.writeOut(self._name, str(s))
        return len(s)
    def flush(self):
        pass

class _IdeStdin(io.TextIOBase):
    def __init__(self):
        self._buf = ""
    @property
    def encoding(self):
        return "utf-8"
    def readable(self):
        return True
    def isatty(self):
        return True
    def readline(self, size=-1):
        if not self._buf:
            line = __ideBridge.readLineSync()
            if line == "__IDE_INTERRUPT__":
                raise KeyboardInterrupt()
            if line is None:
                return ""
            self._buf = str(line) + "\\n"
        if size is not None and size >= 0:
            chunk = self._buf[:size]
            self._buf = self._buf[size:]
            return chunk
        chunk = self._buf
        self._buf = ""
        return chunk

# Install CS50P same-origin requests bridge for locked-down school labs
def _install_requests_bridge():
    try:
        import requests
        from requests.adapters import BaseAdapter
        from requests.structures import CaseInsensitiveDict

        class _LabBridgeAdapter(BaseAdapter):
            def send(self, request, stream=False, timeout=None, verify=True, cert=None, proxies=None):
                raw = __ideBridge.syncFetchBridge(
                    request.url,
                    request.method or "GET",
                    json.dumps(dict(request.headers or {}))
                )
                data = json.loads(raw)
                if not data.get("ok"):
                    raise requests.exceptions.ConnectionError(
                        data.get("error", f"Failed to fetch {request.url}"),
                        request=request
                    )
                resp = requests.Response()
                resp.status_code = int(data.get("status", 200))
                resp.headers = CaseInsensitiveDict(data.get("headers") or {})
                body_text = data.get("body", "")
                resp._content = body_text.encode("utf-8") if isinstance(body_text, str) else bytes(body_text)
                resp.encoding = "utf-8"
                resp.url = request.url
                resp.request = request
                return resp

            def close(self):
                pass

        _orig_session_init = requests.Session.__init__
        def _patched_session_init(self, *args, **kwargs):
            _orig_session_init(self, *args, **kwargs)
            adapter = _LabBridgeAdapter()
            self.mount("https://", adapter)
            self.mount("http://", adapter)

        if not getattr(requests.Session.__init__, "_ide_patched", False):
            _patched_session_init._ide_patched = True
            requests.Session.__init__ = _patched_session_init
    except Exception:
        pass

_install_requests_bridge()

def _clear_workspace_modules():
    to_delete = []
    for name, mod in list(sys.modules.items()):
        mod_file = getattr(mod, "__file__", None)
        if mod_file and str(mod_file).startswith(WORKSPACE_ROOT):
            to_delete.append(name)
    for name in to_delete:
        del sys.modules[name]
    linecache.clearcache()
    importlib.invalidate_caches()

def _format_clean_traceback(exc):
    tb_list = traceback.extract_tb(exc.__traceback__)
    filtered = [frame for frame in tb_list if not frame.filename.startswith("<exec>")]
    if not filtered:
        filtered = tb_list[-2:] if len(tb_list) >= 2 else tb_list
    lines = ["Traceback (most recent call last):\\n"]
    lines.extend(traceback.format_list(filtered))
    lines.extend(traceback.format_exception_only(type(exc), exc))
    return "".join(lines)

def ide_run_script(script_path, argv_list, cwd):
    _clear_workspace_modules()
    target = os.path.abspath(script_path)
    work_dir = os.path.abspath(cwd or os.path.dirname(target))
    if not os.path.isdir(work_dir):
        work_dir = WORKSPACE_ROOT

    orig_cwd = os.getcwd()
    orig_argv = list(sys.argv)
    orig_out, orig_err, orig_in = sys.stdout, sys.stderr, sys.stdin
    orig_path = list(sys.path)

    os.chdir(work_dir)
    if work_dir not in sys.path:
        sys.path.insert(0, work_dir)
    if WORKSPACE_ROOT not in sys.path:
        sys.path.insert(0, WORKSPACE_ROOT)

    sys.argv = [os.path.basename(target)] + list(argv_list)
    sys.stdout = _IdeStream("stdout")
    sys.stderr = _IdeStream("stderr")
    sys.stdin = _IdeStdin()

    exit_code = 0
    try:
        with open(target, "r", encoding="utf-8") as f:
            source = f.read()
        code_obj = compile(source, target, "exec")
        globs = {
            "__name__": "__main__",
            "__file__": target,
            "__package__": None
        }
        exec(code_obj, globs)
    except SystemExit as se:
        code = se.code
        if code is None:
            exit_code = 0
        elif isinstance(code, int):
            exit_code = code
        else:
            sys.stderr.write(str(code) + "\\n")
            exit_code = 1
    except KeyboardInterrupt:
        sys.stderr.write("\\nKeyboardInterrupt\\n")
        exit_code = 130
    except BaseException as exc:
        sys.stderr.write(_format_clean_traceback(exc))
        exit_code = 1
    finally:
        sys.stdout = orig_out
        sys.stderr = orig_err
        sys.stdin = orig_in
        sys.argv = orig_argv
        sys.path = orig_path
        os.chdir(orig_cwd)
    return exit_code

def ide_run_pytest(args_list, cwd):
    _clear_workspace_modules()
    work_dir = os.path.abspath(cwd or WORKSPACE_ROOT)
    orig_cwd = os.getcwd()
    orig_out, orig_err, orig_in = sys.stdout, sys.stderr, sys.stdin
    orig_path = list(sys.path)

    os.chdir(work_dir)
    if work_dir not in sys.path:
        sys.path.insert(0, work_dir)
    if WORKSPACE_ROOT not in sys.path:
        sys.path.insert(0, WORKSPACE_ROOT)

    sys.stdout = _IdeStream("stdout")
    sys.stderr = _IdeStream("stderr")
    sys.stdin = _IdeStdin()

    try:
        import pytest
        os.environ["PY_COLORS"] = "1"
        args = ["--color=yes", "-p", "no:cacheprovider"] + list(args_list)
        code = int(pytest.main(args))
        return code
    except KeyboardInterrupt:
        sys.stderr.write("\\nKeyboardInterrupt\\n")
        return 130
    except BaseException as exc:
        sys.stderr.write(_format_clean_traceback(exc))
        return 1
    finally:
        sys.stdout = orig_out
        sys.stderr = orig_err
        sys.stdin = orig_in
        sys.path = orig_path
        os.chdir(orig_cwd)

def ide_analyze_code(source):
    markers = []
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        markers.append({
            "severity": "error",
            "line": e.lineno or 1,
            "col": e.offset or 1,
            "endLine": getattr(e, "end_lineno", None) or (e.lineno or 1),
            "endCol": getattr(e, "end_offset", None) or ((e.offset or 1) + 1),
            "message": f"{type(e).__name__}: {e.msg}"
        })
        return json.dumps(markers)

    builtin_names = set(dir(builtins)) | {"__name__", "__file__", "__doc__", "__package__"}
    imported = {}
    used = set()

    class _Visitor(ast.NodeVisitor):
        def __init__(self):
            self.scopes = [set(builtin_names)]
        def push(self, names=()):
            self.scopes.append(set(names))
        def pop(self):
            self.scopes.pop()
        def is_defined(self, name):
            return any(name in s for s in self.scopes)
        def bind_target(self, target):
            if isinstance(target, ast.Name):
                self.scopes[-1].add(target.id)
            elif isinstance(target, (ast.Tuple, ast.List, ast.Starred)):
                elts = target.elts if hasattr(target, "elts") else [target.value]
                for elt in elts:
                    self.bind_target(elt)
        def visit_Import(self, node):
            for alias in node.names:
                bound = alias.asname or alias.name.split(".")[0]
                self.scopes[-1].add(bound)
                imported[bound] = (node.lineno, node.col_offset + 1, bound)
        def visit_ImportFrom(self, node):
            for alias in node.names:
                if alias.name == "*":
                    continue
                bound = alias.asname or alias.name
                self.scopes[-1].add(bound)
                imported[bound] = (node.lineno, node.col_offset + 1, bound)
        def visit_FunctionDef(self, node):
            self.scopes[-1].add(node.name)
            arg_names = [a.arg for a in node.args.posonlyargs + node.args.args + node.args.kwonlyargs]
            if node.args.vararg: arg_names.append(node.args.vararg.arg)
            if node.args.kwarg: arg_names.append(node.args.kwarg.arg)
            for d in node.args.defaults + [x for x in node.args.kw_defaults if x is not None]:
                self.visit(d)
            for dec in node.decorator_list:
                self.visit(dec)
            if node.returns:
                self.visit(node.returns)
            self.push(arg_names)
            for stmt in node.body:
                self.visit(stmt)
            self.pop()
        visit_AsyncFunctionDef = visit_FunctionDef
        def visit_ClassDef(self, node):
            self.scopes[-1].add(node.name)
            for b in node.bases: self.visit(b)
            for kw in node.keywords: self.visit(kw.value)
            for dec in node.decorator_list: self.visit(dec)
            self.push()
            for stmt in node.body:
                self.visit(stmt)
            self.pop()
        def visit_Lambda(self, node):
            arg_names = [a.arg for a in node.args.posonlyargs + node.args.args + node.args.kwonlyargs]
            if node.args.vararg: arg_names.append(node.args.vararg.arg)
            if node.args.kwarg: arg_names.append(node.args.kwarg.arg)
            self.push(arg_names)
            self.visit(node.body)
            self.pop()
        def _visit_comp(self, generators, elts):
            self.push()
            for gen in generators:
                self.visit(gen.iter)
                self.bind_target(gen.target)
                for cond in gen.ifs:
                    self.visit(cond)
            for e in elts:
                self.visit(e)
            self.pop()
        def visit_ListComp(self, node): self._visit_comp(node.generators, [node.elt])
        def visit_SetComp(self, node): self._visit_comp(node.generators, [node.elt])
        def visit_GeneratorExp(self, node): self._visit_comp(node.generators, [node.elt])
        def visit_DictComp(self, node): self._visit_comp(node.generators, [node.key, node.value])
        def visit_ExceptHandler(self, node):
            if node.type: self.visit(node.type)
            if node.name: self.scopes[-1].add(node.name)
            for stmt in node.body: self.visit(stmt)
        def visit_MatchAs(self, node):
            if node.pattern: self.visit(node.pattern)
            if node.name: self.scopes[-1].add(node.name)
        def visit_MatchStar(self, node):
            if node.name: self.scopes[-1].add(node.name)
        def visit_MatchMapping(self, node):
            for k in node.keys: self.visit(k)
            for p in node.patterns: self.visit(p)
            if node.rest: self.scopes[-1].add(node.rest)
        def visit_Global(self, node):
            for n in node.names: self.scopes[-1].add(n)
        def visit_Nonlocal(self, node):
            for n in node.names: self.scopes[-1].add(n)
        def visit_Name(self, node):
            if isinstance(node.ctx, (ast.Store, ast.Del)):
                self.scopes[-1].add(node.id)
            elif isinstance(node.ctx, ast.Load):
                used.add(node.id)
                if not self.is_defined(node.id):
                    markers.append({
                        "severity": "warning",
                        "line": node.lineno,
                        "col": node.col_offset + 1,
                        "endLine": getattr(node, "end_lineno", node.lineno),
                        "endCol": (getattr(node, "end_offset", node.col_offset + len(node.id))) + 1,
                        "message": f"'{node.id}' may be undefined"
                    })

    v = _Visitor()
    for stmt in tree.body:
        if isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            v.scopes[0].add(stmt.name)
        elif isinstance(stmt, ast.Assign):
            for t in stmt.targets: v.bind_target(t)
        elif isinstance(stmt, ast.AnnAssign) and stmt.target:
            v.bind_target(stmt.target)
    v.visit(tree)

    for name, (line, col, bound) in imported.items():
        if name not in used:
            markers.append({
                "severity": "info",
                "line": line,
                "col": col,
                "endLine": line,
                "endCol": col + len(bound),
                "message": f"Imported '{bound}' is not used yet"
            })
    return json.dumps(markers)

def ide_jedi_query(action, code, line, col, filepath):
    try:
        import jedi
        project = jedi.Project(WORKSPACE_ROOT)
        script = jedi.Script(code, path=filepath, project=project)
        if action == "complete":
            items = script.complete(line, col)[:40]
            out = []
            for c in items:
                doc = ""
                try:
                    doc = c.docstring(raw=False)[:400]
                except Exception:
                    pass
                out.append({
                    "name": c.name,
                    "type": c.type,
                    "description": c.description,
                    "docstring": doc
                })
            return json.dumps(out)
        elif action == "hover":
            helps = script.help(line, col)
            if not helps:
                return json.dumps([])
            out = []
            for h in helps[:3]:
                sigs = []
                try:
                    sigs = [s.to_string() for s in h.get_signatures()]
                except Exception:
                    pass
                doc = ""
                try:
                    doc = h.docstring(raw=False)[:1000]
                except Exception:
                    pass
                out.append({
                    "name": h.full_name or h.name,
                    "type": h.type,
                    "signatures": sigs,
                    "docstring": doc
                })
            return json.dumps(out)
        elif action == "signature":
            sigs = script.get_signatures(line, col)
            out = []
            for s in sigs[:3]:
                params = []
                for p in s.params:
                    params.append({
                        "name": p.name,
                        "description": p.description
                    })
                doc = ""
                try:
                    doc = s.docstring(raw=False)[:500]
                except Exception:
                    pass
                out.append({
                    "label": s.to_string(),
                    "index": s.index or 0,
                    "params": params,
                    "docstring": doc
                })
            return json.dumps(out)
    except Exception:
        return json.dumps([])
    return json.dumps([])

def ide_generate_cs50p_samples():
    from PIL import Image, ImageDraw, ImageFont
    try:
        font_lg = ImageFont.load_default(size=42)
        font_sm = ImageFont.load_default(size=28)
    except TypeError:
        font_lg = ImageFont.load_default()
        font_sm = font_lg

    # 1. Week 6 Pizza & Scourgify CSVs
    pizza_dir = os.path.join(WORKSPACE_ROOT, "week6_pizza")
    os.makedirs(pizza_dir, exist_ok=True)
    with open(os.path.join(pizza_dir, "sicilian.csv"), "w", encoding="utf-8") as f:
        f.write("Sicilian Pizza,Small,Large\\nCheese,$25.50,$39.95\\n1 item,$27.50,$41.95\\n2 items,$29.50,$43.95\\n3 items,$31.50,$45.95\\nSpecial,$33.50,$47.95\\n")
    with open(os.path.join(pizza_dir, "regular.csv"), "w", encoding="utf-8") as f:
        f.write("Regular Pizza,Small,Large\\nCheese,$13.50,$18.95\\n1 topping,$14.75,$20.95\\n2 toppings,$15.95,$22.95\\n3 toppings,$16.95,$24.95\\nSpecial,$18.50,$26.95\\n")

    scourgify_dir = os.path.join(WORKSPACE_ROOT, "week6_scourgify")
    os.makedirs(scourgify_dir, exist_ok=True)
    with open(os.path.join(scourgify_dir, "before.csv"), "w", encoding="utf-8") as f:
        f.write('name,house\\n"Abbott, Hannah",Hufflepuff\\n"Bell, Katie",Gryffindor\\n"Bones, Susan",Hufflepuff\\n"Boot, Terry",Ravenclaw\\n"Brown, Lavender",Gryffindor\\n"Granger, Hermione",Gryffindor\\n"Malfoy, Draco",Slytherin\\n"Potter, Harry",Gryffindor\\n"Weasley, Ron",Gryffindor\\n')

    # 2. Week 6 P-Shirt transparent overlay + portrait/landscape sample inputs
    shirt_dir = os.path.join(WORKSPACE_ROOT, "week6_shirt")
    os.makedirs(shirt_dir, exist_ok=True)

    shirt = Image.new("RGBA", (600, 600), (0, 0, 0, 0))
    d = ImageDraw.Draw(shirt)
    shirt_poly = [
        (185, 225), (245, 225), (270, 260), (300, 268), (330, 260), (355, 225), (415, 225),
        (520, 295), (475, 380), (425, 348), (425, 580), (175, 580), (175, 348), (125, 380), (80, 295)
    ]
    d.polygon(shirt_poly, fill=(239, 51, 64, 248), outline=(15, 17, 23, 255), width=4)
    d.ellipse((250, 206, 350, 258), fill=(0, 0, 0, 0))
    d.text((224, 345), "I TOOK", fill=(255, 255, 255, 255), font=font_lg)
    d.text((238, 405), "CS50P", fill=(255, 255, 255, 255), font=font_lg)
    shirt.save(os.path.join(shirt_dir, "shirt.png"), format="PNG")

    # 600x800 portrait sample (tests vertical cropping via ImageOps.fit)
    before1 = Image.new("RGB", (600, 800), (219, 234, 254))
    b1 = ImageDraw.Draw(before1)
    b1.rectangle((0, 0, 600, 800), fill=(224, 231, 255))
    b1.ellipse((215, 55, 385, 225), fill=(253, 224, 178), outline=(30, 41, 59), width=4)
    b1.ellipse((264, 118, 282, 136), fill=(15, 23, 42))
    b1.ellipse((318, 118, 336, 136), fill=(15, 23, 42))
    b1.arc((270, 148, 330, 188), 10, 170, fill=(15, 23, 42), width=4)
    b1.rounded_rectangle((170, 240, 430, 700), radius=36, fill=(71, 85, 105))
    before1.save(os.path.join(shirt_dir, "before1.jpg"), format="JPEG", quality=92)

    # 800x600 landscape sample (tests horizontal cropping via ImageOps.fit)
    before2 = Image.new("RGB", (800, 600), (241, 245, 249))
    b2 = ImageDraw.Draw(before2)
    b2.rectangle((0, 0, 800, 600), fill=(236, 253, 245))
    b2.ellipse((315, 45, 485, 215), fill=(254, 215, 170), outline=(15, 23, 42), width=4)
    b2.ellipse((364, 108, 382, 126), fill=(15, 23, 42))
    b2.ellipse((418, 108, 436, 126), fill=(15, 23, 42))
    b2.arc((370, 138, 430, 178), 10, 170, fill=(15, 23, 42), width=4)
    b2.rounded_rectangle((270, 230, 530, 580), radius=36, fill=(30, 41, 59))
    before2.save(os.path.join(shirt_dir, "before2.jpg"), format="JPEG", quality=92)

    # 3. Week 8 CS50 Shirtificate PNG template
    cert_dir = os.path.join(WORKSPACE_ROOT, "week8_shirtificate")
    os.makedirs(cert_dir, exist_ok=True)
    cert_shirt = Image.new("RGBA", (600, 600), (255, 255, 255, 0))
    cd = ImageDraw.Draw(cert_shirt)
    cert_poly = [
        (160, 80), (235, 80), (265, 120), (300, 130), (335, 120), (365, 80), (440, 80),
        (560, 175), (505, 275), (445, 235), (445, 540), (155, 540), (155, 235), (95, 275), (40, 175)
    ]
    cd.polygon(cert_poly, fill=(239, 51, 64, 255), outline=(11, 13, 17, 255), width=6)
    cd.ellipse((245, 58, 355, 118), fill=(255, 255, 255, 255))
    cd.text((225, 360), "CS50P · SABERS", fill=(255, 255, 255, 185), font=font_sm)
    cert_shirt.save(os.path.join(cert_dir, "shirtificate.png"), format="PNG")
    return True
`;

function syncFilesToMemfs(files) {
  const FS = pyodide.FS;
  for (const [path, entry] of Object.entries(files)) {
    const cleanPath = path.startsWith('/') ? path : `/workspace/${path}`;
    const parts = cleanPath.split('/').filter(Boolean);
    let cur = '';
    for (let i = 0; i < parts.length - 1; i++) {
      cur += `/${parts[i]}`;
      try {
        FS.mkdir(cur);
      } catch {
        // exists
      }
    }
    if (entry.type === 'dir') {
      try {
        FS.mkdir(cleanPath);
      } catch {
        // exists
      }
    } else if (entry.encoding === 'binary' && entry.data instanceof Uint8Array) {
      FS.writeFile(cleanPath, entry.data);
    } else {
      FS.writeFile(cleanPath, String(entry.content || ''), { encoding: 'utf8' });
    }
  }
}

function collectMemfsWorkspace() {
  const FS = pyodide.FS;
  const result = {};
  const TEXT_EXTS = new Set(['py', 'txt', 'csv', 'json', 'md', 'ini', 'cfg', 'toml']);

  function walk(dir) {
    let entries;
    try {
      entries = FS.readdir(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name === '.' || name === '..' || name === '__pycache__' || name === '.pytest_cache') {
        continue;
      }
      const full = `${dir}/${name}`;
      const stat = FS.stat(full);
      const rel = full.replace(/^\/workspace\/?/, '');
      if (FS.isDir(stat.mode)) {
        result[rel] = { type: 'dir' };
        walk(full);
      } else {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        const raw = FS.readFile(full);
        if (TEXT_EXTS.has(ext)) {
          result[rel] = {
            type: 'file',
            encoding: 'utf8',
            content: new TextDecoder().decode(raw)
          };
        } else {
          result[rel] = {
            type: 'file',
            encoding: 'binary',
            data: new Uint8Array(raw)
          };
        }
      }
    }
  }

  walk('/workspace');
  return result;
}

async function initPyodideRuntime(msg) {
  if (msg.stdinCtrlBuffer && msg.stdinDataBuffer) {
    stdinCtrl = new Int32Array(msg.stdinCtrlBuffer);
    stdinData = new Uint8Array(msg.stdinDataBuffer);
  }
  if (msg.interruptBuffer) {
    interruptView = new Uint8Array(msg.interruptBuffer);
  }

  const origin = self.location.origin;
  const pyodideBase = `${origin}/vendor/pyodide/`;

  emit('status', { state: 'loading', text: 'Loading Python WASM...' });
  const { loadPyodide } = await import(/* @vite-ignore */ `${pyodideBase}pyodide.mjs`);
  
  pyodide = await loadPyodide({
    indexURL: pyodideBase
  });

  if (interruptView) {
    pyodide.setInterruptBuffer(interruptView);
  }

  emit('status', { state: 'loading', text: 'Loading CS50P Libraries...' });

  const manifestRes = await fetch(`${origin}/vendor/wheels/manifest.json`);
  const manifest = await manifestRes.json();

  if (Array.isArray(manifest.pyodidePreload) && manifest.pyodidePreload.length > 0) {
    await pyodide.loadPackage(manifest.pyodidePreload);
  }

  if (Array.isArray(manifest.wheels) && manifest.wheels.length > 0) {
    const micropip = pyodide.pyimport('micropip');
    const wheelUrls = manifest.wheels.map((w) => `${origin}/vendor/wheels/${w}`);
    await micropip.install(wheelUrls, { deps: false });
  }

  await pyodide.runPythonAsync(BOOTSTRAP_PYTHON);

  if (msg.files) {
    syncFilesToMemfs(msg.files);
  }

  emit('ready', {
    packages: manifest.packages || [],
    pythonVersion: manifest.pythonVersion || '3.13'
  });
}

self.onmessage = async (event) => {
  const msg = event.data || {};
  const { id, type } = msg;

  try {
    if (type === 'init') {
      await initPyodideRuntime(msg);
      return;
    }

    if (!pyodide) {
      emit('response', { id, ok: false, error: 'Python runtime is not ready yet.' });
      return;
    }

    if (type === 'sync-files') {
      syncFilesToMemfs(msg.files || {});
      emit('response', { id, ok: true });
      return;
    }

    if (type === 'generate-samples') {
      const fn = pyodide.globals.get('ide_generate_cs50p_samples');
      fn();
      fn.destroy();
      const snapshot = collectMemfsWorkspace();
      emit('response', { id, ok: true, workspace: snapshot });
      return;
    }

    if (type === 'run-script') {
      if (interruptView) interruptView[0] = 0;
      if (msg.files) syncFilesToMemfs(msg.files);

      const fn = pyodide.globals.get('ide_run_script');
      const argvPy = pyodide.toPy(msg.argv || []);
      const code = fn(msg.scriptPath, argvPy, msg.cwd || '/workspace');
      argvPy.destroy();
      fn.destroy();

      const snapshot = collectMemfsWorkspace();
      emit('response', { id, ok: true, exitCode: Number(code), workspace: snapshot });
      return;
    }

    if (type === 'run-pytest') {
      if (interruptView) interruptView[0] = 0;
      if (msg.files) syncFilesToMemfs(msg.files);

      const fn = pyodide.globals.get('ide_run_pytest');
      const argsPy = pyodide.toPy(msg.args || []);
      const code = fn(argsPy, msg.cwd || '/workspace');
      argsPy.destroy();
      fn.destroy();

      const snapshot = collectMemfsWorkspace();
      emit('response', { id, ok: true, exitCode: Number(code), workspace: snapshot });
      return;
    }

    if (type === 'analyze') {
      const fn = pyodide.globals.get('ide_analyze_code');
      const raw = fn(msg.code || '');
      fn.destroy();
      emit('response', { id, ok: true, diagnostics: JSON.parse(raw) });
      return;
    }

    if (type === 'jedi') {
      if (msg.files) syncFilesToMemfs(msg.files);
      const fn = pyodide.globals.get('ide_jedi_query');
      const raw = fn(msg.action, msg.code || '', msg.line || 1, msg.col || 0, msg.filepath || '/workspace/main.py');
      fn.destroy();
      emit('response', { id, ok: true, items: JSON.parse(raw) });
      return;
    }

    if (type === 'rm-path') {
      const FS = pyodide.FS;
      const target = msg.path.startsWith('/') ? msg.path : `/workspace/${msg.path}`;
      const rmRec = (p) => {
        try {
          const st = FS.stat(p);
          if (FS.isDir(st.mode)) {
            for (const ent of FS.readdir(p)) {
              if (ent !== '.' && ent !== '..') rmRec(`${p}/${ent}`);
            }
            FS.rmdir(p);
          } else {
            FS.unlink(p);
          }
        } catch {
          // ignore
        }
      };
      rmRec(target);
      emit('response', { id, ok: true });
    }
  } catch (err) {
    emit('response', { id, ok: false, error: err?.message || String(err) });
  }
};
