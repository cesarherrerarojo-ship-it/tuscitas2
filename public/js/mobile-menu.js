/**
 * Mobile Menu Component - Menú móvil moderno para TuCitaSegura
 * Responsive, accesible y con animaciones suaves
 */

class MobileMenu {
  constructor(options = {}) {
    this.options = {
      menuId: options.menuId || 'mobile-menu',
      toggleId: options.toggleId || 'mobile-menu-toggle',
      overlayClass: options.overlayClass || 'mobile-menu-overlay',
      animationDuration: options.animationDuration || 300,
      closeOnLinkClick: options.closeOnLinkClick !== false,
      trapFocus: options.trapFocus !== false,
      ...options
    };
    
    this.isOpen = false;
    this.menu = null;
    this.toggle = null;
    this.overlay = null;
    this.focusableElements = [];
    this.firstFocusable = null;
    this.lastFocusable = null;
    
    this.init();
  }

  /**
   * Inicializa el menú móvil
   */
  init() {
    this.createMenuHTML();
    this.createStyles();
    this.bindEvents();
    this.setupAccessibility();
    console.log('📱 Mobile Menu: Inicializado');
  }

  /**
   * Crea el HTML del menú móvil
   */
  createMenuHTML() {
    // Crear botón toggle si no existe
    if (!document.getElementById(this.options.toggleId)) {
      const header = document.querySelector('header');
      if (header) {
        const toggle = document.createElement('button');
        toggle.id = this.options.toggleId;
        toggle.className = 'mobile-menu-toggle';
        toggle.innerHTML = `
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        `;
        toggle.setAttribute('aria-label', 'Abrir menú');
        toggle.setAttribute('aria-expanded', 'false');
        header.appendChild(toggle);
      }
    }

    // Crear menú si no existe
    if (!document.getElementById(this.options.menuId)) {
      const menuHTML = `
        <div id="${this.options.menuId}" class="mobile-menu" role="dialog" aria-modal="true" aria-hidden="true">
          <div class="mobile-menu-header">
            <div class="mobile-menu-brand">
              <span class="brand-icon">💝</span>
              <span class="brand-text">TuCitaSegura</span>
            </div>
            <button id="${this.options.menuId}-close" class="mobile-menu-close" aria-label="Cerrar menú">
              <span></span>
              <span></span>
            </button>
          </div>
          
          <nav class="mobile-menu-nav">
            <div class="mobile-menu-user" id="mobile-menu-user">
              <div class="user-avatar">
                <span class="avatar-placeholder">👤</span>
              </div>
              <div class="user-info">
                <span class="user-name">Invitado</span>
                <span class="user-status">Sin conectar</span>
              </div>
            </div>
            
            <ul class="mobile-menu-links">
              <li><a href="/" class="menu-link" data-page="home">
                <span class="link-icon">🏠</span>
                <span class="link-text">Inicio</span>
              </a></li>
              <li><a href="/buscar" class="menu-link" data-page="buscar">
                <span class="link-icon">🔍</span>
                <span class="link-text">Buscar</span>
              </a></li>
              <li><a href="/conversaciones" class="menu-link" data-page="conversaciones">
                <span class="link-icon">💬</span>
                <span class="link-text">Mensajes</span>
                <span class="link-badge" id="message-badge" style="display: none;">0</span>
              </a></li>
              <li><a href="/perfil" class="menu-link" data-page="perfil">
                <span class="link-icon">👤</span>
                <span class="link-text">Perfil</span>
              </a></li>
              <li><a href="/ayuda" class="menu-link" data-page="ayuda">
                <span class="link-icon">❓</span>
                <span class="link-text">Ayuda</span>
              </a></li>
            </ul>
          </nav>
          
          <div class="mobile-menu-footer">
            <div class="menu-actions">
              <button id="mobile-menu-login" class="menu-btn menu-btn-primary">
                <span class="btn-icon">🔓</span>
                Iniciar Sesión
              </button>
              <button id="mobile-menu-logout" class="menu-btn menu-btn-secondary" style="display: none;">
                <span class="btn-icon">🚪</span>
                Cerrar Sesión
              </button>
            </div>
            
            <div class="mobile-menu-stats">
              <div class="stat-item">
                <span class="stat-value" id="user-reputation">--</span>
                <span class="stat-label">Reputación</span>
              </div>
              <div class="stat-item">
                <span class="stat-value" id="user-matches">--</span>
                <span class="stat-label">Matches</span>
              </div>
            </div>
          </div>
        </div>
        <div class="${this.options.overlayClass}" aria-hidden="true"></div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', menuHTML);
    }

    this.menu = document.getElementById(this.options.menuId);
    this.toggle = document.getElementById(this.options.toggleId);
    this.overlay = document.querySelector(`.${this.options.overlayClass}`);
  }

  /**
   * Crea los estilos del menú móvil
   */
  createStyles() {
    if (document.getElementById('mobile-menu-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'mobile-menu-styles';
    styles.textContent = `
      /* Botón hamburguesa */
      .mobile-menu-toggle {
        display: none;
        position: relative;
        width: 48px;
        height: 48px;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(14, 165, 233, 0.3);
        border-radius: 12px;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }
      
      .mobile-menu-toggle:hover {
        background: rgba(14, 165, 233, 0.2);
        border-color: rgba(14, 165, 233, 0.5);
      }
      
      .mobile-menu-toggle.active {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.5);
      }
      
      .hamburger-line {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 2px;
        background: #ffffff;
        border-radius: 1px;
        transition: all 0.3s ease;
      }
      
      .hamburger-line:nth-child(1) {
        top: 16px;
      }
      
      .hamburger-line:nth-child(2) {
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
      }
      
      .hamburger-line:nth-child(3) {
        bottom: 16px;
      }
      
      .mobile-menu-toggle.active .hamburger-line:nth-child(1) {
        top: 50%;
        transform: translateX(-50%) translateY(-50%) rotate(45deg);
      }
      
      .mobile-menu-toggle.active .hamburger-line:nth-child(2) {
        opacity: 0;
      }
      
      .mobile-menu-toggle.active .hamburger-line:nth-child(3) {
        bottom: 50%;
        transform: translateX(-50%) translateY(50%) rotate(-45deg);
      }

      /* Overlay */
      .mobile-menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .mobile-menu-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      /* Menú */
      .mobile-menu {
        position: fixed;
        top: 0;
        right: -100%;
        width: 320px;
        max-width: 90vw;
        height: 100vh;
        background: linear-gradient(135deg, #0F172A 0%, #1e293b 100%);
        backdrop-filter: blur(20px);
        border-left: 1px solid rgba(14, 165, 233, 0.2);
        z-index: 1001;
        transition: right 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      
      .mobile-menu.active {
        right: 0;
      }
      
      .mobile-menu-header {
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .mobile-menu-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 20px;
        font-weight: 700;
        color: #ffffff;
      }
      
      .brand-icon {
        font-size: 24px;
      }
      
      .mobile-menu-close {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .mobile-menu-close:hover {
        background: rgba(239, 68, 68, 0.2);
      }
      
      .mobile-menu-close span {
        position: absolute;
        width: 20px;
        height: 2px;
        background: #ffffff;
        border-radius: 1px;
        transform: rotate(45deg);
      }
      
      .mobile-menu-close span:last-child {
        transform: rotate(-45deg);
      }

      /* Usuario */
      .mobile-menu-user {
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .user-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      }
      
      .user-info {
        flex: 1;
      }
      
      .user-name {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 4px;
      }
      
      .user-status {
        display: block;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
      }

      /* Navegación */
      .mobile-menu-nav {
        flex: 1;
        padding: 8px 0;
        overflow-y: auto;
      }
      
      .mobile-menu-links {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .mobile-menu-links li {
        margin: 0;
      }
      
      .menu-link {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        transition: all 0.2s ease;
        position: relative;
        font-weight: 500;
      }
      
      .menu-link:hover {
        background: rgba(14, 165, 233, 0.1);
        color: #ffffff;
      }
      
      .menu-link.active {
        background: rgba(14, 165, 233, 0.2);
        color: #ffffff;
      }
      
      .menu-link.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 24px;
        background: #0ea5e9;
        border-radius: 0 2px 2px 0;
      }
      
      .link-icon {
        font-size: 20px;
        width: 24px;
        text-align: center;
      }
      
      .link-text {
        flex: 1;
      }
      
      .link-badge {
        background: #ef4444;
        color: white;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        min-width: 20px;
        text-align: center;
      }

      /* Footer */
      .mobile-menu-footer {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .menu-actions {
        margin-bottom: 20px;
      }
      
      .menu-btn {
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .menu-btn:last-child {
        margin-bottom: 0;
      }
      
      .menu-btn-primary {
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        color: white;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      }
      
      .menu-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
      }
      
      .menu-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .menu-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      /* Stats */
      .mobile-menu-stats {
        display: flex;
        gap: 16px;
      }
      
      .stat-item {
        flex: 1;
        text-align: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }
      
      .stat-value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: #0ea5e9;
        margin-bottom: 4px;
      }
      
      .stat-label {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .mobile-menu-toggle {
          display: block;
        }
      }
      
      @media (max-width: 480px) {
        .mobile-menu {
          width: 100%;
          max-width: 100vw;
        }
      }

      /* Animaciones adicionales */
      .mobile-menu-links li {
        opacity: 0;
        transform: translateX(20px);
        animation: slideInLeft 0.3s ease forwards;
      }
      
      .mobile-menu-links li:nth-child(1) { animation-delay: 0.1s; }
      .mobile-menu-links li:nth-child(2) { animation-delay: 0.15s; }
      .mobile-menu-links li:nth-child(3) { animation-delay: 0.2s; }
      .mobile-menu-links li:nth-child(4) { animation-delay: 0.25s; }
      .mobile-menu-links li:nth-child(5) { animation-delay: 0.3s; }
      
      @keyframes slideInLeft {
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Vincula eventos
   */
  bindEvents() {
    // Toggle
    this.toggle?.addEventListener('click', () => this.toggleMenu());
    
    // Cerrar
    const closeBtn = document.getElementById(`${this.options.menuId}-close`);
    closeBtn?.addEventListener('click', () => this.closeMenu());
    
    // Overlay
    this.overlay?.addEventListener('click', () => this.closeMenu());
    
    // Links
    if (this.options.closeOnLinkClick) {
      const links = this.menu?.querySelectorAll('.menu-link');
      links?.forEach(link => {
        link.addEventListener('click', () => this.closeMenu());
      });
    }
    
    // Botones de sesión
    const loginBtn = document.getElementById('mobile-menu-login');
    const logoutBtn = document.getElementById('mobile-menu-logout');
    
    loginBtn?.addEventListener('click', () => {
      this.closeMenu();
      // Disparar evento global para abrir modal de auth
      window.dispatchEvent(new CustomEvent('mobile-menu:login'));
    });
    
    logoutBtn?.addEventListener('click', () => {
      this.closeMenu();
      // Disparar evento global para logout
      window.dispatchEvent(new CustomEvent('mobile-menu:logout'));
    });
    
    // Teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });
    
    // Detectar página actual
    this.updateActiveLink();
  }

  /**
   * Configura accesibilidad
   */
  setupAccessibility() {
    this.toggle?.setAttribute('aria-expanded', 'false');
    this.menu?.setAttribute('aria-hidden', 'true');
    
    // Focus trap
    if (this.options.trapFocus) {
      this.setupFocusTrap();
    }
  }

  /**
   * Configura focus trap
   */
  setupFocusTrap() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    this.focusableElements = Array.from(
      this.menu?.querySelectorAll(focusableSelectors.join(',')) || []
    );
    
    if (this.focusableElements.length > 0) {
      this.firstFocusable = this.focusableElements[0];
      this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
      
      this.menu?.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === this.firstFocusable) {
              e.preventDefault();
              this.lastFocusable?.focus();
            }
          } else {
            if (document.activeElement === this.lastFocusable) {
              e.preventDefault();
              this.firstFocusable?.focus();
            }
          }
        }
      });
    }
  }

  /**
   * Abre el menú
   */
  openMenu() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.menu?.classList.add('active');
    this.overlay?.classList.add('active');
    this.toggle?.classList.add('active');
    
    // Actualizar ARIA
    this.toggle?.setAttribute('aria-expanded', 'true');
    this.menu?.setAttribute('aria-hidden', 'false');
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Focus
    setTimeout(() => {
      this.firstFocusable?.focus() || this.menu?.focus();
    }, 100);
    
    // Evento
    window.dispatchEvent(new CustomEvent('mobile-menu:opened'));
    
    console.log('📱 Mobile Menu: Abierto');
  }

  /**
   * Cierra el menú
   */
  closeMenu() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.menu?.classList.remove('active');
    this.overlay?.classList.remove('active');
    this.toggle?.classList.remove('active');
    
    // Actualizar ARIA
    this.toggle?.setAttribute('aria-expanded', 'false');
    this.menu?.setAttribute('aria-hidden', 'true');
    
    // Restaurar scroll
    document.body.style.overflow = '';
    
    // Focus al toggle
    this.toggle?.focus();
    
    // Evento
    window.dispatchEvent(new CustomEvent('mobile-menu:closed'));
    
    console.log('📱 Mobile Menu: Cerrado');
  }

  /**
   * Alterna el menú
   */
  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Actualiza el link activo según la página actual
   */
  updateActiveLink() {
    const currentPath = window.location.pathname;
    const links = this.menu?.querySelectorAll('.menu-link');
    
    links?.forEach(link => {
      const href = link.getAttribute('href');
      const page = link.getAttribute('data-page');
      
      if (href === currentPath || (page && currentPath.includes(page))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Actualiza la información del usuario
   */
  updateUserInfo(userData) {
    const userElement = document.getElementById('mobile-menu-user');
    const nameElement = document.querySelector('.user-name');
    const statusElement = document.querySelector('.user-status');
    const loginBtn = document.getElementById('mobile-menu-login');
    const logoutBtn = document.getElementById('mobile-menu-logout');
    
    if (userData && userData.name) {
      // Usuario conectado
      if (nameElement) nameElement.textContent = userData.name;
      if (statusElement) statusElement.textContent = userData.status || 'En línea';
      
      // Mostrar botón logout
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'flex';
      
      // Actualizar stats
      this.updateStats(userData.reputation, userData.matches);
      
    } else {
      // Usuario desconectado
      if (nameElement) nameElement.textContent = 'Invitado';
      if (statusElement) statusElement.textContent = 'Sin conectar';
      
      // Mostrar botón login
      if (loginBtn) loginBtn.style.display = 'flex';
      if (logoutBtn) logoutBtn.style.display = 'none';
      
      // Reset stats
      this.updateStats('--', '--');
    }
  }

  /**
   * Actualiza las estadísticas
   */
  updateStats(reputation, matches) {
    const reputationElement = document.getElementById('user-reputation');
    const matchesElement = document.getElementById('user-matches');
    
    if (reputationElement) reputationElement.textContent = reputation || '--';
    if (matchesElement) matchesElement.textContent = matches || '--';
  }

  /**
   * Actualiza el badge de mensajes
   */
  updateMessageBadge(count) {
    const badge = document.getElementById('message-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * Destruye el menú
   */
  destroy() {
    this.closeMenu();
    
    // Remover eventos
    this.toggle?.removeEventListener('click', this.toggleMenu);
    
    // Remover elementos
    this.menu?.remove();
    this.overlay?.remove();
    
    // Remover estilos
    const styles = document.getElementById('mobile-menu-styles');
    styles?.remove();
    
    console.log('📱 Mobile Menu: Destruido');
  }
}

// Exportar
window.MobileMenu = MobileMenu;

// Helper para crear instancia rápidamente
window.createMobileMenu = (options) => {
  return new MobileMenu(options);
};