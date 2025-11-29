/* script.js - populate selects from data, search, filter, sort and render cards */

function populateSelects(){
  const from = document.getElementById('qFrom');
  const to = document.getElementById('qTo');
  const body = document.getElementById('qBody');

  // helper to create option
  function addOptions(select, arr, emptyLabel){
    select.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = emptyLabel || 'Любой';
    select.appendChild(empty);
    arr.forEach(v=>{
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  addOptions(from, CITIES, 'Любой');
  addOptions(to, CITIES, 'Любой');
  addOptions(body, BODIES, 'Любой');
}

function formatDateISO(dstr){
  if(!dstr) return '';
  const d = new Date(dstr);
  if(isNaN(d)) return dstr;
  return d.toLocaleDateString('ru-RU');
}

function renderCard(item){
  return `
    <div class="result-card">
      <div class="rc-top">
        <div class="route"><strong>${item.from}</strong> → <strong>${item.to}</strong></div>
        <div class="badge">${item.body}</div>
      </div>
      <div class="rc-meta">
        <div>Вес: <strong>${item.weight} т</strong></div>
        <div>Дата: <strong>${formatDateISO(item.date)}</strong></div>
        <div>Цена: <strong>${item.price} $</strong></div>
      </div>
      <div class="rc-meta" style="justify-content:space-between;color:var(--muted)">
        <div>Расстояние: <strong>${item.distance_km} км</strong></div>
        <div>ID: <strong>${item.id}</strong></div>
      </div>
      <div class="rc-actions">
        <button class="btn btn-primary btn-contact" data-id="${item.id}">Показать контакт</button>
        <button class="btn btn-ghost btn-save" data-id="${item.id}">Сохранить</button>
      </div>
      <div class="rc-contact" id="contact-${item.id}" style="display:none;margin-top:10px;color:var(--muted);font-size:14px">Телефон: ${item.contact}</div>
    </div>
  `;
}

function applyFiltersAndRender(){
  const qFrom = document.getElementById('qFrom').value;
  const qTo = document.getElementById('qTo').value;
  const qBody = document.getElementById('qBody').value;
  const qWmin = parseFloat(document.getElementById('qWmin').value) || 0;
  const qWmax = parseFloat(document.getElementById('qWmax').value) || 0;
  const qDate = document.getElementById('qDate').value;
  const sort = document.getElementById('sortSelect').value;

  let results = CARGOS.filter(c=>{
    if(qFrom && c.from !== qFrom) return false;
    if(qTo && c.to !== qTo) return false;
    if(qBody && c.body !== qBody) return false;
    if(qWmin && c.weight < qWmin) return false;
    if(qWmax && qWmax>0 && c.weight > qWmax) return false;
    if(qDate && c.date !== qDate) return false;
    return true;
  });

  // Sorting
  if(sort === 'date_desc') results.sort((a,b)=> new Date(b.date) - new Date(a.date));
  if(sort === 'date_asc') results.sort((a,b)=> new Date(a.date) - new Date(b.date));
  if(sort === 'weight_desc') results.sort((a,b)=> b.weight - a.weight);
  if(sort === 'weight_asc') results.sort((a,b)=> a.weight - b.weight);
  if(sort === 'price_desc') results.sort((a,b)=> b.price - a.price);
  if(sort === 'distance_asc') results.sort((a,b)=> a.distance_km - b.distance_km);

  const container = document.getElementById('results');
  container.innerHTML = results.length ? results.map(renderCard).join('') : '<div class="no-results">Ничего не найдено</div>';
  document.getElementById('resultsCount').textContent = results.length ? `(${results.length})` : '(0)';
  attachCardListeners();
}

function attachCardListeners(){
  document.querySelectorAll('.btn-contact').forEach(btn=>{
    btn.onclick = function(){ 
      const id = this.dataset.id;
      const el = document.getElementById('contact-'+id);
      if(el.style.display === 'none'){ el.style.display = 'block'; this.textContent = 'Скрыть контакт'; }
      else { el.style.display = 'none'; this.textContent = 'Показать контакт'; }
    };
  });
  document.querySelectorAll('.btn-save').forEach(btn=>{
    btn.onclick = function(){ 
      const id = this.dataset.id;
      this.textContent = 'Сохранено';
      this.disabled = true;
    };
  });
}

document.addEventListener('DOMContentLoaded', function(){
  populateSelects();
  applyFiltersAndRender();

  document.getElementById('searchForm').addEventListener('submit', function(e){
    e.preventDefault();
    applyFiltersAndRender();
  });
  document.getElementById('resetBtn').addEventListener('click', function(){
    document.getElementById('qFrom').value='';
    document.getElementById('qTo').value='';
    document.getElementById('qBody').value='';
    document.getElementById('qWmin').value='';
    document.getElementById('qWmax').value='';
    document.getElementById('qDate').value='';
    document.getElementById('sortSelect').value='date_desc';
    applyFiltersAndRender();
  });
  document.getElementById('sortSelect').addEventListener('change', applyFiltersAndRender);
});
