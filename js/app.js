// --- Генерация карточки товара с поддержкой скелетона ---
function renderProductCard(prod, opts = {}) {
  const imageUrl = prod.image ? `https://store-backend-zpkh.onrender.com/images/${encodeURIComponent(prod.image)}` : 'images/placeholder.png';
  // skeletonId нужен для уникальности скелетона
  const skeletonId = `skeleton-${prod.id || Math.random().toString(36).slice(2)}`;
  return `<div class="product-card${opts.my ? ' my-product-card' : ''}${opts.moderation ? ' moderation-card' : ''}" data-product-id="${prod.id}">
    <div class="product-card-img-wrap" style="position:relative;">
      <div class="img-skeleton" id="${skeletonId}"></div>
      <img src="${imageUrl}" alt="img" class="product-card-img" style="opacity:0;transition:opacity .2s;" onload="(function(){var s=document.getElementById('${skeletonId}');if(s)s.style.display='none';this.style.opacity=1;}).call(this)">
    </div>
    <div class="product-card-body">
      <div class="product-card-title">${prod.name}</div>
      <div class="product-card-price">${prod.price ? prod.price + ' ₽' : 'Бесплатно'}</div>
      ${opts.status ? `<div class="product-card-status">Статус: <b>${prod.status === 'pending' ? 'На модерации' : prod.status === 'approved' ? 'Одобрено' : 'Отклонено'}</b></div>` : ''}
      ${opts.desc ? `<div class="product-card-desc">${prod.description || ''}</div>` : ''}
      ${opts.owner ? `<div class="product-card-owner">ID пользователя: <b>${prod.ownerId}</b></div>` : ''}
      ${opts.file ? `<div class="product-card-file">Файл: <a href="${prod.fileUrl || '#'}" target="_blank">Скачать</a></div>` : ''}
    </div>
    ${opts.deleteBtn ? `<button class="product-card-btn product-delete-btn" data-id="${prod.id}">Удалить</button>` : `<button class="product-card-btn">Подробнее</button>`}
    ${opts.actions || ''}
  </div>`;
}
// === SPA: Основная логика интернет-магазина ===

// --- Telegram WebApp API ---
function getTelegramUser() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

// --- Toast уведомления ---
function showToast(msg, color) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = color || '#222';
  toast.style.display = 'block';
  toast.style.opacity = '0.97';
  setTimeout(()=>{ toast.style.opacity = '0'; }, 2200);
  setTimeout(()=>{ toast.style.display = 'none'; }, 2600);
}

const adminsID = [6956702448, 5106121080, ]

// --- SPA-навигация ---
function showPage(pageId) {
  document.querySelectorAll('.spa-page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    window.scrollTo(0,0);
  }
  document.querySelectorAll('#bottom-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  const idx = ['main-page','profile-page','settings-page'].indexOf(pageId);
  if (idx >= 0) document.querySelectorAll('#bottom-tabs .tab-btn')[idx].classList.add('active');
}
window.onpopstate = function(e) {
  if (e.state && e.state.pageId) {
    showPage(e.state.pageId);
  }
};
document.getElementById('bottom-tabs').addEventListener('click', function(e) {
  const btn = e.target.closest('.tab-btn');
  if (btn && btn.dataset.page) {
    showPage(btn.dataset.page);
    history.pushState({pageId: btn.dataset.page}, '', '#' + btn.dataset.page);
  }
});

// --- Главная страница: категории и товары ---
async function loadCategories() {
  const list = document.getElementById('main-categories-list');
  list.innerHTML = '<div class="loading">Загрузка...</div>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/categories');
    const cats = await res.json();
    if (!cats.length) {
      list.innerHTML = '<div class="empty">Нет категорий.</div>';
      return;
    }
    list.innerHTML = cats.map(cat =>
      `<div class="category-card" data-category-id="${cat.id}">${cat.name}</div>`
    ).join('');
  } catch {
    list.innerHTML = '<div class="error">Ошибка загрузки категорий.</div>';
  }
}

async function loadProducts(filters = {}) {
  const list = document.getElementById('main-products-list');
  list.innerHTML = '<div class="loading">Загрузка...</div>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/products');
    let products = await res.json();
    if (filters.search) {
      products = products.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()));
    }
    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters.free) {
      products = products.filter(p => p.price === 0);
    }
    if (filters.sort === 'price-asc') products.sort((a,b)=>a.price-b.price);
    if (filters.sort === 'price-desc') products.sort((a,b)=>b.price-a.price);
    if (filters.sort === 'name-asc') products.sort((a,b)=>a.name.localeCompare(b.name));
    if (filters.sort === 'name-desc') products.sort((a,b)=>b.name.localeCompare(a.name));
    if (!products.length) {
      list.innerHTML = '<div class="empty">Нет товаров.</div>';
      return;
    }
    list.innerHTML = products.map(prod => renderProductCard(prod)).join('');
  } catch {
    list.innerHTML = '<div class="error">Ошибка загрузки товаров.</div>';
  }
}

// --- Модалки ---
function showModal(id) {
  closeAllModals();
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
}
function closeAllModals() {
  document.querySelectorAll('.modal.active').forEach(m => {
    m.classList.remove('active');
    setTimeout(() => { m.style.display = 'none'; }, 220);
  });
  document.body.classList.remove('modal-open');
}
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllModals();
});
document.addEventListener('click', e => {
  const modal = e.target.closest('.modal');
  if (modal && e.target === modal) closeAllModals();
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

// --- Главная: поиск, делегирование ---
function updateCategoryFilterOptions() {
  // Заполнить селект категорий для поиска
  const sel = document.getElementById('main-search-category');
  sel.innerHTML = '<option value="">Все категории</option>';
  fetch('https://store-backend-zpkh.onrender.com/categories')
    .then(res => res.json())
    .then(cats => {
      sel.innerHTML += cats.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    });
}
function getSearchFilters() {
  return {
    search: document.getElementById('main-search-input').value.trim(),
    category: document.getElementById('main-search-category').value,
    sort: document.getElementById('main-search-sort').value,
    free: document.getElementById('main-search-free').checked
  };
}
function runProductSearch() {
  const filters = getSearchFilters();
  document.getElementById('main-products-title').style.display = '';
  loadProducts(filters);
}
document.getElementById('main-search-btn').onclick = runProductSearch;
document.getElementById('main-search-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') runProductSearch();
});
document.getElementById('main-search-category').onchange = runProductSearch;
document.getElementById('main-search-sort').onchange = runProductSearch;
document.getElementById('main-search-free').onchange = runProductSearch;
document.getElementById('main-categories-list').addEventListener('click', function(e) {
  const card = e.target.closest('.category-card');
  if (card) {
    const categoryId = card.getAttribute('data-category-id');
    openCategoryPage(categoryId);
  }
});
document.getElementById('main-products-list').addEventListener('click', function(e) {
  const card = e.target.closest('.product-card');
  if (card) {
    const productId = card.getAttribute('data-product-id');
    openProductDetail(productId);
  }
});

// --- Категорийная страница ---
async function openCategoryPage(categoryId) {
  // Создаём/показываем секцию для категории (SPA)
  let catPage = document.getElementById('category-page');
  if (!catPage) {
    catPage = document.createElement('div');
    catPage.id = 'category-page';
    catPage.className = 'spa-page';
    catPage.innerHTML = `
      <section class="category-header">
        <button id="category-back-btn">← Назад</button>
        <h2 id="category-title">Категория</h2>
      </section>
      <div id="category-products-list" class="products-list"></div>
    `;
    document.body.appendChild(catPage);
  }
  // Скрыть все страницы, показать категорию
  document.querySelectorAll('.spa-page').forEach(p => p.classList.remove('active'));
  catPage.classList.add('active');
  window.scrollTo(0,0);
  // Название категории
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/categories');
    const cats = await res.json();
    const cat = cats.find(c => c.id === categoryId);
    document.getElementById('category-title').textContent = cat ? cat.name : 'Категория';
  } catch {
    document.getElementById('category-title').textContent = 'Категория';
  }
  // Загрузка товаров категории
  const list = document.getElementById('category-products-list');
  list.innerHTML = '<div class="loading">Загрузка...</div>';
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/products');
    let products = await res.json();
    products = products.filter(p => p.category === categoryId);
    if (!products.length) {
      list.innerHTML = '<div class="empty">Нет товаров в категории.</div>';
      return;
    }
  list.innerHTML = products.map(prod => renderProductCard(prod)).join('');
  } catch {
    list.innerHTML = '<div class="error">Ошибка загрузки товаров.</div>';
  }
  // Назад
  document.getElementById('category-back-btn').onclick = function() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      showPage('main-page');
    }
  };
  // Открытие товара из категории
  list.onclick = function(e) {
    const card = e.target.closest('.product-card');
    if (card) {
      const productId = card.getAttribute('data-product-id');
      openProductDetail(productId);
    }
  };
// --- Подробная карточка товара ---
async function openProductDetail(productId) {
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/products');
    const products = await res.json();
    const product = products.find(p => p.id == productId);
    if (!product) return showToast('Товар не найден', '#e94e43');
    // Получить владельца
    let owner = null;
    if (product.ownerId) {
      const userRes = await fetch('https://store-backend-zpkh.onrender.com/accounts/' + product.ownerId);
      if (userRes.ok) owner = await userRes.json();
    }
    // Получить отзывы и рейтинг
    let reviews = [];
    let rating = '-';
    try {
      const revRes = await fetch('https://store-backend-zpkh.onrender.com/reviews/' + product.ownerId);
      if (revRes.ok) {
        reviews = await revRes.json();
        if (reviews.length) {
          const avg = reviews.reduce((s, r) => s + (r.rating||0), 0) / reviews.length;
          rating = avg.toFixed(2) + ' / 5';
        }
      }
    } catch {}
    // Получить вес файла
    let fileSize = '';
    if (product.fileUrl) {
      try {
        const head = await fetch(product.fileUrl, { method: 'HEAD' });
        const size = head.headers.get('content-length');
        if (size) fileSize = (Number(size)/1024/1024).toFixed(2) + ' МБ';
      } catch {}
    }
    // Сформировать HTML
    let html = `<div class="product-detail-modal">
      <img src="${product.image ? `https://store-backend-zpkh.onrender.com/images/${encodeURIComponent(product.image)}` : 'images/placeholder.png'}" class="product-detail-image-modal" alt="img">
      <h2>${product.name}</h2>
      <div class="product-detail-price">${product.price ? product.price + ' ₽' : 'Бесплатно'}</div>
      <div class="product-detail-description">${product.description||''}</div>
      <div class="product-detail-meta">
        <div>Владелец: <b>${owner ? (owner.name||owner.telegram_id||'—') : '—'}</b></div>
        <div>Рейтинг: <b>${rating}</b></div>
        <div>Вес файла: <b>${fileSize||'—'}</b></div>
        <div><a href="https://t.me/${owner && owner.username ? owner.username : ''}" target="_blank" class="chat-link">Чат с продавцом</a></div>
      </div>
      <div class="product-detail-actions-modal">
        ${product.price > 0 ? `<button class="modal-btn modal-btn-main" id="modal-buy-btn">Купить</button>` : `<button class="modal-btn modal-btn-main" id="modal-download-btn">Скачать бесплатно</button>`}
      </div>
      <div class="product-reviews">
        <h3>Отзывы (${reviews.length})</h3>
        <div>${reviews.length ? reviews.map(r => `<div class="review"><b>${r.buyerName||'Покупатель'}</b>: <span>${'★'.repeat(r.rating||0)}${'☆'.repeat(5-(r.rating||0))}</span> <span>${r.text||''}</span></div>`).join('') : 'Нет отзывов.'}</div>
      </div>
      <div id="review-block"></div>
    </div>`;
    // Показать в модалке
    const modal = document.getElementById('modal-product');
    document.getElementById('modal-product-body').innerHTML = html;
    showModal('modal-product');
    // Кнопка купить/скачать
    if (product.price > 0) {
      document.getElementById('modal-buy-btn').onclick = function() {
        showToast('Покупка: в разработке', '#43e97b');
      };
    } else {
      document.getElementById('modal-download-btn').onclick = function() {
        window.open(product.fileUrl, '_blank');
      };
    }
    // Если пользователь купил — показать форму отзыва
    const user = getTelegramUser && getTelegramUser();
    if (user && await userHasBoughtProduct(user.id, product.id)) {
      renderReviewForm(product.ownerId, product.id, user);
    }
  } catch (e) {
    showToast('Ошибка загрузки товара', '#e94e43');
  }
}

// Проверка: покупал ли пользователь товар
async function userHasBoughtProduct(userId, productId) {
  try {
    const res = await fetch('https://store-backend-zpkh.onrender.com/account/' + userId + '/history');
    if (!res.ok) return false;
    const history = await res.json();
    return history.some(h => h.productId == productId);
  } catch { return false; }
}

// Рендер формы отзыва
function renderReviewForm(ownerId, productId, user) {
  const block = document.getElementById('review-block');
  if (!block) return;
  block.innerHTML = `<div class="review-form">
    <h4>Оставить отзыв о продавце</h4>
    <form id="review-form">
      <label>Оценка:
        <select name="rating" required>
          <option value="">—</option>
          <option value="5">5 ★</option>
          <option value="4">4 ★</option>
          <option value="3">3 ★</option>
          <option value="2">2 ★</option>
          <option value="1">1 ★</option>
        </select>
      </label>
      <label>Комментарий:
        <textarea name="text" maxlength="500" required placeholder="Ваш отзыв"></textarea>
      </label>
      <button type="submit" class="modal-btn modal-btn-main">Отправить</button>
    </form>
  </div>`;
  document.getElementById('review-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const rating = Number(form.rating.value);
    const text = form.text.value.trim();
    if (!rating || !text) return showToast('Заполните все поля', '#e94e43');
    const res = await fetch('https://store-backend-zpkh.onrender.com/reviews/' + ownerId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, buyerId: user.id, buyerName: user.first_name, rating, text })
    });
    if (res.ok) {
      showToast('Спасибо за отзыв!', '#43e97b');
      block.innerHTML = '<div class="success">Отзыв отправлен.</div>';
    } else {
      showToast('Ошибка отправки отзыва', '#e94e43');
    }
  };
}
}

// --- Профиль: автозаполнение из Telegram ---
function fillProfileFromTelegram() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    const user = window.Telegram.WebApp.initDataUnsafe.user;
    document.getElementById('profile-name').textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
    document.getElementById('profile-tg-id').textContent = user.id;
    if (user.photo_url) {
      document.getElementById('profile-avatar').src = user.photo_url;
    }
  }
}

// --- Инициализация SPA ---
document.addEventListener('DOMContentLoaded', function() {
  // --- ТЕМЫ: логика смены темы и пользовательской темы ---
  const THEME_KEYS = ['light','dark','newyear','spring','custom'];
  function applyTheme(theme, customVars) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'custom' && customVars) {
      for (const key in customVars) {
        document.documentElement.style.setProperty(key, customVars[key]);
      }
    } else {
      // Сбросить кастомные переменные
      const style = document.documentElement.style;
      style.removeProperty('--color-bg');
      style.removeProperty('--color-bg-gradient');
      style.removeProperty('--color-text');
      style.removeProperty('--color-primary');
      style.removeProperty('--color-primary-dark');
      style.removeProperty('--color-accent');
      style.removeProperty('--color-card-bg');
      style.removeProperty('--color-card-shadow');
      style.removeProperty('--color-border');
      style.removeProperty('--color-error');
      style.removeProperty('--color-success');
      style.removeProperty('--color-footer-bg');
      style.removeProperty('--color-footer-text');
      style.removeProperty('--color-modal-bg');
      style.removeProperty('--color-modal-shadow');
      style.removeProperty('--color-toast-bg');
      style.removeProperty('--color-toast-text');
    }
  }
  function saveTheme(theme, customVars) {
    localStorage.setItem('site-theme', theme);
    if (theme === 'custom' && customVars) {
      localStorage.setItem('site-theme-custom', JSON.stringify(customVars));
    }
  }
  function loadTheme() {
    let theme = localStorage.getItem('site-theme') || 'light';
    let customVars = null;
    if (theme === 'custom') {
      try {
        customVars = JSON.parse(localStorage.getItem('site-theme-custom') || '{}');
      } catch {}
    }
    applyTheme(theme, customVars);
    // выставить select
    const selects = [document.getElementById('theme-select'), document.getElementById('settings-theme-select')];
    selects.forEach(sel => { if(sel) sel.value = theme; });
  }
  // Смена темы по select
  ['theme-select','settings-theme-select'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) {
      sel.addEventListener('change', function() {
        const theme = sel.value;
        if (theme === 'custom') {
          openCustomThemeModal();
        } else {
          applyTheme(theme);
          saveTheme(theme);
        }
        // синхронизировать оба select
        const other = document.getElementById(id === 'theme-select' ? 'settings-theme-select' : 'theme-select');
        if (other) other.value = theme;
      });
    }
  });
  // Модалка создания своей темы
  function openCustomThemeModal() {
    let modal = document.getElementById('modal-custom-theme');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-custom-theme';
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content">
          <button class="modal-close" id="custom-theme-close">×</button>
          <h2>Своя тема</h2>
          <form id="custom-theme-form">
            <label>Фон (градиент): <input type="text" name="--color-bg-gradient" value="" placeholder="linear-gradient(...)" /></label><br>
            <label>Цвет текста: <input type="color" name="--color-text" value="#222222" /></label><br>
            <label>Основной цвет: <input type="color" name="--color-primary" value="#43e97b" /></label><br>
            <label>Акцент: <input type="color" name="--color-accent" value="#00b894" /></label><br>
            <label>Фон карточек: <input type="color" name="--color-card-bg" value="#ffffff" /></label><br>
            <label>Тень карточек: <input type="color" name="--color-card-shadow" value="#43e97b22" /></label><br>
            <label>Цвет ошибок: <input type="color" name="--color-error" value="#e94e43" /></label><br>
            <label>Цвет успеха: <input type="color" name="--color-success" value="#43e97b" /></label><br>
            <label>Фон футера: <input type="color" name="--color-footer-bg" value="#e0f7fa" /></label><br>
            <label>Текст футера: <input type="color" name="--color-footer-text" value="#00916e" /></label><br>
            <button type="submit" class="modal-btn modal-btn-main">Сохранить</button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.classList.add('active');
      modal.style.display = 'flex';
    }
    document.body.classList.add('modal-open');
    // Закрытие
    modal.querySelector('#custom-theme-close').onclick = function() {
      modal.classList.remove('active');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    };
    // Заполнить текущие значения
    let customVars = {};
    try { customVars = JSON.parse(localStorage.getItem('site-theme-custom') || '{}'); } catch {}
    const form = modal.querySelector('#custom-theme-form');
    Array.from(form.elements).forEach(el => {
      if (el.name && customVars[el.name]) el.value = customVars[el.name];
    });
    // Сохранение
    form.onsubmit = function(e) {
      e.preventDefault();
      const data = {};
      Array.from(form.elements).forEach(el => {
        if (el.name && el.value) data[el.name] = el.value;
      });
      applyTheme('custom', data);
      saveTheme('custom', data);
      modal.classList.remove('active');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      // синхронизировать select
      const selects = [document.getElementById('theme-select'), document.getElementById('settings-theme-select')];
      selects.forEach(sel => { if(sel) sel.value = 'custom'; });
    };
  }
  // Кнопки "Изменить/Создать свою тему"
  ['theme-edit-btn','settings-theme-edit-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = openCustomThemeModal;
  });
  // Применить тему при загрузке
  loadTheme();
  // --- Мои товары: загрузка и фильтрация ---
  async function loadMyProducts() {
    const user = getTelegramUser && getTelegramUser();
    if (!user || !user.id) return;
    const status = document.getElementById('my-products-status').value;
    let res = await fetch('https://store-backend-zpkh.onrender.com/products?all=1');
    let products = await res.json();
    products = products.filter(p => p.ownerId == user.id);
    if (status !== 'all') products = products.filter(p => p.status === status);
    const list = document.getElementById('my-products-list');
    if (!products.length) {
      list.innerHTML = '<div class="empty">Нет товаров.</div>';
      return;
    }
  list.innerHTML = products.map(prod => renderProductCard(prod, {my:true,status:true,deleteBtn:true})).join('');
  }

  // Обработчик фильтрации "Мои товары"
  const myProductsStatus = document.getElementById('my-products-status');
  if (myProductsStatus) {
    myProductsStatus.onchange = loadMyProducts;
  }
  // Загрузка при открытии профиля
  document.querySelector('[data-page="profile-page"]').addEventListener('click', loadMyProducts);

  // Удаление товара пользователем
  document.getElementById('my-products-list').addEventListener('click', async function(e) {
    const btn = e.target.closest('.product-delete-btn');
    if (btn) {
      if (!confirm('Удалить этот товар?')) return;
      const id = btn.getAttribute('data-id');
      const res = await fetch('https://store-backend-zpkh.onrender.com/products/' + id, { method: 'DELETE' });
      if (res.ok) {
        showToast('Товар удалён', '#43e97b');
        loadMyProducts();
      } else {
        showToast('Ошибка удаления', '#e94e43');
      }
    }
  });

  // --- Добавление товара ---
  const addProductForm = document.getElementById('add-product-form');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const user = getTelegramUser && getTelegramUser();
      if (!user || !user.id) {
        showToast('Ошибка: не найден Telegram ID', '#e94e43');
        return;
      }
      const formData = new FormData(addProductForm);
      // 1. Загрузка файла товара
      const fileInput = document.getElementById('add-product-file');
      let fileUrl = '';
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const fileData = new FormData();
        fileData.append('file', fileInput.files[0]);
        const uploadRes = await fetch('https://store-backend-zpkh.onrender.com/upload/file', {
          method: 'POST',
          body: fileData
        });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          fileUrl = 'https://store-backend-zpkh.onrender.com/files/' + uploadJson.url;
        } else {
          showToast('Ошибка загрузки файла', '#e94e43');
          return;
        }
      } else {
        showToast('Выберите файл товара', '#e94e43');
        return;
      }

      // 2. Загрузка изображения (если выбрано)
      const imageInput = document.getElementById('add-product-image');
      let imageFileName = '';
      if (imageInput && imageInput.files && imageInput.files[0]) {
        const imgData = new FormData();
        imgData.append('image', imageInput.files[0]);
        const imgRes = await fetch('https://store-backend-zpkh.onrender.com/upload/image', {
          method: 'POST',
          body: imgData
        });
        if (imgRes.ok) {
          const imgJson = await imgRes.json();
          imageFileName = imgJson.url;
        } else {
          showToast('Ошибка загрузки изображения', '#e94e43');
          return;
        }
      }

      // 3. Отправка товара
      const data = {
        name: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        price: Number(formData.get('price')),
        ownerId: user.id,
        fileUrl,
        image: imageFileName
      };
      const res = await fetch('https://store-backend-zpkh.onrender.com/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('Товар отправлен на модерацию', '#43e97b');
        addProductForm.reset();
        document.getElementById('modal-add-product').style.display = 'none';
        document.body.classList.remove('modal-open');
        loadMyProducts();
      } else {
        const err = await res.json();
        showToast('Ошибка: ' + (err.error || 'Не удалось добавить'), '#e94e43');
      }
    });
  }
  loadCategories();
  updateCategoryFilterOptions();
  fillProfileFromTelegram();
  // Товары загружаются только по поиску
  // TODO: инициализация профиля, корзины, истории, поддержки и т.д.

  // Обработчик для кнопки поддержки
  const supportBtn = document.getElementById('support-form-btn');
  const supportModal = document.getElementById('modal-support');
  const supportClose = document.getElementById('support-close');
  const supportBody = document.getElementById('modal-support-body');
  if (supportBtn && supportModal && supportClose && supportBody) {
    supportBtn.addEventListener('click', function() {
      // Получаем Telegram ID пользователя
      let userId = null;
      const user = getTelegramUser && getTelegramUser();
      if (user && user.id) userId = user.id.toString();
      supportBody.innerHTML = '';
      if (adminsID.includes(Number(userId))) {
        // Админ-панель
        supportBody.innerHTML = `
          <h2 style="margin-bottom:0.5em;color:#00916e;">Админ-панель</h2>
          <div class="admin-tabs">
            <button id="admin-tab-moderation" class="modal-btn modal-btn-main"><span class="icon">🛡️</span>Товары на проверке</button>
            <button id="admin-categories-btn" class="modal-btn"><span class="icon">📂</span>Категории</button>
            <button id="admin-products-btn" class="modal-btn"><span class="icon">📦</span>Товары</button>
          </div>
          <div id="admin-panel-content" class="admin-panel-content"></div>
        `;
        const adminPanelContent = document.getElementById('admin-panel-content');
        // Вкладка "Товары на проверке"
        document.getElementById('admin-tab-moderation').onclick = async function() {
          adminPanelContent.innerHTML = '<div class="loading">Загрузка...</div>';
          const res = await fetch('https://store-backend-zpkh.onrender.com/products/moderation');
          const products = await res.json();
          if (!products.length) {
            adminPanelContent.innerHTML = '<div class="empty">Нет товаров на проверке.</div>';
            return;
          }
          adminPanelContent.innerHTML = products.map(prod => renderProductCard(prod, {
            moderation:true, desc:true, owner:true, file:true,
            actions:`<div class=\"product-card-actions\"><button class=\"modal-btn approve-btn\" data-id=\"${prod.id}\">Одобрить</button><button class=\"modal-btn reject-btn\" data-id=\"${prod.id}\">Отклонить</button></div>`
          })).join('');
        };
        // Вкладка "Управление категориями"
        document.getElementById('admin-categories-btn').onclick = async function() {
          adminPanelContent.innerHTML = '<div class="loading">Загрузка категорий...</div>';
          try {
            const res = await fetch('https://store-backend-zpkh.onrender.com/categories');
            let cats = await res.json();
            adminPanelContent.innerHTML = `
              <h3 style="color:#00916e;margin-bottom:0.5em;">Категории</h3>
              <ul id="admin-categories-list" class="admin-category-list" style="padding-left:0;list-style:none;"></ul>
              <form id="admin-add-category-form" style="margin-top:16px;display:flex;gap:8px;">
                <input id="admin-add-category-input" type="text" placeholder="Новая категория" required style="flex:1;min-width:0;">
                <button type="submit" class="modal-btn"><span class="icon">➕</span>Добавить</button>
              </form>
            `;
            const list = document.getElementById('admin-categories-list');
            list.innerHTML = cats.map(cat => `
              <li><span>${cat.name}</span><button class="modal-btn admin-delete-category-btn" data-id="${cat.id}"><span class="icon">🗑️</span>Удалить</button></li>
            `).join('');
            // Добавление категории
            document.getElementById('admin-add-category-form').onsubmit = async function(e) {
              e.preventDefault();
              const input = document.getElementById('admin-add-category-input');
              const name = input.value.trim();
              if (!name) return;
              const res = await fetch('https://store-backend-zpkh.onrender.com/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
              });
              if (res.ok) {
                showToast('Категория добавлена', '#43e97b');
                document.getElementById('admin-categories-btn').click();
              } else {
                showToast('Ошибка добавления', '#e94e43');
              }
            };
            // Удаление категории
            list.addEventListener('click', async function(e) {
              const delBtn = e.target.closest('.admin-delete-category-btn');
              if (delBtn) {
                if (!confirm('Удалить категорию?')) return;
                const id = delBtn.getAttribute('data-id');
                const res = await fetch('https://store-backend-zpkh.onrender.com/categories/' + id, { method: 'DELETE' });
                if (res.ok) {
                  showToast('Категория удалена', '#43e97b');
                  document.getElementById('admin-categories-btn').click();
                } else {
                  showToast('Ошибка удаления', '#e94e43');
                }
              }
            });
          } catch {
            adminPanelContent.innerHTML = '<div class="error">Ошибка загрузки категорий.</div>';
          }
        };
        // Сразу открыть вкладку модерации
        setTimeout(()=>document.getElementById('admin-tab-moderation').click(), 100);
        // Делегирование на approve/reject
        adminPanelContent.addEventListener('click', async function(e) {
          const approveBtn = e.target.closest('.approve-btn');
          const rejectBtn = e.target.closest('.reject-btn');
          if (approveBtn) {
            const id = approveBtn.getAttribute('data-id');
            const res = await fetch(`https://store-backend-zpkh.onrender.com/products/${id}/approve`, { method: 'POST' });
            if (res.ok) {
              showToast('Товар одобрен', '#43e97b');
              document.getElementById('admin-tab-moderation').click();
            } else {
              showToast('Ошибка', '#e94e43');
            }
          }
          if (rejectBtn) {
            const id = rejectBtn.getAttribute('data-id');
            const res = await fetch(`https://store-backend-zpkh.onrender.com/products/${id}/reject`, { method: 'POST' });
            if (res.ok) {
              showToast('Товар отклонён', '#e94e43');
              document.getElementById('admin-tab-moderation').click();
            } else {
              showToast('Ошибка', '#e94e43');
            }
          }
        });
      } else {
        // Ссылка на чат с админом
        supportBody.innerHTML = `
          <h2>Связь с поддержкой</h2>
          <p>Перейдите в <a href="https://t.me/abdumalikovvvvvvv" target="_blank">чат с админом</a> для решения вашего вопроса.</p>
        `;
      }
      supportModal.classList.add('active');
      supportModal.style.display = 'flex';
      document.body.classList.add('modal-open');
    });
    supportClose.addEventListener('click', function() {
      supportModal.classList.remove('active');
      supportModal.style.display = 'none';
      document.body.classList.remove('modal-open');
    });
    supportModal.addEventListener('mousedown', function(e) {
      if (e.target === supportModal) {
        supportModal.classList.remove('active');
        supportModal.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    });
  }

  // SPA: показать страницу по hash при загрузке
  const hash = window.location.hash.replace('#','');
  if(['main-page','profile-page','settings-page'].includes(hash)) {
    showPage(hash);
  } else {
    showPage('main-page');
  }
});
