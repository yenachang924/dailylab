document.querySelectorAll('[data-collection]').forEach((collection) => {
  const input = collection.querySelector('[data-search-input]');
  const buttons = [...collection.querySelectorAll('[data-tag]')];
  const records = [...collection.querySelectorAll('[data-record]')];
  const apply = () => {
    const query = input.value.trim().toLowerCase();
    const tag = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.tag || '';
    const visible = records.filter((record) => {
      const matches = (!query || record.dataset.search.includes(query)) && (!tag || JSON.parse(record.dataset.tags).includes(tag));
      record.hidden = !matches;
      return matches;
    });
    collection.querySelector('[data-count]').textContent = visible.length + ' / ' + records.length + '개';
    collection.querySelector('[data-empty]').hidden = visible.length > 0;
  };
  input.addEventListener('input', apply);
  buttons.forEach((button) => button.addEventListener('click', () => {
    buttons.forEach((item) => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('active', active);
    });
    apply();
  }));
  const requestedTag = new URLSearchParams(window.location.search).get('tag');
  if (requestedTag) {
    const selected = buttons.find((button) => button.dataset.tag === requestedTag);
    if (selected) selected.click();
  }
});
