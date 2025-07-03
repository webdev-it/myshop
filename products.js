// products.js

const PRODUCTS = [
  // 📦 Электроника
  {
    id: "1001",
    name: "Смартфон",
    price: 29990,
    category: "1",
    description: "Мощный смартфон с камерой 64МП и OLED-дисплеем.",
    image: "images/phone.jpg"
  },
  {
    id: "1002",
    name: "Наушники",
    price: 4990,
    category: "1",
    description: "Беспроводные наушники с шумоподавлением.",
    image: "images/headphones.jpg"
  },
  {
    id: "1001",
    name: "Смартфон",
    price: 29990,
    category: "1",
    description: "Мощный смартфон с камерой 64МП и OLED-дисплеем.",
    image: "images/phone.jpg"
  },

  
  // 👕 Одежда
  {
    id: "2001",
    name: "Футболка",
    price: 799,
    category: "2",
    description: "Хлопковая футболка с принтом.",
    image: "images/tshirt.jpg"
  },
  {
    id: "2002",
    name: "Джинсы",
    price: 1999,
    category: "2",
    description: "Универсальные джинсы с высокой посадкой.",
    image: "images/jeans.jpg"
  },

  // 📚 Книги
  {
    id: "3001",
    name: "Фантастический роман",
    price: 599,
    category: "3",
    description: "Захватывающий роман о путешествиях во времени и космосе.",
    image: "images/book1.jpg"
  },
  {
    id: "3002",
    name: "Справочник по программированию",
    price: 899,
    category: "3",
    description: "Практическое руководство по современным языкам программирования.",
    image: "images/book2.jpg"
  }
];





window.addEventListener('DOMContentLoaded', () => {
  const categoryId = "1"; // Для 2.html → "2", для 3.html → "3"
  const productList = document.getElementById("product-list");

  const filtered = PRODUCTS.filter(p => p.category === categoryId);

  filtered.forEach(product => {
    const box = document.createElement('div');
    box.className = 'product';
    box.setAttribute('data-id', product.id);
    box.setAttribute('data-name', product.name);
    box.setAttribute('data-price', product.price);

    box.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-img" />
      <h2>${product.name}</h2>
      <p class="description">${product.description}</p>
      <p class="price">Цена: ${product.price === 0 ? 'Бесплатно' : product.price.toLocaleString() + ' ₽'}</p>
      <button class="buy-btn">Купить</button>
    `;

    productList.appendChild(box);
  });

  document.querySelectorAll('.buy-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const product = e.target.closest('.product');
      const name = product.dataset.name;
      const price = product.dataset.price;
      alert(`Вы выбрали товар: ${name} за ${price == 0 ? 'Бесплатно' : price + ' ₽'}`);
    });
  });

  // Telegram приветствие
  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe?.user;
  const welcomeEl = document.getElementById("welcome");
  if (welcomeEl && user && user.first_name) {
    welcomeEl.textContent = `Здравствуйте, ${user.first_name}!`;
  }
});
