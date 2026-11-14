import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PYODIDE_VERSION = '0.29.5';
const PYODIDE_URL = `https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-${PYODIDE_VERSION}.tar.bz2`;

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, '.cache');
const VENDOR_DIR = path.join(ROOT, 'public', 'vendor');
const PYODIDE_OUT = path.join(VENDOR_DIR, 'pyodide');
const WHEELS_OUT = path.join(VENDOR_DIR, 'wheels');

const CLOUDFLARE_MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MiB static asset limit

// Desired Pyodide-built packages (WASM/C extensions + core tools)
const DESIRED_PYODIDE_PACKAGES = [
  'micropip',
  'packaging',
  'pillow',
  'pytest',
  'pluggy',
  'iniconfig',
  'pygments',
  'requests',
  'urllib3',
  'charset-normalizer',
  'idna',
  'certifi',
  'jedi',
  'parso',
  'typing-extensions',
  'six',
  'jsonschema',
  'jsonschema-specifications',
  'referencing',
  'attrs',
  'rpds-py',
  'more-itertools',
  'fonttools',
  'pyodide-http'
];

// All third-party CS50P packages (+ pure-Python IDE support packages)
const CS50P_PACKAGES = [
  'cowsay',
  'emoji',
  'pyfiglet',
  'tabulate',
  'inflect',
  'validators',
  'validator-collection',
  'fpdf2',
  'pyodide-http',
  'requests',
  'jedi',
  'fonttools'
];

function normName(name) {
  return String(name).trim().toLowerCase().replace(/[-_.]+/g, '-');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

async function downloadFile(url, dest) {
  console.log(`Downloading ${url}...`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} downloading ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf;
}

function parsePyVersionTuple(vStr) {
  const parts = vStr.split('.').map((n) => parseInt(n, 10) || 0);
  return [parts[0] || 0, parts[1] || 0];
}

function comparePyVersion(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] - b[1];
}

function evaluatePythonMarker(marker, pyVer = [3, 13]) {
  if (!marker) return true;
  const m = marker.trim();

  // Never auto-pull optional extras
  if (/\bextra\s*==/i.test(m)) return false;

  // Skip Windows / platform-specific non-POSIX dependencies
  if (/sys_platform\s*==\s*['"]win32['"]/i.test(m)) return false;
  if (/platform_system\s*==\s*['"]Windows['"]/i.test(m)) return false;
  if (/os_name\s*==\s*['"]nt['"]/i.test(m)) return false;
  if (/implementation_name\s*!=\s*['"]cpython['"]/i.test(m)) return false;

  // Evaluate simple python_version comparisons (e.g. python_version < "3.11")
  const verRegex = /python_version\s*(<=|>=|<|>|==|!=)\s*['"]([0-9.]+)['"]/g;
  let match;
  let allMatch = true;
  let sawVer = false;
  while ((match = verRegex.exec(m)) !== null) {
    sawVer = true;
    const op = match[1];
    const target = parsePyVersionTuple(match[2]);
    const cmp = comparePyVersion(pyVer, target);
    const ok =
      (op === '<' && cmp < 0) ||
      (op === '<=' && cmp <= 0) ||
      (op === '>' && cmp > 0) ||
      (op === '>=' && cmp >= 0) ||
      (op === '==' && cmp === 0) ||
      (op === '!=' && cmp !== 0);
    if (!ok) {
      allMatch = false;
    }
  }
  if (sawVer && !allMatch && !/\bor\b/i.test(m)) {
    return false;
  }

  return true;
}

function extractPkgNameFromReq(reqStr) {
  const [specPart, markerPart] = reqStr.split(';');
  if (!evaluatePythonMarker(markerPart)) {
    return null;
  }
  const clean = specPart.trim().split(/[\s\[<>=!~;,]/)[0];
  return clean ? normName(clean) : null;
}

async function resolveAndDownloadWheels(rootPackages, preloadedSet) {
  const visited = new Set();
  const orderedWheels = []; // dependencies first

  async function visit(rawName) {
    const pkgName = normName(rawName);
    if (!pkgName || visited.has(pkgName) || preloadedSet.has(pkgName)) {
      return;
    }
    visited.add(pkgName);

    const apiUrl = `https://pypi.org/pypi/${encodeURIComponent(pkgName)}/json`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch PyPI metadata for ${pkgName}: HTTP ${res.status}`);
    }
    const meta = await res.json();
    const version = meta.info.version;
    const files = meta.releases?.[version] || meta.urls || [];

    // Pick a pure-Python universal wheel (py3-none-any or py2.py3-none-any)
    let wheel = files.find(
      (f) => f.packagetype === 'bdist_wheel' && /-py3-none-any\.whl$/i.test(f.filename)
    );
    if (!wheel) {
      wheel = files.find(
        (f) => f.packagetype === 'bdist_wheel' && /-py2\.py3-none-any\.whl$/i.test(f.filename)
      );
    }
    if (!wheel) {
      // Fallback: check recent versions for a pure-Python wheel
      const versions = Object.keys(meta.releases || {}).reverse();
      for (const v of versions) {
        const candidate = (meta.releases[v] || []).find(
          (f) =>
            f.packagetype === 'bdist_wheel' &&
            /-(py3|py2\.py3)-none-any\.whl$/i.test(f.filename)
        );
        if (candidate) {
          wheel = candidate;
          break;
        }
      }
    }

    if (!wheel) {
      throw new Error(
        `No pure-Python (*-none-any.whl) wheel found on PyPI for "${pkgName}" (and not bundled in Pyodide).`
      );
    }

    // Visit dependencies first so installation order is topological
    const requires = meta.info.requires_dist || [];
    for (const req of requires) {
      const dep = extractPkgNameFromReq(req);
      if (dep) {
        await visit(dep);
      }
    }

    const outPath = path.join(WHEELS_OUT, wheel.filename);
    if (!fs.existsSync(outPath)) {
      await downloadFile(wheel.url, outPath);
    }
    orderedWheels.push({
      name: pkgName,
      version,
      filename: wheel.filename
    });
  }

  for (const pkg of rootPackages) {
    await visit(pkg);
  }
  return orderedWheels;
}

async function main() {
  ensureDir(CACHE_DIR);
  ensureDir(VENDOR_DIR);
  cleanDir(PYODIDE_OUT);
  cleanDir(WHEELS_OUT);

  const tarballPath = path.join(CACHE_DIR, `pyodide-${PYODIDE_VERSION}.tar.bz2`);
  const extractDir = path.join(CACHE_DIR, `extracted-${PYODIDE_VERSION}`);

  if (!fs.existsSync(tarballPath)) {
    await downloadFile(PYODIDE_URL, tarballPath);
  } else {
    console.log(`Using cached Pyodide tarball: ${tarballPath}`);
  }

  const pyodideSrcDir = path.join(extractDir, 'pyodide');
  if (!fs.existsSync(path.join(pyodideSrcDir, 'pyodide-lock.json'))) {
    cleanDir(extractDir);
    console.log('Extracting Pyodide archive (tar -xjf)...');
    execFileSync('tar', ['-xjf', tarballPath, '-C', extractDir], { stdio: 'inherit' });
  }

  // Load pyodide-lock.json and detect Python version
  const lockPath = path.join(pyodideSrcDir, 'pyodide-lock.json');
  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const pyInfoVersion = lockData.info?.python || '3.13';
  console.log(`Pyodide ${PYODIDE_VERSION} (Python ${pyInfoVersion}) lockfile loaded.`);

  // Build normalized lookup of packages inside Pyodide
  const lockByNorm = new Map();
  for (const [key, pkg] of Object.entries(lockData.packages || {})) {
    lockByNorm.set(normName(key), { key, pkg });
    if (pkg.name) {
      lockByNorm.set(normName(pkg.name), { key, pkg });
    }
  }

  // BFS transitive closure of desired Pyodide packages
  const keptKeys = new Set();
  const keptNormNames = new Set();
  const queue = [...DESIRED_PYODIDE_PACKAGES];

  while (queue.length > 0) {
    const raw = queue.shift();
    const entry = lockByNorm.get(normName(raw));
    if (!entry || keptKeys.has(entry.key)) continue;

    keptKeys.add(entry.key);
    keptNormNames.add(normName(entry.key));
    if (entry.pkg.name) keptNormNames.add(normName(entry.pkg.name));

    for (const dep of entry.pkg.depends || []) {
      queue.push(dep);
    }
  }

  // Copy core Pyodide runtime files
  const coreFiles = [
    'pyodide.js',
    'pyodide.mjs',
    'pyodide.asm.js',
    'pyodide.asm.wasm',
    'python_stdlib.zip'
  ];

  for (const file of coreFiles) {
    const src = path.join(pyodideSrcDir, file);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing core Pyodide file: ${src}`);
    }
    const stat = fs.statSync(src);
    if (stat.size > CLOUDFLARE_MAX_FILE_BYTES) {
      throw new Error(`${file} exceeds Cloudflare's 25 MiB static asset limit!`);
    }
    fs.copyFileSync(src, path.join(PYODIDE_OUT, file));
  }

  // Copy pruned Pyodide packages and write pruned pyodide-lock.json
  const prunedPackages = {};
  const preloadNames = [];
  for (const key of keptKeys) {
    const pkg = lockData.packages[key];
    prunedPackages[key] = pkg;
    preloadNames.push(pkg.name || key);
    if (pkg.file_name) {
      const srcFile = path.join(pyodideSrcDir, pkg.file_name);
      const dstFile = path.join(PYODIDE_OUT, pkg.file_name);
      ensureDir(path.dirname(dstFile));
      fs.copyFileSync(srcFile, dstFile);
      const size = fs.statSync(dstFile).size;
      if (size > CLOUDFLARE_MAX_FILE_BYTES) {
        throw new Error(`${pkg.file_name} exceeds Cloudflare's 25 MiB limit!`);
      }
    }
  }

  const prunedLock = {
    info: lockData.info,
    packages: prunedPackages
  };
  fs.writeFileSync(
    path.join(PYODIDE_OUT, 'pyodide-lock.json'),
    JSON.stringify(prunedLock)
  );

  console.log(`Kept ${keptKeys.size} Pyodide packages in public/vendor/pyodide/.`);

  // Resolve and download pure-Python CS50P wheels not already in Pyodide
  const downloadedWheels = await resolveAndDownloadWheels(CS50P_PACKAGES, keptNormNames);

  const manifest = {
    pyodideVersion: PYODIDE_VERSION,
    pythonVersion: pyInfoVersion,
    pyodidePreload: preloadNames,
    wheels: downloadedWheels.map((w) => w.filename),
    packages: [...new Set([...preloadNames.map(normName), ...downloadedWheels.map((w) => w.name)])].sort()
  };

  fs.writeFileSync(
    path.join(WHEELS_OUT, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Report total vendor footprint
  let totalBytes = 0;
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else totalBytes += fs.statSync(full).size;
    }
  }
  walk(VENDOR_DIR);
  console.log(
    `Offline assets ready! Total vendor size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MiB`
  );
  console.log('Preloaded packages:', manifest.packages.join(', '));
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
