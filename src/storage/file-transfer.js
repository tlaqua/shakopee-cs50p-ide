import JSZip from 'jszip';

export function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'py') return 'text/x-python;charset=utf-8';
  if (ext === 'csv') return 'text/csv;charset=utf-8';
  if (ext === 'json') return 'application/json;charset=utf-8';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

export async function saveSingleFileToComputer(filename, entry) {
  const baseName = filename.split('/').pop() || 'script.py';
  const blob =
    entry.encoding === 'binary'
      ? new Blob([entry.data], { type: getMimeType(baseName) })
      : new Blob([entry.content || ''], { type: getMimeType(baseName) });

  // Use native File System Access save dialog when supported on desktop/Chromebook
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const ext = baseName.includes('.') ? `.${baseName.split('.').pop()}` : '.py';
      const handle = await window.showSaveFilePicker({
        suggestedName: baseName,
        types: [
          {
            description: 'Workspace File',
            accept: { [getMimeType(baseName).split(';')[0]]: [ext] }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      // Fall through to <a download> on unsupported/restricted contexts
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = baseName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export async function exportWorkspaceZip(filesMap, zipName = 'shakopee-cs50p-workspace.zip') {
  const zip = new JSZip();
  for (const [path, entry] of Object.entries(filesMap)) {
    if (entry.type === 'dir') {
      zip.folder(path);
    } else if (entry.encoding === 'binary' && entry.data instanceof Uint8Array) {
      zip.file(path, entry.data);
    } else {
      zip.file(path, entry.content || '');
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const TEXT_EXTENSIONS = new Set(['py', 'txt', 'csv', 'json', 'md', 'ini', 'cfg', 'toml']);

export async function readUploadedFileList(fileList) {
  const results = {};
  for (const file of Array.from(fileList)) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const buf = new Uint8Array(await file.arrayBuffer());
    if (TEXT_EXTENSIONS.has(ext)) {
      results[file.name] = {
        type: 'file',
        encoding: 'utf8',
        content: new TextDecoder().decode(buf)
      };
    } else {
      results[file.name] = {
        type: 'file',
        encoding: 'binary',
        data: buf
      };
    }
  }
  return results;
}
