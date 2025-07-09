// app.js — Вся логика SPA и взаимодействия с API

// Проверка наличия Telegram WebApp API
function getTelegramUser() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

function showAccountInfo(user) {
  document.getElementById('tg-id').textContent = user.id;
  document.getElementById('tg-name').textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
  document.getElementById('account-status').textContent = 'Аккаунт создан и активен';
}

function createAccountIfNeeded(user) {
  fetch('https://store-backend-zpkh.onrender.com/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: user.id,
      name: user.first_name + (user.last_name ? ' ' + user.last_name : '')
    })
  })
  .then(res => res.json())
  .then(data => {
    loadHistory(user.id);
    loadFavorites(user.id);
  })
  .catch(() => {
    document.getElementById('account-status').textContent = 'Ошибка создания аккаунта';
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5);
}

function getBackendFileUrl(type, filename) {
  if (!filename) return '';
  return `https://store-backend-zpkh.onrender.com/${type}/${encodeURIComponent(filename.replace(/^.*[\\/]/, ''))}`;
}

async function loadHistory(telegramId) {
  const list = document.getElementById('history-list');
  list.innerHTML = '<div style="color:#888;text-align:center;">Загрузка...</div>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/account/' + telegramId + '/history');
    let data = await res.json();
    const unique = {};
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      if (!unique[item.productId]) unique[item.productId] = item;
    }
    data = Object.values(unique).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (data && data.length) {
      const productsRes = await fetch('https://store-backend-zpkh.onrender.com/products');
      const products = await productsRes.json();
      list.innerHTML = data.map(item => {
        const prod = products.find(p=>p.id===item.productId);
        if (!prod) return '';
        const imageUrl = prod.image ? getBackendFileUrl('images', prod.image) : 'images/placeholder.png';
        const ext = prod.file ? prod.file.split('.').pop().toLowerCase() : '';
        let icon = '';
        if (["pdf"].includes(ext)) icon = '📄';
        else if (["zip","rar","7z"].includes(ext)) icon = '🗜️';
        else if (["doc","docx","txt","rtf"].includes(ext)) icon = '📝';
        else if (["xls","xlsx","csv"].includes(ext)) icon = '📊';
        else if (["png","jpg","jpeg","gif","bmp","webp"].includes(ext)) icon = '🖼️';
        else if (["blend","obj","fbx","stl"].includes(ext)) icon = '🧩';
        else icon = '📦';
        let extra = '';
        if (!item.expired && item.daysLeft <= 2) extra = `<div style=\"color:#e67e22;font-size:0.97em;\">Внимание: доступ истекает через ${item.daysLeft} ${item.daysLeft===1?'день':'дня'}!</div>`;
        if (item.expired) extra = '<div style="color:#aaa;font-size:0.97em;">Доступ истёк. <a href="#" onclick="showProduct(\''+prod.id+'\');return false;" style="color:#00916e;text-decoration:underline;">Купить снова</a></div>';
        return `<div class="product" style="display:flex;align-items:center;gap:12px;margin-bottom:14px;background:${item.expired?'#f4f4f4':'#fff'};padding:10px 8px;border-radius:12px;box-shadow:0 2px 8px #0001;opacity:${item.expired?'0.6':'1'};">
          <img src="${imageUrl}" alt="img" style="width:48px;height:48px;object-fit:cover;border-radius:8px;filter:${item.expired?'grayscale(1)':''};">
          <div style="flex:1;">
            <b>${prod.name}</b><br>
            <span style="color:#888;font-size:0.98em;">${icon} ${prod.file ? prod.file.split('/').pop() : ''}</span><br>
            <span style="color:#43e97b;font-size:0.97em;">${formatDate(item.date)}</span>
            ${extra}
          </div>
          <a href="#" onclick="showProduct('${prod.id}');return false;" style="color:#00916e;font-size:1.3em;margin-right:8px;" title="К товару">🔎</a>
          ${prod.file && !item.expired ? `<button onclick="downloadFile('${prod.id}')" style="background:#00916e;color:#fff;border:none;border-radius:8px;padding:7px 13px;cursor:pointer;font-size:1em;">⬇️</button>` : ''}
        </div>`;
      }).join('') + '<div style="color:#888;font-size:0.98em;margin-top:8px;">* Доступ к скачиванию купленного товара открыт 7 дней после покупки</div>';
    } else {
      list.innerHTML = '<div style="color:#888;text-align:center;">Нет покупок или скачиваний.</div>';
    }
  } catch {
    list.textContent = 'Ошибка загрузки истории.';
  }
}

async function downloadFile(productId) {
  if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe || !window.Telegram.WebApp.initDataUnsafe.user) {
    alert('Откройте через Telegram'); return;
  }
  const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
  const resp = await fetch('https://store-backend-zpkh.onrender.com/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, productId })
  });
  const data = await resp.json();
  if (resp.ok && data.url) {
    const link = document.createElement('a');
    link.href = data.url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert(data.error || 'Ошибка скачивания.');
  }
}

async function loadFavorites(telegramId) {
  const list = document.getElementById('favorites-list');
  list.innerHTML = '<div style="color:#888;text-align:center;">Загрузка...</div>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/account/' + telegramId + '/favorites');
    const data = await res.json();
    if (data && data.length) {
      list.innerHTML = data.map(prod => {
        const imageUrl = prod.image ? getBackendFileUrl('images', prod.image) : 'images/placeholder.png';
        const ext = prod.file ? prod.file.split('.').pop().toLowerCase() : '';
        let icon = '';
        if (["pdf"].includes(ext)) icon = '📄';
        else if (["zip","rar","7z"].includes(ext)) icon = '🗜️';
        else if (["doc","docx","txt","rtf"].includes(ext)) icon = '📝';
        else if (["xls","xlsx","csv"].includes(ext)) icon = '📊';
        else if (["png","jpg","jpeg","gif","bmp","webp"].includes(ext)) icon = '🖼️';
        else if (["blend","obj","fbx","stl"].includes(ext)) icon = '🧩';
        else icon = '📦';
        return `<div class="product" style="display:flex;align-items:center;gap:12px;margin-bottom:14px;background:#fff;padding:10px 8px;border-radius:12px;box-shadow:0 2px 8px #0001;">
          <img src="${imageUrl}" alt="img" style="width:48px;height:48px;object-fit:cover;border-radius:8px;">
          <div style="flex:1;">
            <b>${prod.name}</b><br>
            <span style="color:#888;font-size:0.98em;">${icon} ${prod.file ? prod.file.split('/').pop() : ''}</span>
          </div>
          <a href="#" onclick="showProduct('${prod.id}');return false;" style="color:#00916e;font-size:1.3em;margin-right:8px;" title="К товару">🔎</a>
          ${prod.file ? `<button onclick="downloadFile('${prod.id}')" style="background:#00916e;color:#fff;border:none;border-radius:8px;padding:7px 13px;cursor:pointer;font-size:1em;">⬇️</button>` : ''}
        </div>`;
      }).join('');
    } else {
      list.textContent = 'Нет избранных товаров.';
    }
  } catch {
    list.textContent = 'Ошибка загрузки избранного.';
  }
}

function showToast(msg, color) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = color || '#222';
  toast.style.display = 'block';
  toast.style.opacity = '0.97';
  setTimeout(()=>{ toast.style.opacity = '0'; }, 2200);
  setTimeout(()=>{ toast.style.display = 'none'; }, 2600);
}

let lastBalance = null;
async function updateBalance(telegramId, showToastOnChange) {
  const balanceBlock = document.getElementById('balance-block');
  if (!telegramId) return;
  try {
    const resp = await fetch(`https://store-backend-zpkh.onrender.com/account/${telegramId}/balance`);
    const data = await resp.json();
    if (resp.ok) {
      balanceBlock.style.display = '';
      balanceBlock.innerHTML = `<span style='color:#f9b32b;font-weight:600;'>Баланс: </span><span id='balance-value' style='color:#222;font-weight:700;'>${data.balance.toLocaleString()} ₽</span> <button id='topup-btn' style='margin-left:8px;padding:4px 12px;border-radius:8px;background:#fff;color:#f9b32b;border:1px solid #f9b32b;cursor:pointer;font-size:0.98em;'>Пополнить</button>`;
      if (lastBalance !== null && data.balance !== lastBalance && showToastOnChange) {
        showToast('Баланс обновлён!', '#43e97b');
      }
      lastBalance = data.balance;
      document.getElementById('topup-btn').onclick = function() {
        document.getElementById('topup-modal').style.display = 'flex';
        document.getElementById('topup-amount').value = '';
        document.getElementById('topup-error').textContent = '';
        document.getElementById('topup-check').style.display = 'none';
      };
      document.getElementById('topup-close').onclick = function() {
        document.getElementById('topup-modal').style.display = 'none';
      };
      document.getElementById('topup-check').onclick = function() {
        updateBalance(telegramId, true);
      };
      document.getElementById('topup-confirm').onclick = async function() {
        const sum = document.getElementById('topup-amount').value.trim();
        const amount = Number(sum);
        const system = document.getElementById('topup-system').value;
        const errorDiv = document.getElementById('topup-error');
        if (!amount || isNaN(amount) || amount <= 0) {
          errorDiv.textContent = 'Введите корректную сумму';
          return;
        }
        errorDiv.textContent = '';
        document.getElementById('topup-confirm').disabled = true;
        document.getElementById('topup-confirm').textContent = 'Создание платежа...';
        try {
          const resp = await fetch(`https://store-backend-zpkh.onrender.com/create_payment_link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, telegramId, system })
          });
          const data = await resp.json();
          if (resp.ok && data.url) {
            window.open(data.url, '_blank');
            document.getElementById('topup-modal').style.display = 'flex';
            document.getElementById('topup-check').style.display = '';
            showToast('После оплаты нажмите "Проверить баланс"', '#f9b32b');
          } else {
            errorDiv.textContent = data.error || 'Ошибка создания платежа';
          }
        } catch {
          errorDiv.textContent = 'Ошибка соединения с сервером';
        }
        document.getElementById('topup-confirm').disabled = false;
        document.getElementById('topup-confirm').textContent = 'Пополнить';
      };
    }
  } catch {}
}

function showPage(pageId) {
  document.querySelectorAll('.spa-page').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = '';
  document.querySelectorAll('#bottom-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  let idx = ['main-page','profile-page','settings-page'].indexOf(pageId);
  if (idx >= 0) document.querySelectorAll('#bottom-tabs .tab-btn')[idx].classList.add('active');
  if (pageId === 'main-page') {
    renderProducts();
    renderCategories();
    updateBalance(getTelegramUser()?.id);
  }
  if (pageId === 'category-page') {
    renderCategories(true);
    if(window._currentCategoryId) {
      updateCategoryTitle(window._currentCategoryId);
      loadCategory(window._currentCategoryId);
    }
  }
  if (pageId === 'account-page') {
    const user = getTelegramUser();
    if (user) {
      showAccountInfo(user);
      loadHistory(user.id);
      loadFavorites(user.id);
      updateBalance(user.id);
    }
  }
  if (pageId === 'admin-page') {
    renderAdmin();
  }
  if (pageId === 'product-page') {
    if(window._currentProductId) {
      loadProduct(window._currentProductId);
    }
  }
  document.getElementById('balance-block').style.display = (pageId === 'home-page' || pageId === 'account-page') ? '' : 'none';
  if (!window._spaNavSilent) {
    history.pushState({pageId}, '', '#' + pageId);
  }
}

window.onpopstate = function(e) {
  if (e.state && e.state.pageId) {
    window._spaNavSilent = true;
    showPage(e.state.pageId);
    window._spaNavSilent = false;
  }
};

function setupFilters() {
  document.getElementById('search-input').addEventListener('input', renderProducts);
  document.getElementById('category-filter').addEventListener('change', renderProducts);
  document.getElementById('sort-select').addEventListener('change', renderProducts);
  document.getElementById('free-filter').addEventListener('change', renderProducts);
}
window.addEventListener('DOMContentLoaded', function() {
  tryInitAccount();
  setupFilters();
});

async function renderProducts() {
  const list = document.getElementById('product-list');
  list.innerHTML = '<div style="color:#888;text-align:center;">Загрузка...</div>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/products');
    let products = await res.json();
    products = products.sort(() => Math.random() - 0.5);
    const search = document.getElementById('search-input').value.trim().toLowerCase();
    const cat = document.getElementById('category-filter').value;
    const free = document.getElementById('free-filter').checked;
    if (search) products = products.filter(p => p.name.toLowerCase().includes(search));
    if (cat) products = products.filter(p => p.category === cat);
    if (free) products = products.filter(p => p.price === 0);
    const sort = document.getElementById('sort-select').value;
    if (sort === 'price-asc') products.sort((a,b)=>a.price-b.price);
    if (sort === 'price-desc') products.sort((a,b)=>b.price-a.price);
    if (sort === 'name-asc') products.sort((a,b)=>a.name.localeCompare(b.name));
    if (sort === 'name-desc') products.sort((a,b)=>b.name.localeCompare(a.name));
    if (!products.length) {
      list.innerHTML = '<div style="color:#888;text-align:center;">Нет товаров.</div>';
      return;
    }
    list.innerHTML = products.map(prod => {
      const imageUrl = prod.image ? getBackendFileUrl('images', prod.image) : 'images/placeholder.png';
      return `<div class="product-card" onclick="showProduct('${prod.id}')">
        <div class="product-card-img-wrap">
          <img src="${imageUrl}" alt="img" class="product-card-img">
        </div>
        <div class="product-card-body">
          <div class="product-card-title">${prod.name}</div>
          <div class="product-card-price">${prod.price ? prod.price + ' ₽' : 'Бесплатно'}</div>
        </div>
        <button class="product-card-btn">Подробнее</button>
      </div>`;
    }).join('');
  } catch {
    list.textContent = 'Ошибка загрузки товаров.';
  }
}

async function renderCategories(forPage = false) {
  const list = forPage ? document.getElementById('category-products') : document.getElementById('category-list');
  list.innerHTML = '<li style="color:#888;">Загрузка...</li>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/categories');
    const cats = await res.json();
    if (!cats.length) {
      list.innerHTML = '<li style="color:#888;">Нет категорий.</li>';
      return;
    }
    if (forPage) {
      list.innerHTML = cats.map(cat =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer;background:#f8fdfd;padding:10px 12px;border-radius:10px;box-shadow:0 2px 8px #0001;" onclick="showCategory('${cat.id}')">
          <span style="font-size:1.5em;">📂</span>
          <span style="font-weight:600;">${cat.name}</span>
        </div>`
      ).join('');
    } else {
      list.innerHTML = cats.map(cat =>
        `<li style="margin-bottom:7px;cursor:pointer;" onclick="showCategory('${cat.id}')">${cat.name}</li>`
      ).join('');
      const sel = document.getElementById('category-filter');
      sel.innerHTML = '<option value="">Все категории</option>' + cats.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
      ).join('');
    }
  } catch {
    list.innerHTML = '<li style="color:#888;">Ошибка загрузки категорий.</li>';
  }
}

function showCategory(categoryId) {
  window._currentCategoryId = categoryId;
  showPage('category-page');
  updateCategoryTitle(categoryId);
  loadCategory(categoryId);
}

async function updateCategoryTitle(categoryId) {
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/categories');
    const cats = await res.json();
    const cat = cats.find(c => c.id === categoryId);
    document.getElementById('category-title').textContent = cat ? cat.name : 'Категория';
  } catch {
    document.getElementById('category-title').textContent = 'Категория';
  }
}

async function loadCategory(categoryId) {
  const list = document.getElementById('category-products');
  list.innerHTML = '<div style="color:#888;text-align:center;">Загрузка...</div>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/products');
    let products = await res.json();
    products = products.filter(p => p.category === categoryId);
    const sort = document.getElementById('category-sort').value;
    if (sort === 'price-asc') products.sort((a,b)=>a.price-b.price);
    if (sort === 'price-desc') products.sort((a,b)=>b.price-a.price);
    if (sort === 'date-asc') products.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    if (sort === 'date-desc') products.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if (!products.length) {
      list.innerHTML = '<div style="color:#888;text-align:center;">Нет товаров в категории.</div>';
      return;
    }
    list.innerHTML = products.map(prod => {
      const imageUrl = prod.image ? getBackendFileUrl('images', prod.image) : 'images/placeholder.png';
      return `<div class="category-product-card" style="width:220px;max-width:95vw;background:#fff;border-radius:14px;box-shadow:0 2px 12px #0001;padding:12px 10px 10px 10px;display:flex;flex-direction:column;align-items:center;cursor:pointer;margin-bottom:10px;" onclick="showProduct('${prod.id}')">
        <div style="width:100px;height:100px;overflow:hidden;border-radius:10px;background:#f8fdfd;display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
          <img src="${imageUrl}" alt="img" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;">
        </div>
        <div style="font-weight:600;text-align:center;font-size:1.08em;color:#00916e;">${prod.name}</div>
        <div style="color:#888;font-size:0.98em;margin:4px 0 0 0;">${prod.price ? prod.price + ' ₽' : 'Бесплатно'}</div>
        <div style="color:#444;font-size:0.97em;margin:4px 0 0 0;">${prod.description ? prod.description.slice(0, 60) + (prod.description.length > 60 ? '…' : '') : ''}</div>
      </div>`;
    }).join('');
  } catch {
    list.textContent = 'Ошибка загрузки товаров.';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const sortSel = document.getElementById('category-sort');
  if (sortSel) {
    sortSel.addEventListener('change', function() {
      if (window._currentCategoryId) loadCategory(window._currentCategoryId);
    });
  }
});

// === SPA: Делегирование событий для навигации и модалок ===
document.addEventListener('DOMContentLoaded', function() {
  // Навигация по вкладкам
  document.getElementById('bottom-tabs').addEventListener('click', function(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn && btn.dataset.page) {
      showPage(btn.dataset.page);
    }
  });

  // Открытие/закрытие модалок по id-кнопкам
  // История операций
  const historyBtn = document.getElementById('balance-history-btn');
  if (historyBtn) {
    historyBtn.addEventListener('click', function() {
      document.getElementById('modal-history').style.display = 'flex';
      // Подгрузить историю операций
      loadHistoryModal();
    });
  }
  const historyClose = document.getElementById('history-close');
  if (historyClose) {
    historyClose.addEventListener('click', function() {
      document.getElementById('modal-history').style.display = 'none';
    });
  }
  // История бонусов
  const bonusHistoryBtn = document.getElementById('bonus-history-btn');
  if (bonusHistoryBtn) {
    bonusHistoryBtn.addEventListener('click', function() {
      document.getElementById('modal-bonus-history').style.display = 'flex';
      loadBonusHistoryModal();
    });
  }
  const bonusHistoryClose = document.getElementById('bonus-history-close');
  if (bonusHistoryClose) {
    bonusHistoryClose.addEventListener('click', function() {
      document.getElementById('modal-bonus-history').style.display = 'none';
    });
  }
  // Пополнение баланса
  const topupBtn = document.getElementById('balance-topup-btn');
  if (topupBtn) {
    topupBtn.addEventListener('click', function() {
      document.getElementById('modal-topup').style.display = 'flex';
    });
  }
  const topupClose = document.getElementById('topup-close');
  if (topupClose) {
    topupClose.addEventListener('click', function() {
      document.getElementById('modal-topup').style.display = 'none';
    });
  }
  // Вывод средств
  const withdrawBtn = document.getElementById('balance-withdraw-btn');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', function() {
      document.getElementById('modal-withdraw').style.display = 'flex';
    });
  }
  const withdrawClose = document.getElementById('withdraw-close');
  if (withdrawClose) {
    withdrawClose.addEventListener('click', function() {
      document.getElementById('modal-withdraw').style.display = 'none';
    });
  }
  // Модалка товара (открытие по клику на карточку товара)
  document.body.addEventListener('click', function(e) {
    const card = e.target.closest('.product-card');
    if (card && card.dataset.productId) {
      document.getElementById('modal-product').style.display = 'flex';
      loadProductModal(card.dataset.productId);
    }
  });
  const productClose = document.getElementById('product-close');
  if (productClose) {
    productClose.addEventListener('click', function() {
      document.getElementById('modal-product').style.display = 'none';
    });
  }
});

// --- Модальные окна: функции подгрузки данных ---
function loadHistoryModal() {
  const user = getTelegramUser();
  const body = document.getElementById('modal-history-body');
  if (!user) { body.textContent = 'Авторизуйтесь через Telegram.'; return; }
  body.innerHTML = '<div style="color:#888;text-align:center;">Загрузка...</div>';
  fetch('https://store-backend-zpkh.onrender.com/account/' + user.id + '/history')
    .then(res => res.json())
    .then(data => {
      if (!data.length) { body.textContent = 'Нет операций.'; return; }
      body.innerHTML = data.map(item => `<div>${item.type} — ${item.amount} ₽ — ${item.date}</div>`).join('');
    })
    .catch(()=>{ body.textContent = 'Ошибка загрузки.'; });
}
function loadBonusHistoryModal() {
  const user = getTelegramUser();
  const body = document.getElementById('modal-bonus-history-body');
  if (!user) { body.textContent = 'Авторизуйтесь через Telegram.'; return; }
  body.innerHTML = '<div style="color:#888;text-align:center;">Загрузка...</div>';
  fetch('https://store-backend-zpkh.onrender.com/account/' + user.id + '/bonus-history')
    .then(res => res.json())
    .then(data => {
      if (!data.length) { body.textContent = 'Нет бонусных операций.'; return; }
      body.innerHTML = data.map(item => `<div>${item.type} — ${item.amount} — ${item.date}</div>`).join('');
    })
    .catch(()=>{ body.textContent = 'Ошибка загрузки.'; });
}
function loadProductModal(productId) {
  const body = document.getElementById('modal-product-body');
  body.innerHTML = '<div style="color:#888;text-align:center;">Загрузка...</div>';
  fetch('https://store-backend-zpkh.onrender.com/products/' + productId)
    .then(res => res.json())
    .then(prod => {
      if (!prod || !prod.id) { body.textContent = 'Товар не найден.'; return; }
      body.innerHTML = `<div><b>${prod.name}</b><br>Цена: ${prod.price} ₽<br>${prod.description || ''}</div>`;
    })
    .catch(()=>{ body.textContent = 'Ошибка загрузки.'; });
}

// --- Универсальное управление модалками и SPA-секциями ---
function showModal(id) {
  closeAllModals();
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 220);
    document.body.classList.remove('modal-open');
  }
}
function closeAllModals() {
  document.querySelectorAll('.modal.active').forEach(m => {
    m.classList.remove('active');
    setTimeout(() => { m.style.display = 'none'; }, 220);
  });
  document.body.classList.remove('modal-open');
}
// Закрытие по Esc и клику по фону
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllModals();
});
document.addEventListener('click', e => {
  const modal = e.target.closest('.modal');
  if (modal && e.target === modal) closeAllModals();
});
// Делегирование открытия/закрытия модалок по data-атрибутам
// <button data-modal-open="modal-id">...</button> <button data-modal-close>...</button>
document.addEventListener('click', e => {
  const openBtn = e.target.closest('[data-modal-open]');
  if (openBtn) {
    showModal(openBtn.getAttribute('data-modal-open'));
    return;
  }
  const closeBtn = e.target.closest('[data-modal-close]');
  if (closeBtn) {
    closeAllModals();
    return;
  }
});
// --- Улучшение SPA-переходов: закрытие модалок, сброс скролла ---
const origShowPage = window.showPage;
window.showPage = function(pageId) {
  closeAllModals();
  document.querySelectorAll('.spa-page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    window.scrollTo(0,0);
  }
  document.querySelectorAll('#bottom-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  let idx = ['main-page','profile-page','settings-page'].indexOf(pageId);
  if (idx >= 0) document.querySelectorAll('#bottom-tabs .tab-btn')[idx].classList.add('active');
  if (pageId === 'main-page') {
    renderProducts();
    renderCategories();
    updateBalance(getTelegramUser()?.id);
  }
  if (pageId === 'category-page') {
    renderCategories(true);
    if(window._currentCategoryId) {
      updateCategoryTitle(window._currentCategoryId);
      loadCategory(window._currentCategoryId);
    }
  }
  if (pageId === 'account-page') {
    const user = getTelegramUser();
    if (user) {
      showAccountInfo(user);
      loadHistory(user.id);
      loadFavorites(user.id);
      updateBalance(user.id);
    }
  }
  if (pageId === 'admin-page') {
    renderAdmin();
  }
  if (pageId === 'product-page') {
    if(window._currentProductId) {
      loadProduct(window._currentProductId);
    }
  }
  document.getElementById('balance-block').style.display = (pageId === 'home-page' || pageId === 'account-page') ? '' : 'none';
  if (!window._spaNavSilent) {
    history.pushState({pageId}, '', '#' + pageId);
  }
};