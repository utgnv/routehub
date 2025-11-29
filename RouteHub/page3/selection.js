// selection.js - исправленная логика: не брать "руб/км", приоритет data-price
(function(){
  'use strict';

  function parseNumberFromString(str){
    if(!str) return 0;
    // ищем первое вхождение числа с секциями тысяч (пробел/NBSP) или десятичной частью
    var m = str.replace(/\u00A0/g, ' ').match(/(\d{1,3}(?:[ \u00A0]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)/);
    if(!m) return 0;
    var num = m[0].replace(/[ \u00A0]/g, '').replace(',', '.');
    var n = parseFloat(num);
    return isNaN(n) ? 0 : n;
  }

  // проверяет, содержит ли строка признаки "за км" или другие пер-единицы
  function looksLikePerUnit(text){
    if(!text) return false;
    var t = text.toLowerCase();
    // шаблоны: "/км", "руб/км", "₸/км", "/km", "км/ч", "/ч", "per km"
    if(t.indexOf('/км') !== -1 || t.indexOf('/km') !== -1) return true;
    if(t.indexOf('км/ч') !== -1 || t.indexOf('/ч') !== -1) return true;
    if(t.indexOf('per km') !== -1) return true;
    // если встречается слово "км" рядом со знаком валюты, лучше отбросить
    if(/\d[\s\u00A0]*км/.test(t)) return true;
    return false;
  }

  // Пытаемся получить цену из элемента el (ищем data-price, классы или текст),
  // но пропускаем элементы, явно содержащие per-unit ("/км", "км" и т.п.)
  function findPriceFromElement(el){
    if(!el) return 0;

    // 1) data-price на самом элементе или у родителей (самый надёжный)
    var cur = el;
    for(var depth = 0; depth < 4 && cur; depth++){
      if(cur.dataset && cur.dataset.price){
        var val = parseFloat(cur.dataset.price);
        if(!isNaN(val)) return val;
      }
      cur = cur.parentElement;
    }

    // 2) сначала ищем элементы с "классовыми" подсказками цены внутри близкого окружения
    var priceSelectors = ['.price', '.price-small', '.stavka', '.cost', '.cost-value', '.price-value', '.value-price', '.price_total'];
    cur = el;
    for(depth = 0; depth < 4 && cur; depth++){
      for(var i = 0; i < priceSelectors.length; i++){
        var candidate = cur.querySelector && cur.querySelector(priceSelectors[i]);
        if(candidate && candidate.textContent){
          var txt = candidate.textContent.trim();
          // если это явно per-unit, пропускаем
          if(looksLikePerUnit(txt)) continue;
          var n = parseNumberFromString(txt);
          if(n) return n;
        }
      }
      cur = cur.parentElement;
    }

    // 3) как fallback: пробуем ближайшие текстовые узлы, но игнорируем per-unit
    cur = el;
    for(depth = 0; depth < 4 && cur; depth++){
      var allText = (cur.textContent || '').trim();
      if(allText){
        // если в тексте встречается отметка пер-единицы и нет явного символа валюты — пропускаем
        if(looksLikePerUnit(allText) && !/[₸₽€$]|руб|тенге|тңг|тг/i.test(allText)) {
          // явно per-unit без валюты — не пригодно
        } else {
          // если есть валюта или нет меток per-unit — берем число
          var n2 = parseNumberFromString(allText);
          if(n2) return n2;
        }
      }
      cur = cur.parentElement;
    }

    // 4) ничего не найдено
    return 0;
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(!document.getElementById('selectionBar')){
      var bar = document.createElement('div');
      bar.id = 'selectionBar';
      bar.className = 'selection-bar';
      bar.innerHTML = '<div class="selection-inner container"><div class="selection-left" id="selectionLeft">Выбрано <strong id="selectionCount">0</strong> грузов</div><div class="selection-right"><div id="selectionSum" style="font-weight:700">Сумма: 0</div><button id="clearSelectionBtn" class="selection-btn selection-btn-clear">Снять выбор</button><button class="selection-btn ghost">Действие</button></div></div>';
      document.body.appendChild(bar);
    }

    var selectionBar = document.getElementById('selectionBar');
    var selectionCountEl = document.getElementById('selectionCount');
    var selectionLeft = document.getElementById('selectionLeft');
    var selectionSumEl = document.getElementById('selectionSum');
    var clearBtn = document.getElementById('clearSelectionBtn');

    function declOfNum(number, titles) {
      number = Math.abs(number);
      if (number%10==1 && number%100!=11) return titles[0];
      if (number%10>=2 && number%10<=4 && (number%100<10 || number%100>=20)) return titles[1];
      return titles[2];
    }

    function collectCheckboxes(){
      var selectors = [
        '.list-row input[type=checkbox]',
        '.result-card input[type=checkbox]',
        '.card input[type=checkbox]',
        'article input[type=checkbox]',
        'input[type=checkbox].cargo-checkbox',
        '.listing input[type=checkbox]',
        'table input[type=checkbox]'
      ];
      var boxes = [];
      selectors.forEach(function(sel){
        Array.prototype.forEach.call(document.querySelectorAll(sel), function(n){ boxes.push(n); });
      });
      if(boxes.length === 0){
        boxes = Array.prototype.slice.call(document.querySelectorAll('input[type=checkbox]'));
      }
      boxes = boxes.filter(function(item, pos){
        return item && item.offsetParent !== null && boxes.indexOf(item) === pos;
      });
      return boxes;
    }

    var boxes = collectCheckboxes();
    var selected = new Set();

    boxes.forEach(function(chk, idx){
      if(!chk.dataset.id){
        var parent = chk.closest('[data-id], [data-listing-id], [data-listing]');
        if(parent && parent.dataset && (parent.dataset.id || parent.dataset.listingId || parent.dataset.listing)){
          chk.dataset.id = parent.dataset.id || parent.dataset.listingId || parent.dataset.listing;
        } else {
          chk.dataset.id = 'auto-' + idx;
        }
      }
      chk.classList.add('cargo-checkbox');
    });

    function updateBar(){
      var count = selected.size;
      if(count > 0){
        selectionBar.classList.add('visible');
        selectionBar.style.display = 'block';
      } else {
        selectionBar.classList.remove('visible');
        setTimeout(function(){
          if(!selectionBar.classList.contains('visible')) selectionBar.style.display = 'none';
        }, 300);
      }
      selectionCountEl.textContent = count;
      var word = declOfNum(count, ['груз','груза','грузов']);
      selectionLeft.innerHTML = 'Выбрано <strong id="selectionCount2">' + count + '</strong> ' + word;

      var sum = 0;
      selected.forEach(function(id){
        var ch = document.querySelector('input.cargo-checkbox[data-id="'+id+'"]');
        if(ch){
          var price = findPriceFromElement(ch.parentElement);
          if(!price){
            // попробуем искать в ближайших родителях как запасной вариант
            var p2 = findPriceFromElement(ch.closest('.list-row')) || findPriceFromElement(ch.closest('.result-card'));
            price = p2 || 0;
          }
          sum += Number(price) || 0;
        }
      });

      selectionSumEl.textContent = 'Сумма: ' + (sum ? sum.toLocaleString() + ' ₸' : '0 ₸');
    }

    function onCheckboxChange(e){
      var chk = e.target;
      var id = chk.dataset.id;
      if(chk.checked) selected.add(id);
      else selected.delete(id);
      updateBar();
    }

    function attach(){
      boxes = collectCheckboxes();
      boxes.forEach(function(chk){
        chk.classList.add('cargo-checkbox');
        if(!chk.dataset.id) chk.dataset.id = 'auto-' + Math.random().toString(36).slice(2,9);
        chk.removeEventListener('change', onCheckboxChange);
        chk.addEventListener('change', onCheckboxChange);
      });
    }

    attach();

    clearBtn.addEventListener('click', function(){
      selected.forEach(function(id){
        var ch = document.querySelector('input.cargo-checkbox[data-id="'+id+'"]');
        if(ch){ ch.checked = false; }
      });
      selected.clear();
      updateBar();
    });

    var observer = new MutationObserver(function(mutations){
      setTimeout(function(){ attach(); }, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    updateBar();
  });
})();
