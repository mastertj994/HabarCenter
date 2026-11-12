// Базовые новости (если хранилище еще пустое)
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
        text: "<p>Автоматизированные алгоритмы теперь перераспределяют нагрузку на подстанции за доли секунды, снижая потери электроэнергии на 18%.</p><p>Пилотный проект уже запущен в трёх крупных технологических хабах.</p>"
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
let commentsStorage = JSON.parse(localStorage.getItem('siteComments')) || {};

// Пароль админки (можешь поменять здесь на свой)
const ADMIN_PASS = "admin123";

// Элементы авторизации
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const passInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

// Проверка сессии входа
if (sessionStorage.getItem('isAdminLogged') === 'true') {
    showAdminPanel();
}

loginBtn.addEventListener('click', checkLogin);
passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkLogin();
});

function checkLogin() {
    if (passInput.value === ADMIN_PASS) {
        sessionStorage.setItem('isAdminLogged', 'true');
        showAdminPanel();
    } else {
        loginError.style.display = 'block';
    }
}

function showAdminPanel() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    renderAdminNewsList();
    renderAdminComments();
}

document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('isAdminLogged');
    location.reload();
});

// --- УМНЫЙ РЕДАКТОР ---
const smartEditor = document.getElementById('smart-editor');
const wordCountEl = document.getElementById('word-count');
const readTimeEl = document.getElementById('read-time');

// [СТРОКА 78] Логика кнопок умного редактора (цвет, размер, загрузка с ПК)
document.querySelectorAll('.smart-toolbar button[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        const val = btn.getAttribute('data-val') || null;
        document.execCommand(cmd, false, val);
        smartEditor.focus();
        updateStats();
    });
});

// Изменение цвета текста
document.getElementById('font-color-picker').addEventListener('input', (e) => {
    document.execCommand('foreColor', false, e.target.value);
    smartEditor.focus();
});

// Изменение размера текста
document.getElementById('font-size-select').addEventListener('change', (e) => {
    document.execCommand('fontSize', false, e.target.value);
    smartEditor.focus();
});

// Вставка ссылки по URL
document.getElementById('insert-link-btn').addEventListener('click', () => {
    const url = prompt('Введите адрес ссылки (например, https://example.com):');
    if (url) document.execCommand('createLink', false, url);
});

// Вставка картинки по URL
document.getElementById('insert-img-url-btn').addEventListener('click', () => {
    const imgUrl = prompt('Вставьте прямую ссылку на изображение (URL):');
    if (imgUrl) document.execCommand('insertImage', false, imgUrl);
});

// Загрузка картинки с ПК
const imgFileInput = document.getElementById('hidden-img-file-input');
document.getElementById('insert-img-file-btn').addEventListener('click', () => {
    imgFileInput.click();
});

imgFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64ImgCode = event.target.result;
        document.execCommand('insertImage', false, base64ImgCode);
        smartEditor.focus();
        updateStats();
    };
    reader.readAsDataURL(file);
    imgFileInput.value = '';
});

// Подсчет слов и времени чтения в реальном времени
smartEditor.addEventListener('input', updateStats);

function updateStats() {
    const text = smartEditor.innerText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 180));
    wordCountEl.textContent = `Слов: ${words}`;
    readTimeEl.textContent = `Время чтения: ~${minutes} мин`;
}

// --- СОХРАНЕНИЕ И РЕДАКТИРОВАНИЕ СТАТЕЙ ---
const editorForm = document.getElementById('news-editor-form');
const editIdInput = document.getElementById('edit-news-id');
const titleInput = document.getElementById('news-title');
const categorySelect = document.getElementById('news-category');
const editorModeTitle = document.getElementById('editor-mode-title');
const resetFormBtn = document.getElementById('reset-form-btn');

editorForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const contentHTML = smartEditor.innerHTML.trim();
    if (!contentHTML || smartEditor.innerText.trim() === '') {
        alert('Напишите текст статьи!');
        return;
    }

    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    const categoryCode = categorySelect.value;
    const categoryName = selectedOption.getAttribute('data-name');
    const editId = editIdInput.value ? Number(editIdInput.value) : null;

    if (editId) {
        // Обновляем существующую новость
        const index = newsDatabase.findIndex(item => item.id === editId);
        if (index !== -1) {
            newsDatabase[index].title = titleInput.value.trim();
            newsDatabase[index].category = categoryCode;
            newsDatabase[index].categoryName = categoryName;
            newsDatabase[index].text = contentHTML;
        }
    } else {
        // Создаем новую новость (добавляем в начало ленты)
        const now = new Date();
        const formattedDate = now.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const newArticle = {
            id: Date.now(),
            category: categoryCode,
            categoryName: categoryName,
            title: titleInput.value.trim(),
            date: formattedDate,
            text: contentHTML
        };
        newsDatabase.unshift(newArticle);
    }

    saveAndRefresh();
    resetEditor();
    alert(editId ? 'Статья обновлена!' : 'Новость опубликована на сайте!');
});

function editArticle(id) {
    const article = newsDatabase.find(item => item.id === id);
    if (!article) return;

    editIdInput.value = article.id;
    titleInput.value = article.title;
    categorySelect.value = article.category;
    smartEditor.innerHTML = article.text;
    
    editorModeTitle.textContent = 'Редактирование статьи';
    resetFormBtn.style.display = 'inline-block';
    updateStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteArticle(id) {
    if (!confirm('Точно удалить эту новость?')) return;
    newsDatabase = newsDatabase.filter(item => item.id !== id);
    saveAndRefresh();
}

function resetEditor() {
    editIdInput.value = '';
    titleInput.value = '';
    smartEditor.innerHTML = '';
    editorModeTitle.textContent = 'Создать новую статью';
    resetFormBtn.style.display = 'none';
    updateStats();
}

resetFormBtn.addEventListener('click', resetEditor);

// Отрисовка списка статей справа
function renderAdminNewsList() {
    const listEl = document.getElementById('admin-news-list');
    document.getElementById('total-news-count').textContent = newsDatabase.length;
    listEl.innerHTML = '';

    newsDatabase.forEach(item => {
        const div = document.createElement('div');
        div.className = 'admin-news-item';
        div.innerHTML = `
            <div class="admin-news-item-title">${item.title}</div>
            <div class="admin-news-meta">
                <span>${item.categoryName} • ${item.date}</span>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editArticle(${item.id})">Изменить</button>
                    <button class="delete-btn" onclick="deleteArticle(${item.id})">Удалить</button>
                </div>
            </div>
        `;
        listEl.appendChild(div);
    });
}

// Модерация комментариев
function renderAdminComments() {
    const commListEl = document.getElementById('admin-comments-list');
    commListEl.innerHTML = '';
    let hasComments = false;

    for (const [newsId, comments] of Object.entries(commentsStorage)) {
        comments.forEach((c, idx) => {
            hasComments = true;
            const div = document.createElement('div');
            div.className = 'admin-news-item';
            div.innerHTML = `
                <div style="font-size:12px; color:#38bdf8; font-weight:700;">${c.author}</div>
                <div style="font-size:13px; margin: 4px 0;">${c.text}</div>
                <div class="admin-news-meta">
                    <span>К новости #${newsId}</span>
                    <button class="delete-btn" onclick="deleteComment(${newsId}, ${idx})">Удалить</button>
                </div>
            `;
            commListEl.appendChild(div);
        });
    }

    if (!hasComments) {
        commListEl.innerHTML = '<p style="font-size:13px; color:#64748b;">Комментариев пока нет.</p>';
    }
}

function deleteComment(newsId, index) {
    commentsStorage[newsId].splice(index, 1);
    localStorage.setItem('siteComments', JSON.stringify(commentsStorage));
    renderAdminComments();
}

function saveAndRefresh() {
    localStorage.setItem('siteNewsDatabase', JSON.stringify(newsDatabase));
    renderAdminNewsList();
}

// Экспорт базы для хостинга
const exportModal = document.getElementById('export-modal');
document.getElementById('export-btn').addEventListener('click', () => {
    document.getElementById('export-code-area').value = `const defaultNews = ${JSON.stringify(newsDatabase, null, 4)};`;
    exportModal.style.display = 'flex';
});

document.getElementById('close-export-btn').addEventListener('click', () => {
    exportModal.style.display = 'none';
});

document.getElementById('copy-export-btn').addEventListener('click', () => {
    const area = document.getElementById('export-code-area');
    area.select();
    document.execCommand('copy');
    alert('Код скопирован! Теперь его можно вставить в js/script.js');
});
// [В САМОМ КОНЦЕ ФАЙЛА] Логика выбора картинки в редакторе и изменения её размера
let selectedImage = null;
const imgResizePanel = document.getElementById('img-resize-panel');

smartEditor.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
        if (selectedImage) {
            selectedImage.classList.remove('selected-image');
        }
        selectedImage = e.target;
        selectedImage.classList.add('selected-image');
        imgResizePanel.style.display = 'inline-flex';
    } else {
        // Если кликнули не на картинку — снимаем выделение
        if (selectedImage && !e.target.closest('#img-resize-panel')) {
            selectedImage.classList.remove('selected-image');
            selectedImage = null;
            imgResizePanel.style.display = 'none';
        }
    }
});

// Обработка кнопок изменения размера (25%, 50%, 75%, 100%)
document.querySelectorAll('.img-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!selectedImage) return;
        const sizePercent = btn.getAttribute('data-size');
        selectedImage.style.width = `${sizePercent}%`;
        selectedImage.style.height = 'auto';
        smartEditor.focus();
        updateStats();
    });
});
