// Базовые новости (если хранилище пустое)
const defaultNews = [
    {
        id: 1,
        category: "tech",
        categoryName: "Технологии",
        title: "Прорыв в квантовых вычислениях: новый процессор побил рекорд стабильности",
        date: "12 ноября 2026, 09:30",
        text: "<p>Инженеры представили архитектуру нового поколения, способную удерживать квантовую запутанность в десять раз дольше предыдущих аналогов.</p><p>Это открытие приближает момент, когда квантовые компьютеры начнут применяться для моделирования сложных лекарств и криптографии в реальном времени.</p>"
    },
    {
        id: 2,
        category: "tech",
        categoryName: "Технологии",
        title: "Нейросети научились оптимизировать энергосети мегаполисов",
        date: "12 ноября 2026, 08:15",
        text: "<p>Автоматизированные алгоритмы теперь перераспределяют нагрузку на подстанции за доли секунды, снижая потери электроэнергии на 18%.</p>"
    },
    {
        id: 3,
        category: "economy",
        categoryName: "Экономика",
        title: "Рынок зелёной энергетики показал рекордный приток частных инвестиций",
        date: "11 ноября 2026, 19:40",
        text: "<p>За последний квартал объём вложений в накопители энергии и солнечную генерацию вырос на 24% по сравнению с прошлым годом.</p>"
    }
];

let newsDatabase = JSON.parse(localStorage.getItem('siteNewsDatabase')) || defaultNews;
let commentsStorage = JSON.parse(localStorage.getItem('siteComments')) || {
    1: [{ author: "Алексей", text: "Наконец-то квантовые технологии выходят из лабораторий!" }]
};

let currentNewsId = newsDatabase.length > 0 ? newsDatabase[0].id : 1;

const freshListEl = document.getElementById('fresh-news-list');
const relatedListEl = document.getElementById('related-news-list');
const articleCategoryEl = document.getElementById('article-category');
const articleTitleEl = document.getElementById('article-title');
const articleDateEl = document.getElementById('article-date');
const articleBodyEl = document.getElementById('article-body');
const commentsListEl = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');

// Открытие одной статьи
function openNews(id) {
    const newsItem = newsDatabase.find(item => item.id === id);
    
    if (!newsItem) return;

    currentNewsId = id;

    articleCategoryEl.textContent = newsItem.categoryName;
    articleTitleEl.textContent = newsItem.title;
    articleDateEl.textContent = newsItem.date;
    articleBodyEl.innerHTML = newsItem.text;

    renderFreshNews();
    renderRelatedNews(newsItem.category, newsItem.id);
    renderComments(id);
}

// Открытие ленты категории
function openCategoryFeed(categoryCode, categoryTitle) {
    currentNewsId = null;
    articleCategoryEl.textContent = "Раздел";
    articleTitleEl.textContent = `Все новости рубрики: ${categoryTitle}`;
    articleDateEl.textContent = "Общая лента категории";
    
    const catNews = newsDatabase.filter(item => item.category === categoryCode);

    if (catNews.length === 0) {
        articleBodyEl.innerHTML = "<p>В этой рубрике пока нет опубликованных материалов.</p>";
    } else {
        let htmlList = '<div class="category-feed-list">';
        catNews.forEach(item => {
            htmlList += `
                <div class="feed-card" onclick="openNews(${item.id})" style="background:#183459; padding:15px; border-radius:12px; margin-bottom:12px; cursor:pointer;">
                    <h3 style="font-size:18px; color:#f8fafc; margin-bottom:6px;">${item.title}</h3>
                    <div style="display:flex; justify-content:space-between; font-size:12px; color:#94a3b8;">
                        <span>${item.date}</span>
                        <span style="color:#38bdf8; font-weight:600;">📁 ${item.categoryName}</span>
                    </div>
                </div>
            `;
        });
        htmlList += '</div>';
        articleBodyEl.innerHTML = htmlList;
    }

    commentsListEl.innerHTML = '<p style="font-size:13px; color:#64748b;">Выберите конкретную новость для чтения и комментариев</p>';
    if (relatedListEl) relatedListEl.innerHTML = '<li style="cursor:default; color:#64748b;">Общий просмотр раздела</li>';
    renderFreshNews();
}

function renderFreshNews() {
    if (!freshListEl) return;
    freshListEl.innerHTML = '';
    newsDatabase.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.title;
        if (item.id === currentNewsId) li.classList.add('active');
        li.onclick = () => openNews(item.id);
        freshListEl.appendChild(li);
    });
}

function renderRelatedNews(category, excludeId) {
    if (!relatedListEl) return;
    relatedListEl.innerHTML = '';
    const related = newsDatabase.filter(item => item.category === category && item.id !== excludeId);
    
    if (related.length === 0) {
        relatedListEl.innerHTML = '<li style="cursor:default; color:#64748b;">Нет других новостей в этой теме</li>';
        return;
    }

    related.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.title;
        li.onclick = () => openNews(item.id);
        relatedListEl.appendChild(li);
    });
}

function renderComments(newsId) {
    if (!commentsListEl) return;
    commentsListEl.innerHTML = '';
    const comments = commentsStorage[newsId] || [];

    if (comments.length === 0) {
        commentsListEl.innerHTML = '<p style="font-size:13px; color:#64748b;">Комментариев пока нет. Будьте первым!</p>';
        return;
    }

    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerHTML = `<div class="comment-author">${c.author}</div><div>${c.text}</div>`;
        commentsListEl.appendChild(div);
    });
}

if (commentForm) {
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!currentNewsId) {
            alert('Выберите конкретную новость для отправки комментария!');
            return;
        }
        const authorInput = document.getElementById('comment-author');
        const textInput = document.getElementById('comment-text');

        if (!commentsStorage[currentNewsId]) {
            commentsStorage[currentNewsId] = [];
        }

        commentsStorage[currentNewsId].push({
            author: authorInput.value.trim(),
            text: textInput.value.trim()
        });

        localStorage.setItem('siteComments', JSON.stringify(commentsStorage));

        authorInput.value = '';
        textInput.value = '';
        renderComments(currentNewsId);
    });
}

// Инициализация при старте
if (newsDatabase.length > 0) {
    openNews(newsDatabase[0].id);
}

// --- МОБИЛЬНАЯ СПЕЦИФИКА (РАБОТАЕТ ТОЛЬКО НА ЭКРАНАХ <= 768px) ---
function initMobileFeatures() {
    const tickerEl = document.getElementById('mobile-news-ticker');
    if (tickerEl) {
        const items = [...newsDatabase, ...newsDatabase];
        tickerEl.innerHTML = `<div class="mobile-ticker-track">${
            items.map(n => `<span class="mobile-ticker-item" onclick="openNews(${n.id})">⚡ ${n.title}</span>`).join('')
        }</div>`;
    }

    // Меню по второму клику на мобильном
    document.querySelectorAll('.menu-parent-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const parentItem = this.parentElement;
                const cat = this.getAttribute('data-cat');
                const title = this.getAttribute('data-title');

                const isOpen = parentItem.classList.contains('open');
                document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('open'));

                if (!isOpen) {
                    parentItem.classList.add('open');
                    openCategoryFeed(cat, title);
                }
            }
        });
    });

    // Плавающее окно комментариев на мобильном
    const fabBtn = document.getElementById('mobile-chat-fab');
    const commentsSidebar = document.getElementById('comments-sidebar');
    const closeBtn = document.getElementById('mobile-chat-close');

    if (fabBtn && commentsSidebar) {
        fabBtn.addEventListener('click', () => {
            commentsSidebar.classList.toggle('chat-open');
        });
    }
    if (closeBtn && commentsSidebar) {
        closeBtn.addEventListener('click', () => {
            commentsSidebar.classList.remove('chat-open');
        });
    }
}

initMobileFeatures();
