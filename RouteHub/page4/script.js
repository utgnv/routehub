document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cargoForm');
  const cargoList = document.getElementById('cargoList');
  const publishBtn = document.getElementById('publishBtn');
  const saveTemplate = document.getElementById('saveTemplate');
  const sidebarPublish = document.getElementById('sidebarPublish');
  const sidebarTemplate = document.getElementById('sidebarTemplate');
  const summaryText = document.getElementById('summaryText');
  const themeToggle = document.getElementById('themeToggle');
  const sidebar = document.getElementById('sidebar');
  const popup = document.getElementById('publishPopup');

  const qs = (s,r=document)=>r.querySelector(s);
  const qsa = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // Theme
  if(localStorage.getItem('theme')==='dark') document.body.classList.add('theme-dark');
  themeToggle.textContent = document.body.classList.contains('theme-dark')?'☀️':'🌙';
  themeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('theme-dark');
    const mode = document.body.classList.contains('theme-dark')?'dark':'light';
    localStorage.setItem('theme',mode);
    themeToggle.textContent = mode==='dark'?'☀️':'🌙';
  });

  // Suggestions
  document.addEventListener('input', e=>{
    if(e.target.classList.contains('cargo-name')||e.target.classList.contains('place')){
      const ul = e.target.parentElement.querySelector('.suggestions');
      if(!ul) return;
      const val = e.target.value.trim().toLowerCase();
      qsa('li',ul).forEach(li=>li.style.display=li.textContent.toLowerCase().includes(val)?'':'none');
      ul.style.display = val?'block':'none';
    }
  });
  document.addEventListener('click', e=>{
    if(e.target.matches('.suggestions li')){
      const ul = e.target.closest('.suggestions');
      const input = ul.parentElement.querySelector('input');
      input.value = e.target.textContent;
      ul.style.display='none';
      updateSidebar();
    }
    if(!e.target.closest('.with-suggestions')){
      qsa('.suggestions').forEach(ul=>ul.style.display='none');
    }
    if(e.target.matches('.chip.remove')){
      e.target.closest('.cargo-block').remove();
      renumberCargoBlocks();
      update
      
    }

        // Utility
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const valueOrDash = (v) => v && v.trim() ? v : "—";
    const fmtNum = (n) => {
      const num = Number(n);
      if (!isFinite(num)) return "0";
      return new Intl.NumberFormat("ru-RU").format(num);
    };

    // State
    const state = {
      points: [],
      cargoCount: 0,
      totalWeight: 0,
      totalVolume: 0,
      published: false
    };

    // Inputs
    const form = $("#cargoForm");
    const inputs = {
      cargoType: $("#cargoType"),
      category: $("#category"),
      title: $("#title"),
      readyDate: $("#readyDate"),
      regularity: $("#regularity"),
      places: $("#places"),
      weight: $("#weight"),
      volume: $("#volume"),
      packed: $("#packed"),
      from: $("#from"),
      to: $("#to"),
      tempMode: $("#tempMode"),
      payment: $("#payment"),
      price: $("#price"),
      currency: $("#currency"),
      cod: $("#cod"),
      codAmount: $("#codAmount"),
      codCurrency: $("#codCurrency"),
      bargain: $("#bargain"),
      contactName: $("#contactName"),
      phone: $("#phone"),
      email: $("#email"),
      description: $("#description"),
      photo: $("#photo"),
      docs: $("#docs"),
      loaders: $("#loaders"),
      handling: $("#handling"),
      seal: $("#seal"),
      tent: $("#tent")
    };

    // Summary elements
    const sum = {
      type: $("#sumType"),
      category: $("#sumCategory"),
      title: $("#sumTitle"),
      date: $("#sumDate"),
      regularity: $("#sumRegularity"),
      places: $("#sumPlaces"),
      weightVolume: $("#sumWeightVolume"),
      packed: $("#sumPacked"),
      from: $("#sumFrom"),
      to: $("#sumTo"),
      points: $("#sumPoints"),
      bodyTypes: $("#sumBodyTypes"),
      temp: $("#sumTemp"),
      loading: $("#sumLoading"),
      unloading: $("#sumUnloading"),
      loadingMethod: $("#sumLoadingMethod"),
      unloadingMethod: $("#sumUnloadingMethod"),
      docsFlags: $("#sumDocsFlags"),
      payment: $("#sumPayment"),
      price: $("#sumPrice"),
      cod: $("#sumCOD"),
      bargain: $("#sumBargain"),
      contactName: $("#sumContactName"),
      phone: $("#sumPhone"),
      email: $("#sumEmail"),
      extras: $("#sumExtras"),
      desc: $("#sumDesc")
    };

    const pointsInfo = $("#pointsInfo");
    const addPointBtn = $("#addPoint");
    const addCargoBtn = $("#addCargoBtn");
    const cargoStats = $("#cargoStats");
    const publishBtn = $("#publishBtn");
    const publishInfo = $("#publishInfo");
    const bargainHint = $("#bargainHint");
    const photoList = $("#photoList");
    const docsList = $("#docsList");

    // Checkgroups
    const bodyTypes = $$("#bodyTypes input[type='checkbox']");
    const loadingType = $$("#loadingType input[type='checkbox']");
    const unloadingType = $$("#unloadingType input[type='checkbox']");
    const loadingMethod = $$("#loadingMethod input[type='checkbox']");
    const unloadingMethod = $$("#unloadingMethod input[type='checkbox']");

    // Validation helpers
    const showError = (name, msg) => {
      const el = document.querySelector(`[data-error="${name}"]`);
      if (el) el.textContent = msg || "";
    };
    const requireFilled = (name, value, label) => {
      if (!value || (typeof value === "string" && !value.trim())) {
        showError(name, `Заполните поле: ${label}`);
        return false;
      }
      showError(name, "");
      return true;
    };
    const isValidEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isValidPhone = (v) => /^\+?[0-9()\-\s]{8,}$/.test(v);

    // Bind basic interactions
    inputs.cod.addEventListener("change", () => {
      const on = inputs.cod.checked;
      inputs.codAmount.disabled = !on;
      inputs.codCurrency.disabled = !on;
      updateSummary();
    });

    inputs.currency.addEventListener("change", () => {
      // mirror currency to COD by default
      if (!inputs.cod.checked) {
        inputs.codCurrency.value = inputs.currency.value;
      }
      updateSummary();
    });

    addPointBtn.addEventListener("click", () => {
      const p = prompt("Введите промежуточную точку (город, адрес):");
      if (p && p.trim()) {
        state.points.push(p.trim());
        pointsInfo.textContent = `Добавлено: ${state.points.length}`;
        updateSummary();
      }
    });

    // Add cargo aggregates
    addCargoBtn.addEventListener("click", () => {
      const w = Number(inputs.weight.value || 0);
      const v = Number(inputs.volume.value || 0);
      const places = Number(inputs.places.value || 0);
      if (w <= 0 || places <= 0) {
        alert("Укажите корректный вес и количество мест.");
        return;
      }
      state.cargoCount += 1;
      state.totalWeight += w;
      state.totalVolume += v;
      cargoStats.textContent = `Груз: ${state.cargoCount} / ${fmtNum(state.totalWeight)} кг / ${fmtNum(state.totalVolume)} м³`;
    });

    // File previews
    const renderFiles = (input, target) => {
      target.innerHTML = "";
      const files = Array.from(input.files || []);
      if (!files.length) return;
      files.slice(0, 6).forEach(f => {
        const div = document.createElement("div");
        div.className = "file";
        div.textContent = `${f.name} (${fmtNum(f.size)} байт)`;
        target.appendChild(div);
      });
    };
    inputs.photo.addEventListener("change", () => renderFiles(inputs.photo, photoList));
    inputs.docs.addEventListener("change", () => renderFiles(inputs.docs, docsList));

    // Live summary
    const getCheckedValues = (nodes) => nodes.filter(n => n.checked).map(n => n.value);
    const listOrDash = (arr) => arr.length ? arr.map(v => `<span class="pill">${v}</span>`).join("") : "—";

    const updateSummary = () => {
      sum.type.textContent = valueOrDash(inputs.cargoType.value);
      sum.category.textContent = valueOrDash(inputs.category.value);
      sum.title.textContent = valueOrDash(inputs.title.value);
      sum.date.textContent = valueOrDash(inputs.readyDate.value);
      sum.regularity.textContent = valueOrDash(inputs.regularity.value);
      sum.places.textContent = valueOrDash(inputs.places.value);
      sum.weightVolume.textContent = `${fmtNum(inputs.weight.value || 0)} кг / ${fmtNum(inputs.volume.value || 0)} м³`;
      sum.packed.textContent = inputs.packed.checked ? "Да" : "Нет";

      sum.from.textContent = valueOrDash(inputs.from.value);
      sum.to.textContent = valueOrDash(inputs.to.value);
      sum.points.innerHTML = state.points.length ? state.points.map(p => `<span class="pill">${p}</span>`).join("") : "—";

      sum.bodyTypes.innerHTML = listOrDash(getCheckedValues(bodyTypes));
      sum.temp.textContent = valueOrDash(inputs.tempMode.value);
      sum.loading.innerHTML = listOrDash(getCheckedValues(loadingType));
      sum.unloading.innerHTML = listOrDash(getCheckedValues(unloadingType));
      sum.loadingMethod.innerHTML = listOrDash(getCheckedValues(loadingMethod));
      sum.unloadingMethod.innerHTML = listOrDash(getCheckedValues(unloadingMethod));

      const flags = [
        inputs.insurance.checked ? "Страховка" : null,
        inputs.cmr.checked ? "CMR" : null,
        inputs.tir.checked ? "TIR" : null,
        inputs.adr.checked ? "ADR" : null
      ].filter(Boolean);
      sum.docsFlags.innerHTML = listOrDash(flags);

      const price = inputs.price.value ? `${fmtNum(inputs.price.value)} ${inputs.currency.value}` : "—";
      sum.price.textContent = price;
      sum.payment.textContent = inputs.payment.value || "—";
      sum.bargain.textContent = inputs.bargain.value || "—";

      const codText = inputs.cod.checked
        ? `${fmtNum(inputs.codAmount.value || 0)} ${inputs.codCurrency.value}`
        : "Нет";
      sum.cod.textContent = codText;

      sum.contactName.textContent = valueOrDash(inputs.contactName.value);
      sum.phone.textContent = valueOrDash(inputs.phone.value);
      sum.email.textContent = valueOrDash(inputs.email.value);

      const extras = [
        inputs.loaders.checked ? "Грузчики" : null,
        inputs.handling.checked ? "Погрузка/разгрузка" : null,
        inputs.seal.checked ? "Пломба" : null,
        inputs.tent.checked ? "Тент/ремни/уголки" : null
      ].filter(Boolean);
      sum.extras.innerHTML = listOrDash(extras);

      sum.desc.textContent = valueOrDash(inputs.description.value);

      bargainHint.textContent = inputs.bargain.value === "Нет"
        ? "Торг не предусмотрен"
        : `Допустимый торг: ${inputs.bargain.value}`;
    };

    // Bind live update
    [
      ...Object.values(inputs),
      ...bodyTypes, ...loadingType, ...unloadingType, ...loadingMethod, ...unloadingMethod
    ].forEach(el => {
      const ev = (el.type === "checkbox" || el.type === "file") ? "change" : "input";
      el.addEventListener(ev, updateSummary);
    });

    // Initial summary
    updateSummary();

    // Publish simulation
    publishBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // minimal validation
      const ok =
        requireFilled("cargoType", inputs.cargoType.value, "Тип груза") &
        requireFilled("category", inputs.category.value, "Категория") &
        requireFilled("title", inputs.title.value, "Название") &
        requireFilled("readyDate", inputs.readyDate.value, "Дата готовности") &
        requireFilled("places", inputs.places.value, "Кол-во мест") &
        requireFilled("weight", inputs.weight.value, "Вес") &
        requireFilled("from", inputs.from.value, "Откуда") &
        requireFilled("to", inputs.to.value, "Куда") &
        requireFilled("contactName", inputs.contactName.value, "Имя") &
        requireFilled("phone", inputs.phone.value, "Телефон");

      if (!isValidPhone(inputs.phone.value)) {
        showError("phone", "Введите корректный номер телефона");
      } else {
        showError("phone", "");
      }

      if (!isValidEmail(inputs.email.value)) {
        showError("email", "Введите корректный email");
      } else {
        showError("email", "");
      }

      if (!ok || !isValidPhone(inputs.phone.value) || !isValidEmail(inputs.email.value)) {
        alert("Проверьте поля формы.");
        return;
      }

      state.published = true;
      publishInfo.textContent = "Груз опубликован";
      publishInfo.style.color = "var(--accent)";
      publishBtn.disabled = true;
      publishBtn.textContent = "Опубликовано";
    });