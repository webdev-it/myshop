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
    list.innerHTML = products.map(prod => `
      <div class="product-card my-product-card" data-product-id="${prod.id}">
        <div class="product-card-img-wrap">
          <img src="${prod.image ? `https://store-backend-zpkh.onrender.com/images/${encodeURIComponent(prod.image)}` : 'images/placeholder.png'}" alt="img" class="product-card-img">
        </div>
        <div class="product-card-body">
          <div class="product-card-title">${prod.name}</div>
          <div class="product-card-price">${prod.price ? prod.price + ' ₽' : 'Бесплатно'}</div>
          <div class="product-card-status">Статус: <b>${prod.status === 'pending' ? 'На модерации' : prod.status === 'approved' ? 'Одобрено' : 'Отклонено'}</b></div>
        </div>
        <button class="product-card-btn product-delete-btn" data-id="${prod.id}">Удалить</button>
      </div>
    `).join('');
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
      // 2. Загрузка изображения (опционально, если нужно)
      // ...можно реализовать аналогично через /upload
      // 3. Отправка товара
      const data = {
        name: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        price: Number(formData.get('price')),
        ownerId: user.id,
        fileUrl
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
      if (userId === '6956702448') {
        // Админ-панель
        supportBody.innerHTML = `
          <h2>Админ-панель</h2>
          <div class="admin-tabs">
            <button id="admin-tab-moderation" class="modal-btn modal-btn-main">Товары на проверке</button>
            <button id="admin-categories-btn" class="modal-btn">Управление категориями</button>
            <button id="admin-products-btn" class="modal-btn">Управление товарами</button>
          </div>
          <div id="admin-panel-content" style="margin-top:16px;"></div>
        `;
        // Вкладка "Товары на проверке"
        const adminPanelContent = document.getElementById('admin-panel-content');
        document.getElementById('admin-tab-moderation').onclick = async function() {
          adminPanelContent.innerHTML = '<div class="loading">Загрузка...</div>';
          const res = await fetch('https://store-backend-zpkh.onrender.com/products/moderation');
          const products = await res.json();
          if (!products.length) {
            adminPanelContent.innerHTML = '<div class="empty">Нет товаров на проверке.</div>';
            return;
          }
          adminPanelContent.innerHTML = products.map(prod => `
            <div class="product-card moderation-card" data-product-id="${prod.id}">
              <div class="product-card-img-wrap">
                <img src="${prod.image ? `https://store-backend-zpkh.onrender.com/images/${encodeURIComponent(prod.image)}` : 'images/placeholder.png'}" alt="img" class="product-card-img">
              </div>
              <div class="product-card-body">
                <div class="product-card-title">${prod.name}</div>
                <div class="product-card-price">${prod.price ? prod.price + ' ₽' : 'Бесплатно'}</div>
                <div class="product-card-desc">${prod.description || ''}</div>
                <div class="product-card-owner">ID пользователя: <b>${prod.ownerId}</b></div>
                <div class="product-card-file">Файл: <a href="${prod.fileUrl || '#'}" target="_blank">Скачать</a></div>
                <div class="product-card-actions">
                  <button class="modal-btn approve-btn" data-id="${prod.id}">Одобрить</button>
                  <button class="modal-btn reject-btn" data-id="${prod.id}">Отклонить</button>
                </div>
              </div>
            </div>
          `).join('');
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
