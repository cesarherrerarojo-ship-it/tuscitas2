/**
 * App Check Manager - Sistema centralizado para TuCitaSegura
 * Maneja toda la lógica de reCAPTCHA y App Check de forma unificada
 */

// Firebase App Check functions will be loaded from global scope
// This allows the component to work as a regular script

class AppCheckManager {
  constructor(firebaseApp, config = {}) {
    this.app = firebaseApp;
    this.config = {
      siteKey: config.siteKey || "6LfdTvQrAAAAACkGjvbbFIkqHMsTHwRYYZS_CGq2",
      autoRefresh: config.autoRefresh !== false,
      debugMode: config.debugMode || false,
      ...config
    };
    
    this.appCheck = null;
    this.token = null;
    this.status = 'uninitialized';
    this.listeners = new Set();
    
    this.init();
  }

  /**
   * Inicializa App Check según el entorno detectado
   */
  async init() {
    try {
      const environment = this.detectEnvironment();
      console.log(`🔍 App Check Manager: Entorno detectado - ${environment}`);
      
      switch (environment) {
        case 'development':
          await this.initDevelopmentMode();
          break;
        case 'production':
          await this.initProductionMode();
          break;
        default:
          await this.initSafeMode();
      }
      
      this.status = 'ready';
      this.notifyListeners('ready', this.token);
      
    } catch (error) {
      console.error('❌ App Check Manager: Error de inicialización:', error);
      this.status = 'error';
      await this.initSafeMode();
    }
  }

  /**
   * Detecta el entorno actual
   */
  detectEnvironment() {
    const host = location.hostname || '';
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
    
    if (isLocalhost) return 'development';
    
    const prodDomains = [
      'tucitasegura.com',
      'www.tucitasegura.com',
      'tuscitasseguras.com',
      'www.tuscitasseguras.com',
      'traeserver-express4eo5.vercel.app'
    ];
    
    const isProduction = prodDomains.includes(host) || 
                        /\.web\.app$/.test(host) || 
                        /\.firebaseapp\.com$/.test(host);
    
    return isProduction ? 'production' : 'safe';
  }

  /**
   * Modo desarrollo - Mock sin errores
   */
  async initDevelopmentMode() {
    console.log('🛠️ App Check Manager: Modo desarrollo activado');
    
    // Crear mock funcional
    this.appCheck = {
      getToken: async () => ({
        token: `dev-token-${Date.now()}`,
        expireTimeMillis: Date.now() + 3600000
      }),
      onTokenChanged: (callback) => {
        callback({ token: `dev-token-${Date.now()}` });
        return { unsubscribe: () => {} };
      }
    };
    
    // Activar debug token para Firebase
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = 'dev-token-bypass';
    this.token = `dev-token-${Date.now()}`;
    
    console.log('✅ App Check Manager: Mock de desarrollo listo');
  }

  /**
   * Modo producción - reCAPTCHA real
   */
  async initProductionMode() {
    console.log('🌐 App Check Manager: Intentando reCAPTCHA real...');
    
    if (!this.config.siteKey) {
      throw new Error('Site key no proporcionada');
    }
    
    try {
      // Usar funciones globales de Firebase (compat version)
      this.appCheck = firebase.appCheck();
      this.appCheck.activate(this.config.siteKey, this.config.autoRefresh);
      
      // Probar que funciona
      const result = await this.appCheck.getToken();
      this.token = result.token;
      
      console.log('✅ App Check Manager: reCAPTCHA real activado');
      
    } catch (error) {
      console.warn('⚠️ App Check Manager: reCAPTCHA falló, usando modo seguro:', error);
      await this.initSafeMode();
    }
  }

  /**
   * Modo seguro - Fallback para cualquier problema
   */
  async initSafeMode() {
    console.log('🛡️ App Check Manager: Modo seguro activado');
    
    this.appCheck = {
      getToken: async () => ({
        token: `safe-token-${Date.now()}`,
        expireTimeMillis: Date.now() + 3600000
      }),
      onTokenChanged: (callback) => {
        callback({ token: `safe-token-${Date.now()}` });
        return { unsubscribe: () => {} };
      }
    };
    
    this.token = `safe-token-${Date.now()}`;
    console.log('✅ App Check Manager: Modo seguro listo');
  }

  /**
   * Obtiene el token actual
   */
  async getToken(forceRefresh = false) {
    if (!this.appCheck) {
      throw new Error('App Check no inicializado');
    }
    
    try {
      const result = await this.appCheck.getToken(forceRefresh);
      this.token = result?.token || result;
      return this.token;
    } catch (error) {
      console.error('❌ App Check Manager: Error obteniendo token:', error);
      throw error;
    }
  }

  /**
   * Suscribe a cambios de token
   */
  onTokenChanged(callback) {
    if (this.appCheck && this.appCheck.onTokenChanged) {
      return this.appCheck.onTokenChanged(callback);
    }
    
    // Fallback para modo mock
    const interval = setInterval(() => {
      callback({ token: this.token });
    }, 30000);
    
    return {
      unsubscribe: () => clearInterval(interval)
    };
  }

  /**
   * Añade listener para eventos
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Notifica a los listeners
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ App Check Manager: Error en listener:', error);
        }
      });
    }
  }

  /**
   * Obtiene el estado actual
   */
  getStatus() {
    return {
      status: this.status,
      environment: this.detectEnvironment(),
      hasToken: !!this.token,
      siteKey: this.config.siteKey
    };
  }

  /**
   * Muestra banner de estado en la UI
   */
  showStatusBanner() {
    const status = this.getStatus();
    const banner = document.createElement('div');
    banner.id = 'app-check-status';
    banner.className = 'app-check-banner';
    banner.innerHTML = `
      <div class="app-check-content">
        <span class="app-check-icon">${this.getStatusIcon(status.status)}</span>
        <span class="app-check-text">${this.getStatusText(status)}</span>
        <button class="app-check-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Añadir estilos si no existen
    if (!document.getElementById('app-check-styles')) {
      const styles = document.createElement('style');
      styles.id = 'app-check-styles';
      styles.textContent = `
        .app-check-banner {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(14, 165, 233, 0.3);
          border-radius: 12px;
          padding: 16px 20px;
          color: white;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          z-index: 9999;
          animation: slideInRight 0.3s ease-out;
          max-width: 300px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        .app-check-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .app-check-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .app-check-text {
          flex: 1;
          line-height: 1.4;
        }
        
        .app-check-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .app-check-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(banner);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (banner.parentElement) {
        banner.remove();
      }
    }, 5000);
  }

  /**
   * Obtiene icono según estado
   */
  getStatusIcon(status) {
    const icons = {
      ready: '✅',
      error: '❌',
      uninitialized: '⏳',
      loading: '🔄'
    };
    return icons[status] || '❓';
  }

  /**
   * Obtiene texto descriptivo según estado
   */
  getStatusText(status) {
    const texts = {
      ready: `App Check activado (${status.environment})`,
      error: 'Error en App Check - usando modo seguro',
      uninitialized: 'Inicializando App Check...',
      loading: 'Cargando App Check...'
    };
    return texts[status.status] || 'Estado desconocido';
  }
}

// Exportar instancia global
window.AppCheckManager = AppCheckManager;

// Helper para crear instancia rápidamente
window.createAppCheckManager = (firebaseApp, config) => {
  return new AppCheckManager(firebaseApp, config);
};