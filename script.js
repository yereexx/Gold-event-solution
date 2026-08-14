(function() {
    // ===== CONFIGURACIÓN DE SUPABASE =====
    const SUPABASE_URL = 'https://bwnwofpyjzhehaomyaqe.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_2a4SXDYxuB-y9qCxglFWzg_PbNjWfpo';

    // Verificar que la librería de Supabase esté cargada
    if (!window.supabase) {
        console.error('Supabase no está cargado. Asegúrate de incluir el script de Supabase antes de este archivo.');
        document.body.innerHTML = '<div style="text-align:center; padding:2rem; color:red;">Error: no se pudo cargar la librería de Supabase.</div>';
        throw new Error('Supabase library missing');
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ===== ESTADO =====
    let selectedStars = 0;
    let adminSession = null;

    // ===== INICIALIZACIÓN =====
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Script cargado y DOM listo');
        renderOpinions();
        renderAdminArticles();
        renderAdminOpinions();
        renderAdminMessages();
        setupEventListeners();
        checkAdminSession();
    });

    // ===== VERIFICAR SESIÓN DE ADMIN =====
    async function checkAdminSession() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            adminSession = session;
            if (session) {
                const btnAdmin = document.getElementById('btnAdmin');
                if (btnAdmin) btnAdmin.textContent = 'Admin (conectado)';
            }
        } catch (error) {
            console.error('Error al obtener sesión:', error);
        }
    }

    // ===== SETUP EVENT LISTENERS =====
    function setupEventListeners() {
        const hamburger = document.querySelector('.hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                document.querySelector('.nav-menu')?.classList.toggle('active');
            });
        }

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelector('.nav-menu')?.classList.remove('active');
            });
        });

        const searchForm = document.getElementById('searchForm');
        if (searchForm) searchForm.addEventListener('submit', handleSearch);

        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                selectedStars = parseInt(star.dataset.value);
                updateStarsDisplay();
            });
            star.addEventListener('mouseenter', () => {
                highlightStars(parseInt(star.dataset.value));
            });
            star.addEventListener('mouseleave', () => {
                updateStarsDisplay();
            });
        });

        const submitOpinion = document.getElementById('submitOpinion');
        if (submitOpinion) submitOpinion.addEventListener('click', handleSubmitOpinion);

        const contactForm = document.getElementById('contactForm');
        if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

        const btnAdmin = document.getElementById('btnAdmin');
        if (btnAdmin) btnAdmin.addEventListener('click', openAdminModal);

        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.addEventListener('click', closeAdminModal);

        const btnLoginAdmin = document.getElementById('btnLoginAdmin');
        if (btnLoginAdmin) btnLoginAdmin.addEventListener('click', handleAdminLogin);

        const adminPassword = document.getElementById('adminPassword');
        if (adminPassword) {
            adminPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleAdminLogin();
            });
        }

        const adminEmail = document.getElementById('adminEmail');
        if (adminEmail) {
            adminEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleAdminLogin();
            });
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        const btnAddArticle = document.getElementById('btnAddArticle');
        if (btnAddArticle) btnAddArticle.addEventListener('click', handleAddArticle);

        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) btnLogout.addEventListener('click', handleLogout);

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('adminModal');
            if (modal && e.target === modal) closeAdminModal();
        });
    }

    // ===== CERRAR SESIÓN =====
    async function handleLogout() {
        try {
            await supabase.auth.signOut();
            adminSession = null;
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('adminLogin').style.display = 'block';
            const btnAdmin = document.getElementById('btnAdmin');
            if (btnAdmin) btnAdmin.textContent = 'Admin';
            document.getElementById('adminEmail').value = '';
            document.getElementById('adminPassword').value = '';
            alert('Sesión cerrada correctamente.');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('No se pudo cerrar sesión.');
        }
    }

    // ===== FUNCIONES DE BÚSQUEDA =====
    async function handleSearch(e) {
        e.preventDefault();
        const query = document.getElementById('searchInput').value.trim();
        const resultDiv = document.getElementById('searchResult');

        if (!query) {
            resultDiv.className = 'search-result empty';
            resultDiv.textContent = 'Por favor ingresa un nombre de artículo.';
            return;
        }

        try {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .ilike('nombre', `%${query}%`);

            if (error) throw error;

            if (data.length > 0) {
                resultDiv.className = 'search-result success';
                resultDiv.innerHTML = data.map(article => {
                    const stockMsg = article.stock > 0
                        ? `✅ "${article.nombre}" disponible. Stock: ${article.stock}`
                        : `❌ "${article.nombre}" agotado.`;
                    return `<p>${stockMsg}</p>`;
                }).join('');
            } else {
                resultDiv.className = 'search-result empty';
                resultDiv.textContent = `🔍 No se encontró "${query}".`;
            }
        } catch (error) {
            console.error('Error buscando:', error);
            resultDiv.className = 'search-result error';
            resultDiv.textContent = 'Ocurrió un error al buscar. Revisa la consola para más detalles.';
        }
    }

    // ===== FUNCIONES DE ESTRELLAS =====
    function highlightStars(value) {
        document.querySelectorAll('.star').forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.classList.toggle('active', starValue <= value);
        });
    }

    function updateStarsDisplay() {
        document.querySelectorAll('.star').forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.classList.toggle('active', starValue <= selectedStars);
        });

        const ratingText = document.getElementById('starRatingText');
        if (ratingText) {
            const texts = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
            ratingText.textContent = selectedStars > 0 ? texts[selectedStars] : 'Selecciona una calificación';
        }
    }

    // ===== FUNCIONES DE OPINIONES =====
    async function handleSubmitOpinion() {
        const opinionText = document.getElementById('opinionText').value.trim();
        if (selectedStars === 0) {
            alert('Por favor selecciona una calificación de estrellas.');
            return;
        }
        if (!opinionText) {
            alert('Por favor escribe tu opinión.');
            return;
        }

        try {
            const { error } = await supabase
                .from('opinions')
                .insert([{ stars: selectedStars, text: opinionText }]);

            if (error) throw error;

            selectedStars = 0;
            updateStarsDisplay();
            document.getElementById('opinionText').value = '';
            alert('¡Gracias por tu opinión!');
            renderOpinions();
        } catch (error) {
            alert('Error al enviar opinión. Detalle: ' + error.message);
            console.error(error);
        }
    }

    async function renderOpinions() {
        const container = document.getElementById('opinionsList');
        if (!container) return;

        try {
            const { data, error } = await supabase
                .from('opinions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                container.innerHTML = '<p style="color: var(--gris); text-align: center;">Aún no hay opiniones.</p>';
                return;
            }

            container.innerHTML = data.map(opinion => `
                <div class="opinion-item">
                    <div class="opinion-stars">${'★'.repeat(opinion.stars)}${'☆'.repeat(5 - opinion.stars)}</div>
                    <p class="opinion-text">"${escapeHtml(opinion.text)}"</p>
                    <p class="opinion-date">${new Date(opinion.created_at).toLocaleDateString('es-ES')}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando opiniones:', error);
        }
    }

    // ===== FUNCIONES DE CONTACTO =====
    async function handleContactSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        if (!name || !email || !message) {
            alert('Por favor completa todos los campos.');
            return;
        }

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{ name, email, message }]);

            if (error) throw error;

            document.getElementById('contactForm').reset();
            alert('¡Mensaje enviado! Te contactaremos pronto.');
            renderAdminMessages();
        } catch (error) {
            alert('Error al enviar mensaje. Detalle: ' + error.message);
            console.error(error);
        }
    }

    // ===== FUNCIONES ADMIN =====
    async function openAdminModal() {
        const modal = document.getElementById('adminModal');
        const loginDiv = document.getElementById('adminLogin');
        const panelDiv = document.getElementById('adminPanel');
        const adminEmail = document.getElementById('adminEmail');
        const adminPassword = document.getElementById('adminPassword');
        const adminError = document.getElementById('adminError');

        if (!modal || !loginDiv || !panelDiv) return;

        if (adminSession) {
            loginDiv.style.display = 'none';
            panelDiv.style.display = 'block';
            loadAdminData();
        } else {
            loginDiv.style.display = 'block';
            panelDiv.style.display = 'none';
            if (adminPassword) adminPassword.value = '';
            if (adminEmail) adminEmail.value = '';
            if (adminError) adminError.textContent = '';
            if (adminEmail) adminEmail.focus();
        }
        modal.classList.add('show');
    }

    function closeAdminModal() {
        const modal = document.getElementById('adminModal');
        if (modal) modal.classList.remove('show');
    }

    async function handleAdminLogin() {
        const email = document.getElementById('adminEmail')?.value.trim();
        const password = document.getElementById('adminPassword')?.value;
        const adminError = document.getElementById('adminError');

        if (!email || !password) {
            if (adminError) adminError.textContent = 'Ingresa email y contraseña.';
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;

            adminSession = data.session;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            if (adminError) adminError.textContent = '';
            document.getElementById('adminPassword').value = '';
            loadAdminData();

            const btnAdmin = document.getElementById('btnAdmin');
            if (btnAdmin) btnAdmin.textContent = 'Admin (conectado)';
        } catch (error) {
            if (adminError) adminError.textContent = 'Credenciales incorrectas. ' + error.message;
            console.error('Error en login:', error);
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

    async function loadAdminData() {
        renderAdminArticles();
        renderAdminOpinions();
        renderAdminMessages();
    }

    // ===== ADMIN: ARTÍCULOS =====
    async function handleAddArticle() {
        const name = document.getElementById('newArticleName').value.trim();
        const stock = parseInt(document.getElementById('newArticleStock').value);

        if (!name || isNaN(stock) || stock < 0) {
            alert('Por favor ingresa un nombre y stock válido.');
            return;
        }

        try {
            const { data: existing, error: searchError } = await supabase
                .from('articles')
                .select('*')
                .ilike('nombre', name)
                .maybeSingle();

            if (searchError) throw searchError;

            if (existing) {
                const { error: updateError } = await supabase
                    .from('articles')
                    .update({ stock })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
                alert('Stock actualizado correctamente.');
            } else {
                const { error: insertError } = await supabase
                    .from('articles')
                    .insert([{ nombre: name, stock }]);
                if (insertError) throw insertError;
                alert('Artículo agregado correctamente.');
            }

            document.getElementById('newArticleName').value = '';
            document.getElementById('newArticleStock').value = '';
            renderAdminArticles();
        } catch (error) {
            alert('Error al guardar el artículo. Detalle: ' + error.message);
            console.error(error);
        }
    }

    async function renderAdminArticles() {
        const container = document.getElementById('articlesList');
        if (!container || !adminSession) return;

        try {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('nombre');

            if (error) throw error;

            if (data.length === 0) {
                container.innerHTML = '<p style="color: var(--gris);">No hay artículos registrados.</p>';
                return;
            }

            container.innerHTML = data.map(article => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${escapeHtml(article.nombre)}</h4>
                        <p>Stock: ${article.stock} unidades</p>
                    </div>
                    <button class="btn-delete" data-id="${article.id}">Eliminar</button>
                </div>
            `).join('');

            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => deleteArticle(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error cargando artículos:', error);
        }
    }

    async function deleteArticle(id) {
        if (!confirm('¿Seguro que quieres eliminar este artículo?')) return;

        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            renderAdminArticles();
        } catch (error) {
            alert('Error al eliminar. Detalle: ' + error.message);
            console.error(error);
        }
    }

    // ===== ADMIN: OPINIONES =====
    async function renderAdminOpinions() {
        const container = document.getElementById('adminOpinionsList');
        if (!container || !adminSession) return;

        try {
            const { data, error } = await supabase
                .from('opinions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                container.innerHTML = '<p style="color: var(--gris);">No hay opiniones registradas.</p>';
                return;
            }

            container.innerHTML = data.map(opinion => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${'★'.repeat(opinion.stars)}${'☆'.repeat(5 - opinion.stars)}</h4>
                        <p>"${escapeHtml(opinion.text)}"</p>
                        <p style="font-size: 0.8rem; color: var(--gris);">${new Date(opinion.created_at).toLocaleString('es-ES')}</p>
                    </div>
                    <button class="btn-delete" data-id="${opinion.id}">Eliminar</button>
                </div>
            `).join('');

            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => deleteOpinion(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error cargando opiniones:', error);
        }
    }

    async function deleteOpinion(id) {
        if (!confirm('¿Eliminar esta opinión?')) return;

        try {
            const { error } = await supabase
                .from('opinions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            renderAdminOpinions();
            renderOpinions();
        } catch (error) {
            alert('Error al eliminar. Detalle: ' + error.message);
            console.error(error);
        }
    }

    // ===== ADMIN: MENSAJES =====
    async function renderAdminMessages() {
        const container = document.getElementById('adminMessagesList');
        if (!container || !adminSession) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data.length === 0) {
                container.innerHTML = '<p style="color: var(--gris);">No hay mensajes de contacto.</p>';
                return;
            }

            container.innerHTML = data.map(msg => `
                <div class="admin-item">
                    <div class="admin-item-info">
                        <h4>${escapeHtml(msg.name)} (${escapeHtml(msg.email)})</h4>
                        <p>${escapeHtml(msg.message)}</p>
                        <p style="font-size: 0.8rem; color: var(--gris);">${new Date(msg.created_at).toLocaleString('es-ES')}</p>
                    </div>
                    <button class="btn-delete" data-id="${msg.id}">Eliminar</button>
                </div>
            `).join('');

            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => deleteMessage(btn.dataset.id));
            });
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    }

    async function deleteMessage(id) {
        if (!confirm('¿Eliminar este mensaje?')) return;

        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', id);

            if (error) throw error;
            renderAdminMessages();
        } catch (error) {
            alert('Error al eliminar. Detalle: ' + error.message);
            console.error(error);
        }
    }

    // ===== FUNCIÓN AUXILIAR =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();