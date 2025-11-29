// script.js
function $(s) { return document.querySelector(s); };
function $all(s) { return Array.from(document.querySelectorAll(s)); };

function populateFilters() {
  const fFrom = $('#fFrom');
  const fTo = $('#fTo');
  const fBody = $('#fBody');
  fFrom.innerHTML = '<option value="">Любой</option>';
  fTo.innerHTML = '<option value="">Любой</option>';
  CITIES.forEach(c => { fFrom.innerHTML += `<option>${c}</option>`; fTo.innerHTML += `<option>${c}</option>`; });
  fBody.innerHTML = '<option value="">Любой</option>';
  BODIES.forEach(b => { fBody.innerHTML += `<option>${b}</option>`; });
};

let currentPage = 1;
const perPage = 10;
let currentList = LISTINGS.slice();

function renderList() {
  const area = $('#listArea');
  area.innerHTML = '';
  const start = (currentPage - 1) * perPage;
  const pageItems = currentList.slice(start, start + perPage);

  pageItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'list-row';
    el.innerHTML = `
      <div>
        <input type="checkbox" />
        <div class="small-muted">${item.code}</div>
      </div>

      <div class="col-route" style="color: white">
        <div class="col-km">${item.km} км</div>
        <div class="col-transport">${item.body} • груз: ${item.weight} т / ${item.volume || '-'} м³</div>
        <div><strong>${item.from}</strong> → <strong>${item.to}</strong></div>
        <div class="small-muted">готов ${new Date(item.date).toLocaleDateString()}</div>
        <div class="action-row">
          <button class="btn ghost show-contact" data-id="${item.id}">Показать контакты и ставку</button>
        </div>
      </div>

      <div class="col-meta">
        <div class="small-muted">Маршрут</div>
        <div>${item.from} — ${item.to}</div>
      </div>

      <div class="col-meta">
        <div class="small-muted">Ставка</div>
        <div><strong>${item.price.toLocaleString()} тенге</strong></div>
        <div class="price-small">${(item.price / item.km).toFixed(1)} руб/км</div>
      </div>
    `;
    area.appendChild(el);
  });

  $('#foundCount').textContent = currentList.length;
  renderPager();
  attachHandlers();
};

function renderPager() {
  const pager = $('#pager');
  pager.innerHTML = '';
  const pages = Math.max(1, Math.ceil(currentList.length / perPage));

  // используем IIFE для замыкания переменной p
  for (let p = 1; p <= pages; p++) {
    (function(pageNum) {
      const b = document.createElement('button');
      b.className = 'page-btn' + (pageNum === currentPage ? ' active-page' : '');
      b.textContent = pageNum;
      b.onclick = function() {
        currentPage = pageNum;
        renderList();
      };
      pager.appendChild(b);
    })(p);
  }
};

function attachHandlers() {
  $all('.show-contact').forEach(function(btn) {
    btn.onclick = function() {
      const id = +btn.dataset.id;
      const item = LISTINGS.find(function(x) { return x.id === id; });
      if (!item) return;
      alert('Контакт: ' + item.contact + '\nСтавка: ' + item.price.toLocaleString() + ' руб\nID: ' + item.code);
    };
  });
};

function applyFilters() {
  const fFrom = $('#fFrom').value;
  const fTo = $('#fTo').value;
  const fBody = $('#fBody').value;
  const fDate = $('#fDate').value;
  const sort = $('#sortSel').value;

  currentList = LISTINGS.filter(function(item) {
    if (fFrom && item.from !== fFrom) return false;
    if (fTo && item.to !== fTo) return false;
    if (fBody && item.body !== fBody) return false;
    if (fDate && item.date !== fDate) return false;
    return true;
  });

  if (sort === 'price') currentList.sort(function(a, b) { return b.price - a.price; });
  if (sort === 'km') currentList.sort(function(a, b) { return a.km - b.km; });
  if (sort === 'date') currentList.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  currentPage = 1;
  renderList();
};

document.addEventListener('DOMContentLoaded', function() {
  populateFilters();
  renderList();

  $('#btnSearch').addEventListener('click', function(e) {
    e.preventDefault();
    applyFilters();
  });

  $('#btnReset').addEventListener('click', function() {
    $('#fFrom').value = '';
    $('#fTo').value = '';
    $('#fBody').value = '';
    $('#fDate').value = '';
    $('#sortSel').value = 'date';
    currentList = LISTINGS.slice();
    currentPage = 1;
    renderList();
  });

  $('#sortSel').addEventListener('change', applyFilters);
});
