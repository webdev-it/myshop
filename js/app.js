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
    list.innerHTML = products.map(prod => {
      const imageUrl = prod.image ? `https://store-backend-zpkh.onrender.com/images/${encodeURIComponent(prod.image)}` : 'images/placeholder.png';
      return `<div class="product-card" data-product-id="${prod.id}">
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
    // TODO: реализовать открытие модалки товара
    showToast('Модалка товара: в разработке', '#43e97b');
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
    list.innerHTML = products.map(prod => {
      const imageUrl = prod.image ? `https://store-backend-zpkh.onrender.com/images/${encodeURIComponent(prod.image)}` : 'images/placeholder.png';
      return `<div class="product-card" data-product-id="${prod.id}">
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
    list.innerHTML = '<div class="error">Ошибка загрузки товаров.</div>';
  }
  // Назад
  document.getElementById('category-back-btn').onclick = function() {
    showPage('main-page');
  };
}

// --- Инициализация SPA ---
document.addEventListener('DOMContentLoaded', function() {
  loadCategories();
  updateCategoryFilterOptions();
  // Товары загружаются только по поиску
  // TODO: инициализация профиля, корзины, истории, поддержки и т.д.

  // SPA: показать страницу по hash при загрузке
  const hash = window.location.hash.replace('#','');
  if(['main-page','profile-page','settings-page'].includes(hash)) {
    showPage(hash);
  } else {
    showPage('main-page');
  }
});
