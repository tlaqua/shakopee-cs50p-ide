import { getMimeType, saveSingleFileToComputer } from '../storage/file-transfer.js';

let activeObjectUrls = [];

export function clearPreviewResources() {
  for (const url of activeObjectUrls) {
    URL.revokeObjectURL(url);
  }
  activeObjectUrls = [];
}

export function isPreviewOnlyFile(path) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'].includes(ext);
}

function parseCsvRows(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cur);
      cur = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

export function renderFilePreview(hostEl, path, entry) {
  clearPreviewResources();
  hostEl.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'preview-toolbar';
  const title = document.createElement('strong');
  title.textContent = path;

  const btnDownload = document.createElement('button');
  btnDownload.className = 'btn btn-primary btn-sm';
  btnDownload.textContent = 'Save to Computer';
  btnDownload.onclick = () => saveSingleFileToComputer(path, entry);

  toolbar.append(title, btnDownload);
  hostEl.appendChild(toolbar);

  const ext = path.split('.').pop()?.toLowerCase() || '';

  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) && entry.data) {
    const blob = new Blob([entry.data], { type: getMimeType(path) });
    const url = URL.createObjectURL(blob);
    activeObjectUrls.push(url);
    const img = document.createElement('img');
    img.className = 'preview-image-frame';
    img.src = url;
    img.alt = path;
    hostEl.appendChild(img);
    return;
  }

  if (ext === 'pdf' && entry.data) {
    const blob = new Blob([entry.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    activeObjectUrls.push(url);
    const frame = document.createElement('iframe');
    frame.className = 'preview-pdf-frame';
    frame.src = url;
    frame.title = path;
    hostEl.appendChild(frame);
    return;
  }

  if (ext === 'csv' && entry.content !== undefined) {
    const rows = parseCsvRows(entry.content);
    const table = document.createElement('table');
    table.className = 'csv-table';
    rows.slice(0, 100).forEach((r, idx) => {
      const tr = document.createElement('tr');
      r.forEach((cell) => {
        const el = document.createElement(idx === 0 ? 'th' : 'td');
        el.textContent = cell;
        tr.appendChild(el);
      });
      table.appendChild(tr);
    });
    hostEl.appendChild(table);
  }
}
