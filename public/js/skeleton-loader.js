/**
 * SkeletonLoader - Componente para mostrar esqueletos de carga mientras se cargan los datos
 * Mejora la percepción de rendimiento y la experiencia de usuario
 */

class SkeletonLoader {
  constructor() {
    this.skeletons = new Map();
    this.observers = new Map();
  }

  /**
   * Inicializa el SkeletonLoader
   */
  initialize() {
    this.injectStyles();
    console.log('✅ SkeletonLoader inicializado');
  }

  /**
   * Inyecta los estilos CSS para los esqueletos
   */
  injectStyles() {
    if (document.getElementById('skeleton-styles')) return;

    const styles = `
      .skeleton {
        background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 0.5rem;
      }
      
      .skeleton-text {
        height: 1rem;
        margin-bottom: 0.5rem;
      }
      
      .skeleton-text:last-child {
        margin-bottom: 0;
      }
      
      .skeleton-avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
      }
      
      .skeleton-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 0.75rem;
      }
      
      .skeleton-button {
        height: 2.5rem;
        width: 100px;
        border-radius: 0.5rem;
      }
      
      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .skeleton-fade-out {
        animation: skeleton-fade-out 0.3s ease-out forwards;
      }
      
      @keyframes skeleton-fade-out {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'skeleton-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Crea un esqueleto para una tarjeta de perfil
   */
  createProfileCard() {
    return `
      <div class="skeleton-card">
        <div class="flex items-center gap-4 mb-4">
          <div class="skeleton skeleton-avatar"></div>
          <div class="flex-1">
            <div class="skeleton skeleton-text w-3/4"></div>
            <div class="skeleton skeleton-text w-1/2"></div>
          </div>
        </div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text w-5/6"></div>
        <div class="flex gap-2 mt-4">
          <div class="skeleton skeleton-button"></div>
          <div class="skeleton skeleton-button"></div>
        </div>
      </div>
    `;
  }

  /**
   * Crea un esqueleto para una conversación
   */
  createConversationItem() {
    return `
      <li class="skeleton-card">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="skeleton skeleton-avatar w-12 h-12"></div>
            <div>
              <div class="skeleton skeleton-text w-24"></div>
              <div class="skeleton skeleton-text w-16"></div>
            </div>
          </div>
          <div class="flex gap-2">
            <div class="skeleton skeleton-button w-20"></div>
            <div class="skeleton skeleton-button w-16"></div>
          </div>
        </div>
      </li>
    `;
  }

  /**
   * Crea un esqueleto para el perfil del usuario
   */
  createProfileSkeleton() {
    return `
      <div class="space-y-6">
        <div class="skeleton-card">
          <div class="flex items-center gap-6 mb-6">
            <div class="skeleton skeleton-avatar w-24 h-24"></div>
            <div class="flex-1">
              <div class="skeleton skeleton-text w-32"></div>
              <div class="skeleton skeleton-text w-48"></div>
              <div class="skeleton skeleton-text w-24 mt-2"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
          </div>
        </div>
        
        <div class="skeleton-card">
          <div class="skeleton skeleton-text w-40 mb-4"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text w-3/4"></div>
        </div>
      </div>
    `;
  }

  /**
   * Muestra esqueletos en un contenedor
   */
  showSkeletons(containerId, type = 'profile', count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Limpiar contenido existente
    container.innerHTML = '';

    // Crear esqueletos según el tipo
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'profile':
          skeletonHTML += this.createProfileCard();
          break;
        case 'conversation':
          skeletonHTML += this.createConversationItem();
          break;
        case 'profile-full':
          skeletonHTML += this.createProfileSkeleton();
          break;
        default:
          skeletonHTML += this.createProfileCard();
      }
    }

    container.innerHTML = skeletonHTML;
    container.classList.add('skeleton-container');
  }

  /**
   * Oculta los esqueletos con animación de desvanecimiento
   */
  hideSkeletons(containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletons = container.querySelectorAll('.skeleton-card, .skeleton');
    
    if (skeletons.length === 0) {
      if (callback) callback();
      return;
    }

    // Agregar clase de desvanecimiento
    skeletons.forEach(skeleton => {
      skeleton.classList.add('skeleton-fade-out');
    });

    // Esperar a que termine la animación antes de limpiar
    setTimeout(() => {
      container.innerHTML = '';
      container.classList.remove('skeleton-container');
      if (callback) callback();
    }, 300);
  }

  /**
   * Muestra esqueletos con lazy loading usando Intersection Observer
   */
  showLazySkeletons(containerId, type = 'profile', count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Limpiar observer anterior si existe
    if (this.observers.has(containerId)) {
      this.observers.get(containerId).disconnect();
    }

    // Crear observer para lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Reemplazar placeholder con esqueleto real
          const placeholder = entry.target;
          const skeleton = this.createSkeletonByType(type);
          placeholder.outerHTML = skeleton;
          
          // Dejar de observar este elemento
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px'
    });

    // Crear placeholders para lazy loading
    let placeholdersHTML = '';
    for (let i = 0; i < count; i++) {
      placeholdersHTML += `<div class="skeleton-placeholder" style="height: 200px; margin-bottom: 1rem;"></div>`;
    }

    container.innerHTML = placeholdersHTML;
    
    // Observar cada placeholder
    const placeholders = container.querySelectorAll('.skeleton-placeholder');
    placeholders.forEach(placeholder => {
      observer.observe(placeholder);
    });

    // Guardar observer
    this.observers.set(containerId, observer);
  }

  /**
   * Crea esqueleto según tipo
   */
  createSkeletonByType(type) {
    switch (type) {
      case 'conversation':
        return this.createConversationItem();
      case 'profile-full':
        return this.createProfileSkeleton();
      default:
        return this.createProfileCard();
    }
  }

  /**
   * Limpia todos los observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Hacer disponible globalmente
window.SkeletonLoader = SkeletonLoader;