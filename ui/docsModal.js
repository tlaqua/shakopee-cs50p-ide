import { OFFLINE_DOC_SECTIONS } from '../curriculum/cs50pData.js';

export function setupDocsModal({ modalEl, bodyEl, searchInputEl, openBtn, closeBtn }) {
  function render(filter = '') {
    const q = filter.trim().toLowerCase();
    bodyEl.innerHTML = '';

    const matches = OFFLINE_DOC_SECTIONS.filter((sec) => {
      if (!q) return true;
      return (
        sec.title.toLowerCase().includes(q) ||
        sec.keywords.toLowerCase().includes(q) ||
        sec.body.toLowerCase().includes(q) ||
        sec.example.toLowerCase().includes(q)
      );
    });

    if (matches.length === 0) {
      bodyEl.innerHTML = '<p>No matching documentation topics found.</p>';
      return;
    }

    for (const sec of matches) {
      const card = document.createElement('article');
      card.className = 'doc-card';

      const h3 = document.createElement('h3');
      h3.textContent = sec.title;

      const p = document.createElement('p');
      p.textContent = sec.body;

      const pre = document.createElement('pre');
      pre.textContent = sec.example;

      card.append(h3, p, pre);
      bodyEl.appendChild(card);
    }
  }

  function open() {
    render(searchInputEl.value);
    modalEl.classList.remove('hidden');
    searchInputEl.focus();
  }

  function close() {
    modalEl.classList.add('hidden');
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });
  searchInputEl.addEventListener('input', () => render(searchInputEl.value));

  return { open, close };
}
