// ===== DATOS INICIALES =====
const DEFAULT_ARTICLES = [
    { nombre: 'Laptop', stock: 12 },
    { nombre: 'Smartphone', stock: 8 },
    { nombre: 'Auriculares', stock: 25 },
    { nombre: 'Cámara', stock: 5 },
    { nombre: 'Tablet', stock: 15 },
    { nombre: 'Smartwatch', stock: 20 },
    { nombre: 'Monitor', stock: 10 },
    { nombre: 'Teclado', stock: 30 },
    { nombre: 'Mouse', stock: 40 },
];

const ADMIN_PASSWORD = 'admin123'; // ← Cambia esta clave por la tuya

// ===== ESTADO =====
let articles = [];
let opinions = [];
let messages = [];
let selectedStars = 0;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderOpinions();
    renderAdminArticles();
    renderAdminOpinions();
    renderAdminMessages();
    setupEventListeners();
});

function loadData() {
    // Cargar artículos
    const storedArticles = localStorage.getItem('luxe_articles');
    if (storedArticles) {
        articles = JSON.parse(storedArticles);
    } else {
        articles = [...DEFAULT_ARTICLES];
        localStorage.setItem('luxe_articles', JSON.stringify(articles));
    }
    
    // Cargar opiniones
    const storedOpinions = localStorage.getItem('luxe_opinions');
    if (storedOpinions) {
        opinions = JSON.parse(storedOpinions);
    }
    
    // Cargar mensajes
    const storedMessages = localStorage.getItem('luxe_messages');
    if (storedMessages) {
        messages = JSON.parse(storedMessages);
    }
}

function saveData() {
    localStorage.setItem('luxe_articles', JSON.stringify(articles));
    localStorage.setItem('luxe_opinions', JSON.stringify(opinions));
    localStorage.setItem('luxe_messages', JSON.stringify(messages));
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Hamburguesa
    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.nav-menu').classList.toggle('active');
    });
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.remove('active');
        });
    });
    
    // Búsqueda
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    
    // Estrellas
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', () => {
            selectedStars = parseInt(star.dataset.value);
            updateStarsDisplay();
        });
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.dataset.value);
            highlightStars(value);
        });
        star.addEventListener('mouseleave', () => {
            updateStarsDisplay();
        });
    });
    
    // Enviar opinión
    document.getElementById('submitOpinion').addEventListener('click', handleSubmitOpinion);
    
    // Contacto
    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);
    
    // Admin
    document.getElementById('btnAdmin').addEventListener('click', openAdminModal);
    document.getElementById('closeModal').addEventListener('click', closeAdminModal);
    document.getElementById('btnLoginAdmin').addEventListener('click', handleAdminLogin);
    document.getElementById('adminPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });
    
    // Tabs admin
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Agregar artículo
    document.getElementById('btnAddArticle').addEventListener('click', handleAddArticle);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('adminModal');
        if (e.target === modal) {
            closeAdminModal();
        }
    });
}

// ===== FUNCIONES DE BÚSQUEDA =====
function handleSearch(e) {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const resultDiv = document.getElementById('searchResult');
    
    if (!query) {
        resultDiv.className = 'search-result empty';
        resultDiv.textContent = 'Por favor ingresa un nombre de artículo.';
        return;
    }
    
    const found = articles.find(a => a.nombre.toLowerCase().includes(query));
    
    if (found) {
        if (found.stock > 0) {
            resultDiv.className = 'search-result success';
            resultDiv.textContent = `✅ "${found.nombre}" está disponible. Stock: ${found.stock} unidades.`;
        } else {
            resultDiv.className = 'search-result error';
            resultDiv.textContent = `❌ "${found.nombre}" está agotado.`;
        }
    } else {
        resultDiv.className = 'search-result empty';
        resultDiv.textContent = `🔍 No se encontró "${query}". Prueba con otro nombre.`;
    }
}

// ===== FUNCIONES DE ESTRELLAS =====
function highlightStars(value) {
    document.querySelectorAll('.star').forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (starValue <= value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateStarsDisplay() {
    document.querySelectorAll('.star').forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (starValue <= selectedStars) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    const ratingText = document.getElementById('starRatingText');
    const texts = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
    ratingText.textContent = selectedStars > 0 ? texts[selectedStars] : 'Selecciona una calificación';
}

// ===== FUNCIONES DE OPINIONES =====
function handleSubmitOpinion() {
    const opinionText = document.getElementById('opinionText').value.trim();
    
    if (selectedStars === 0) {
        alert('Por favor selecciona una calificación de estrellas.');
        return;
    }
    
    if (!opinionText) {
        alert('Por favor escribe tu opinión.');
        return;
    }
    
    const newOpinion = {
        id: Date.now(),
        stars: selectedStars,
        text: opinionText,
        date: new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    };
    
    opinions.unshift(newOpinion);
    saveData();
    renderOpinions();
    renderAdminOpinions();
    
    // Resetear formulario
    selectedStars = 0;
    updateStarsDisplay();
    document.getElementById('opinionText').value = '';
    
    alert('¡Gracias por tu opinión!');
}

function renderOpinions() {
    const container = document.getElementById('opinionsList');
    
    if (opinions.length === 0) {
        container.innerHTML = '<p style="color: var(--gris); text-align: center;">Aún no hay opiniones. ¡Sé el primero en opinar!</p>';
        return;
    }
    
    container.innerHTML = opinions.map(opinion => `
        <div class="opinion-item">
            <div class="opinion-stars">${'★'.repeat(opinion.stars)}${'☆'.repeat(5 - opinion.stars)}</div>
            <p class="opinion-text">"${escapeHtml(opinion.text)}"</p>
            <p class="opinion-date">${opinion.date}</p>
        </div>
    `).join('');
}

// ===== FUNCIONES DE CONTACTO =====
function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    if (!name || !email || !message) {
        alert('Por favor completa todos los campos.');
        return;
    }
    
    const newMessage = {
        id: Date.now(),
        name,
        email,
        message,
        date: new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    messages.unshift(newMessage);
    saveData();
    renderAdminMessages();
    
    // Resetear formulario
    document.getElementById('contactForm').reset();
    
    alert('¡Mensaje enviado con éxito! Te contactaremos pronto.');
}

// ===== FUNCIONES ADMIN =====
function openAdminModal() {
    document.getElementById('adminModal').classList.add('show');
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminError').textContent = '';
    document.getElementById('adminPassword').focus();
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('show');
}

function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('adminError').textContent = '';
        // Renderizar datos actualizados
        renderAdminArticles();
        renderAdminOpinions();
        renderAdminMessages();
    } else {
        document.getElementById('adminError').textContent = 'Clave incorrecta. Intenta nuevamente.';
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tab}`);
    });
}

// ===== ADMIN: ARTÍCULOS =====
function handleAddArticle() {
    const name = document.getElementById('newArticleName').value.trim();
    const stock = parseInt(document.getElementById('newArticleStock').value);
    
    if (!name || isNaN(stock) || stock < 0) {
        alert('Por favor ingresa un nombre y stock válido.');
        return;
    }
    
    // Verificar si ya existe
    const existing = articles.find(a => a.nombre.toLowerCase() === name.toLowerCase());
    if (existing) {
        existing.stock = stock;
    } else {
        articles.push({ nombre: name, stock });
    }
    
    saveData();
    renderAdminArticles();
    document.getElementById('newArticleName').value = '';
    document.getElementById('newArticleStock').value = '';
    
    alert('Artículo guardado correctamente.');
}

function renderAdminArticles() {
    const container = document.getElementById('articlesList');
    
    if (articles.length === 0) {
        container.innerHTML = '<p style="color: var(--gris);">No hay artículos registrados.</p>';
        return;
    }
    
    container.innerHTML = articles.map((article, index) => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${escapeHtml(article.nombre)}</h4>
                <p>Stock: ${article.stock} unidades</p>
            </div>
            <div>
                <button class="btn-delete" onclick="deleteArticle(${index})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function deleteArticle(index) {
    if (confirm('¿Seguro que quieres eliminar este artículo?')) {
        articles.splice(index, 1);
        saveData();
        renderAdminArticles();
    }
}

// ===== ADMIN: OPINIONES =====
function renderAdminOpinions() {
    const container = document.getElementById('adminOpinionsList');
    
    if (opinions.length === 0) {
        container.innerHTML = '<p style="color: var(--gris);">No hay opiniones registradas.</p>';
        return;
    }
    
    container.innerHTML = opinions.map((opinion, index) => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${'★'.repeat(opinion.stars)}${'☆'.repeat(5 - opinion.stars)}</h4>
                <p>"${escapeHtml(opinion.text)}"</p>
                <p style="font-size: 0.8rem; color: var(--gris);">${opinion.date}</p>
            </div>
            <button class="btn-delete" onclick="deleteOpinion(${index})">Eliminar</button>
        </div>
    `).join('');
}

function deleteOpinion(index) {
    if (confirm('¿Seguro que quieres eliminar esta opinión?')) {
        opinions.splice(index, 1);
        saveData();
        renderOpinions();
        renderAdminOpinions();
    }
}

// ===== ADMIN: MENSAJES =====
function renderAdminMessages() {
    const container = document.getElementById('adminMessagesList');
    
    if (messages.length === 0) {
        container.innerHTML = '<p style="color: var(--gris);">No hay mensajes de contacto.</p>';
        return;
    }
    
    container.innerHTML = messages.map((msg, index) => `
        <div class="admin-item">
            <div class="admin-item-info">
                <h4>${escapeHtml(msg.name)} (${escapeHtml(msg.email)})</h4>
                <p>${escapeHtml(msg.message)}</p>
                <p style="font-size: 0.8rem; color: var(--gris);">${msg.date}</p>
            </div>
            <button class="btn-delete" onclick="deleteMessage(${index})">Eliminar</button>
        </div>
    `).join('');
}

function deleteMessage(index) {
    if (confirm('¿Seguro que quieres eliminar este mensaje?')) {
        messages.splice(index, 1);
        saveData();
        renderAdminMessages();
    }
}

// ===== FUNCIÓN AUXILIAR =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}