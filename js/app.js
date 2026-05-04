/**
 * BuyerHub App Logic
 * Cart/Wishlist/Auth stores + Theme Engine + Utilities
 * Matching useCartStore.ts, useWishlistStore.ts, useAuthStore.ts
 */

(function () {
  'use strict';
  const BH = window.BH || {};

  // ========== CONSTANTS ==========
  const FLAT_RATE_NGN = 750;
  const FREE_SHIPPING_THRESHOLD = 50000;
  const SHIPPING_FEE = 2500;
  const STORAGE_PREFIX = 'BuyerHub';

  // ========== UTILITY FUNCTIONS ==========
  BH.formatPrice = function (amount) {
    if (amount == null) return '₦0';
    return '₦' + Number(amount).toLocaleString('en-NG');
  };

  BH.formatDiscount = function (percentage) {
    if (!percentage || percentage <= 0) return '';
    return '-' + Math.round(percentage) + '%';
  };

  BH.truncateText = function (text, wordCount) {
    if (!text) return '';
    var words = text.trim().split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  };

  /**
   * Show a toast notification. Mirrors React's NotificationProvider /
   * useNotification / <Toast> behavior (src/hooks/useNotification.ts,
   * src/components/UI/Toast.tsx).
   *
   * Signature: BH.showToast(message, variant, durationMs)
   *   - variant:   'info' | 'success' | 'warning' | 'error'  (default: 'success')
   *                NOTE: React defaults to 'info' but every existing call site
   *                in this codebase intends a success message, so we keep
   *                'success' as the default to preserve back-compat.
   *   - durationMs: number; 0 = sticky (must be closed manually). Default 3000.
   *
   * Returns a `dismiss` function so callers can close the toast programmatically.
   */
  BH.showToast = function (message, variant, durationMs) {
    var allowed = { info: 1, success: 1, warning: 1, error: 1 };
    variant = (variant && allowed[variant]) ? variant : 'success';
    if (typeof durationMs !== 'number') durationMs = 3000;

    // Lazy-create the stacking container (matches React <ToastContainer>).
    var container = document.getElementById('bh-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bh-toast-container';
      container.className = 'bh-toast-container';
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }

    // Bootstrap-icons equivalents of the lucide icons used in React Toast.tsx.
    var iconMap = {
      info: 'bi-info-circle-fill',
      success: 'bi-check-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      error: 'bi-exclamation-circle-fill'
    };

    var toast = document.createElement('div');
    toast.className = 'bh-toast bh-toast-' + variant;
    toast.setAttribute('role', variant === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');

    var icon = document.createElement('i');
    icon.className = 'bi ' + iconMap[variant] + ' bh-toast-icon';
    icon.setAttribute('aria-hidden', 'true');

    var msg = document.createElement('p');
    msg.className = 'bh-toast-message';
    msg.textContent = message == null ? '' : String(message);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'bh-toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML = '<i class="bi bi-x" aria-hidden="true"></i>';

    var dismissed = false;
    var autoTimer = null;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      toast.classList.remove('show');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }
    closeBtn.addEventListener('click', dismiss);

    toast.appendChild(icon);
    toast.appendChild(msg);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    // Trigger transition on next frame.
    setTimeout(function () { toast.classList.add('show'); }, 10);
    if (durationMs > 0) autoTimer = setTimeout(dismiss, durationMs);

    return dismiss;
  };

  BH.debounce = function (fn, delay) {
    var timer;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(context, args); }, delay);
    };
  };

  BH.getUrlParam = function (name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  // ========== THEME ENGINE ==========
  var themeColors = {
    default: {
      '--primary': '142 76% 68%', '--primary-foreground': '142 76% 98%', '--primary-hover': '142 76% 58%',
      '--secondary': '210 40% 96%', '--secondary-foreground': '222 47% 11%',
      '--accent': '142 60% 90%', '--accent-foreground': '142 60% 15%',
      '--background': '0 0% 100%', '--foreground': '222 84% 5%',
      '--card': '0 0% 100%', '--card-foreground': '222 84% 5%',
      '--popover': '0 0% 100%', '--popover-foreground': '222 84% 5%',
      '--muted': '210 40% 96%', '--muted-foreground': '215 16% 47%',
      '--destructive': '0 84% 60%', '--destructive-foreground': '0 0% 100%',
      '--success': '142 76% 50%', '--success-foreground': '0 0% 100%',
      '--warning': '38 92% 50%', '--warning-foreground': '0 0% 100%',
      '--border': '214 32% 91%', '--input': '214 32% 91%', '--ring': '142 76% 68%',
      '--header-bg': '200 40% 16%', '--header-text': '0 0% 100%', '--header-border': '200 40% 25%',
      '--footer-bg': '200 40% 16%', '--footer-text': '0 0% 100%', '--footer-border': '200 40% 25%',
      '--gradient-start': '142 76% 68%', '--gradient-end': '142 76% 45%',
      '--overlay': '0 0% 0% / 0.5',
      '--font-family': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-family-heading': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    dark: {
      '--primary': '142 90% 55%', '--primary-foreground': '142 90% 10%', '--primary-hover': '142 90% 65%',
      '--secondary': '220 15% 20%', '--secondary-foreground': '210 40% 98%',
      '--accent': '280 80% 60%', '--accent-foreground': '280 80% 98%',
      '--background': '222 47% 8%', '--foreground': '210 40% 98%',
      '--card': '222 47% 11%', '--card-foreground': '210 40% 98%',
      '--popover': '222 47% 11%', '--popover-foreground': '210 40% 98%',
      '--muted': '217 33% 17%', '--muted-foreground': '215 20% 65%',
      '--destructive': '0 90% 60%', '--destructive-foreground': '0 0% 100%',
      '--success': '142 90% 50%', '--success-foreground': '142 90% 10%',
      '--warning': '30 90% 55%', '--warning-foreground': '30 90% 10%',
      '--border': '217 33% 20%', '--input': '217 33% 20%', '--ring': '142 90% 55%',
      '--header-bg': '0 0% 5%', '--header-text': '0 0% 100%', '--header-border': '0 0% 15%',
      '--footer-bg': '0 0% 5%', '--footer-text': '0 0% 100%', '--footer-border': '0 0% 15%',
      '--gradient-start': '142 90% 55%', '--gradient-end': '280 80% 60%',
      '--overlay': '0 0% 0% / 0.8',
      '--font-family': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-family-heading': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    luxury: {
      '--primary': '45 90% 50%', '--primary-foreground': '45 90% 8%', '--primary-hover': '45 90% 58%',
      '--secondary': '30 10% 20%', '--secondary-foreground': '45 20% 90%',
      '--accent': '45 60% 75%', '--accent-foreground': '45 30% 15%',
      '--background': '0 0% 8%', '--foreground': '45 20% 95%',
      '--card': '0 0% 12%', '--card-foreground': '45 20% 95%',
      '--popover': '0 0% 12%', '--popover-foreground': '45 20% 95%',
      '--muted': '30 10% 18%', '--muted-foreground': '45 15% 60%',
      '--destructive': '0 70% 50%', '--destructive-foreground': '0 0% 100%',
      '--success': '150 60% 40%', '--success-foreground': '0 0% 100%',
      '--warning': '40 90% 50%', '--warning-foreground': '40 90% 10%',
      '--border': '45 30% 25%', '--input': '45 30% 25%', '--ring': '45 90% 50%',
      '--header-bg': '0 0% 5%', '--header-text': '45 90% 85%', '--header-border': '45 70% 30%',
      '--footer-bg': '0 0% 5%', '--footer-text': '45 90% 85%', '--footer-border': '45 70% 30%',
      '--gradient-start': '45 90% 50%', '--gradient-end': '45 60% 75%',
      '--overlay': '0 0% 0% / 0.75',
      '--font-family': "'Playfair Display', 'Georgia', serif",
      '--font-family-heading': "'Playfair Display', 'Georgia', serif",
    },
    minimal: {
      '--primary': '220 15% 30%', '--primary-foreground': '0 0% 100%', '--primary-hover': '220 15% 25%',
      '--secondary': '220 10% 95%', '--secondary-foreground': '220 15% 25%',
      '--accent': '210 80% 55%', '--accent-foreground': '0 0% 100%',
      '--background': '0 0% 100%', '--foreground': '220 15% 15%',
      '--card': '0 0% 100%', '--card-foreground': '220 15% 15%',
      '--popover': '0 0% 100%', '--popover-foreground': '220 15% 15%',
      '--muted': '220 10% 97%', '--muted-foreground': '220 10% 45%',
      '--destructive': '0 60% 55%', '--destructive-foreground': '0 0% 100%',
      '--success': '150 50% 45%', '--success-foreground': '0 0% 100%',
      '--warning': '40 70% 55%', '--warning-foreground': '40 70% 10%',
      '--border': '220 10% 92%', '--input': '220 10% 92%', '--ring': '220 15% 30%',
      '--header-bg': '220 10% 98%', '--header-text': '220 15% 20%', '--header-border': '220 10% 85%',
      '--footer-bg': '220 10% 95%', '--footer-text': '220 15% 30%', '--footer-border': '220 10% 85%',
      '--gradient-start': '220 10% 97%', '--gradient-end': '220 10% 92%',
      '--overlay': '0 0% 0% / 0.3',
      '--font-family': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-family-heading': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    vibrant: {
      '--primary': '290 85% 60%', '--primary-foreground': '0 0% 100%', '--primary-hover': '290 85% 65%',
      '--secondary': '185 80% 50%', '--secondary-foreground': '0 0% 100%',
      '--accent': '25 95% 60%', '--accent-foreground': '0 0% 100%',
      '--background': '280 30% 98%', '--foreground': '280 40% 15%',
      '--card': '0 0% 100%', '--card-foreground': '280 40% 15%',
      '--popover': '0 0% 100%', '--popover-foreground': '280 40% 15%',
      '--muted': '280 40% 95%', '--muted-foreground': '280 30% 35%',
      '--destructive': '350 85% 60%', '--destructive-foreground': '0 0% 100%',
      '--success': '150 70% 45%', '--success-foreground': '0 0% 100%',
      '--warning': '45 95% 55%', '--warning-foreground': '45 95% 15%',
      '--border': '280 30% 90%', '--input': '280 30% 90%', '--ring': '290 85% 60%',
      '--header-bg': '290 70% 45%', '--header-text': '0 0% 100%', '--header-border': '290 60% 55%',
      '--footer-bg': '280 50% 20%', '--footer-text': '280 20% 95%', '--footer-border': '280 50% 30%',
      '--gradient-start': '290 85% 60%', '--gradient-end': '185 80% 50%',
      '--overlay': '280 50% 10% / 0.5',
      '--font-family': "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '--font-family-heading': "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
  };

  var themeMeta = {
    default: { name: 'BuyerHub Green', color: '#8DEB6E' },
    dark: { name: 'Dark Mode', color: '#1a1a2e' },
    luxury: { name: 'Luxury Gold', color: '#D4A017' },
    minimal: { name: 'Minimal Clean', color: '#a0a0a0' },
    vibrant: { name: 'Vibrant Fun', color: '#9b59b6' },
  };

  BH.Theme = {
    current: 'default',
    init: function () {
      var saved = localStorage.getItem(STORAGE_PREFIX + '-theme') || 'default';
      this.set(saved);
    },
    set: function (name) {
      if (!themeColors[name]) name = 'default';
      this.current = name;
      var root = document.documentElement;
      root.removeAttribute('data-theme');
      if (name !== 'default') root.setAttribute('data-theme', name);
      var colors = themeColors[name];
      for (var key in colors) {
        if (colors.hasOwnProperty(key)) {
          root.style.setProperty(key, colors[key]);
        }
      }
      localStorage.setItem(STORAGE_PREFIX + '-theme', name);
      // Update theme dropdown active state when theme changes
      document.querySelectorAll('[data-theme-option]').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-theme-option') === name);
      });
      // Dispatch event for component updates
      document.dispatchEvent(new CustomEvent('bh:themechange', { detail: { theme: name } }));
    },
    getMeta: function (name) { return themeMeta[name] || themeMeta.default; },
  };

  // ========== CART STORE ==========
  BH.Cart = {
    _items: [],
    _key: STORAGE_PREFIX + '-cart',

    init: function () {
      try {
        var saved = localStorage.getItem(this._key);
        if (saved) this._items = JSON.parse(saved);
      } catch (e) { this._items = []; }
      this._render();
    },

    _save: function () {
      localStorage.setItem(this._key, JSON.stringify(this._items));
      this._render();
    },

    addItem: function (product, quantity) {
      quantity = quantity || 1;
      var existing = this._items.find(function (i) { return i.product.id === product.id; });
      if (existing) {
        existing.quantity += quantity;
      } else {
        this._items.push({ id: product.id, product: product, quantity: quantity });
      }
      this._save();
      BH.showToast('Added to cart!');
    },

    removeItem: function (productId) {
      this._items = this._items.filter(function (i) { return i.product.id !== productId; });
      this._save();
    },

    updateQuantity: function (productId, quantity) {
      if (quantity <= 0) { this.removeItem(productId); return; }
      var item = this._items.find(function (i) { return i.product.id === productId; });
      if (item) { item.quantity = quantity; this._save(); }
    },

    clearCart: function () { this._items = []; this._save(); },

    getItems: function () { return this._items; },

    getTotalItems: function () {
      return this._items.reduce(function (sum, i) { return sum + i.quantity; }, 0);
    },

    getSubtotal: function () {
      return this._items.reduce(function (sum, i) {
        var price = typeof i.product.price === 'number' ? i.product.price : (i.product.price && i.product.price.current) || 0;
        return sum + (price * i.quantity);
      }, 0);
    },

    getShipping: function () {
      var sub = this.getSubtotal();
      return sub > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    },

    getFlatRate: function () { return FLAT_RATE_NGN; },

    getFinalTotal: function () {
      return this.getSubtotal() + this.getShipping() + FLAT_RATE_NGN;
    },

    isItemInCart: function (productId) {
      return this._items.some(function (i) { return i.product.id === productId; });
    },

    getItemQuantity: function (productId) {
      var item = this._items.find(function (i) { return i.product.id === productId; });
      return item ? item.quantity : 0;
    },

    _render: function () {
      // Update cart badge count
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        var count = BH.Cart.getTotalItems();
        el.textContent = count > 99 ? '99+' : count;
        el.style.display = count > 0 ? 'flex' : 'none';
      });
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('bh:cartupdate', { detail: { items: BH.Cart._items } }));
    },
  };

  // ========== WISHLIST STORE ==========
  BH.Wishlist = {
    _items: [],
    _key: STORAGE_PREFIX + '-wishlist',

    init: function () {
      try {
        var saved = localStorage.getItem(this._key);
        if (saved) this._items = JSON.parse(saved);
      } catch (e) { this._items = []; }
      this._render();
    },

    _save: function () {
      localStorage.setItem(this._key, JSON.stringify(this._items));
      this._render();
    },

    addItem: function (product) {
      if (this.isItemInWishlist(product.id)) return;
      this._items.push({ id: product.id, product: product, addedAt: new Date().toISOString() });
      this._save();
      BH.showToast('Added to wishlist!');
    },

    removeItem: function (productId) {
      this._items = this._items.filter(function (i) { return i.product.id !== productId; });
      this._save();
    },

    clearWishlist: function () { this._items = []; this._save(); },

    isItemInWishlist: function (productId) {
      return this._items.some(function (i) { return i.product.id === productId; });
    },

    getTotalItems: function () { return this._items.length; },

    getItemById: function (productId) {
      return this._items.find(function (i) { return i.product.id === productId; });
    },

    moveToCart: function (productId) {
      var item = this.getItemById(productId);
      if (item) {
        BH.Cart.addItem(item.product, 1);
        this.removeItem(productId);
        BH.showToast('Moved to cart!');
      }
    },

    _render: function () {
      document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
        var count = BH.Wishlist.getTotalItems();
        el.textContent = count;
        el.style.display = count > 0 ? 'inline' : 'none';
      });
      document.dispatchEvent(new CustomEvent('bh:wishlistupdate'));
    },
  };

  // ========== AUTH STORE ==========
  BH.Auth = {
    _user: null,
    _token: null,
    _isAuthenticated: false,
    _key: STORAGE_PREFIX + '-auth',

    init: function () {
      try {
        var saved = localStorage.getItem(this._key);
        if (saved) {
          var data = JSON.parse(saved);
          this._user = data.user;
          this._token = data.token;
          this._isAuthenticated = !!data.user && !!data.token;
        }
      } catch (e) { }
      this._render();
    },

    _save: function () {
      localStorage.setItem(this._key, JSON.stringify({
        user: this._user, token: this._token
      }));
      this._render();
    },

    login: function (email, password) {
      // Mock login - use mockUser data
      this._user = BH.mockUser;
      this._token = 'mock-jwt-token-' + Date.now();
      this._isAuthenticated = true;
      this._save();
      BH.showToast('Welcome back, ' + this._user.firstName + '!');
      return true;
    },

    register: function (data) {
      this._user = { id: Date.now().toString(), email: data.email, firstName: data.firstName, lastName: data.lastName };
      this._token = 'mock-jwt-token-' + Date.now();
      this._isAuthenticated = true;
      this._save();
      BH.showToast('Account created successfully!');
      return true;
    },

    logout: function () {
      this._user = null;
      this._token = null;
      this._isAuthenticated = false;
      localStorage.removeItem(this._key);
      this._render();
      BH.Cart.clearCart();
      BH.showToast('Signed out');
    },

    getUser: function () { return this._user; },
    getToken: function () { return this._token; },
    isAuthenticated: function () { return this._isAuthenticated; },

    updateUser: function (data) {
      if (this._user) {
        for (var key in data) {
          if (data.hasOwnProperty(key)) this._user[key] = data[key];
        }
        this._save();
      }
    },

    /**
     * Programmatic auth guard. Mirrors React's ProtectedRoute behavior.
     * If the user is not signed in, redirects to login.html with a
     * `redirect=` query param pointing back to the current page so the
     * login flow can return them after success.
     *
     * Returns true if authenticated (so callers can `if (!BH.Auth.requireAuth()) return;`).
     *
     * NOTE: For zero-flash protection, prefer the inline <head> guard that
     * runs before body content renders. This method exists for in-page
     * actions that need to require auth on demand (e.g., wishlist add).
     *
     * @param {{ loginUrl?: string }} [opts]
     * @returns {boolean}
     */
    requireAuth: function (opts) {
      opts = opts || {};
      if (this.isAuthenticated()) return true;
      var path = window.location.pathname.split('/').pop() || 'index.html';
      var search = window.location.search || '';
      var redirect = encodeURIComponent(path + search);
      var loginUrl = (opts.loginUrl || 'login.html') + '?redirect=' + redirect;
      window.location.replace(loginUrl);
      return false;
    },

    _render: function () {
      document.querySelectorAll('[data-auth-area]').forEach(function (el) {
        var loggedIn = el.getAttribute('data-auth-area') === 'logged-in';
        el.style.display = BH.Auth.isAuthenticated() === loggedIn ? '' : 'none';
      });
      document.querySelectorAll('[data-auth-guest]').forEach(function (el) {
        var guest = el.getAttribute('data-auth-guest') === 'guest';
        el.style.display = BH.Auth.isAuthenticated() === guest ? 'none' : '';
      });
      document.querySelectorAll('[data-user-name]').forEach(function (el) {
        var user = BH.Auth.getUser();
        if (user) el.textContent = user.firstName + ' ' + user.lastName;
      });
      document.querySelectorAll('[data-user-first]').forEach(function (el) {
        var user = BH.Auth.getUser();
        if (user) el.textContent = user.firstName;
      });
      document.querySelectorAll('[data-user-email]').forEach(function (el) {
        var user = BH.Auth.getUser();
        if (user) el.textContent = user.email;
      });
      document.dispatchEvent(new CustomEvent('bh:authupdate'));
    },
  };

  // ========== INIT ==========
  BH.init = function () {
    BH.Theme.init();
    BH.Cart.init();
    BH.Wishlist.init();
    BH.Auth.init();
    // Page-specific initializers
    if (BH.Page && typeof BH.Page.initResetPassword === 'function') BH.Page.initResetPassword();
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BH.init);
  } else {
    BH.init();
  }

  /* ========== PAGE: Reset Password ========== */
  BH.Page = BH.Page || {};
  BH.Page.initResetPassword = function () {
    var otpInputs = Array.from(document.querySelectorAll('.bh-otp-input'));
    if (!otpInputs.length && !document.getElementById('resetForm')) return;
    otpInputs.forEach(function (el, index) {
      el.addEventListener('input', function () {
        el.value = el.value.replace(/\D/g, '').slice(-1);
        if (el.value && index < otpInputs.length - 1) otpInputs[index + 1].focus();
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !e.target.value && index > 0) otpInputs[index - 1].focus();
      });
    });

    document.querySelectorAll('.bh-toggle-pwd').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement.querySelector('input');
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.innerHTML = input.type === 'password' ? '<i class="bi bi-eye text-muted"></i>' : '<i class="bi bi-eye-slash text-muted"></i>';
      });
    });

    var resetForm = document.getElementById('resetForm');
    if (resetForm) {
      resetForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var code = otpInputs.map(function (i) { return i.value; }).join('');
        var pwd = document.getElementById('newPwd').value;
        var cpwd = document.getElementById('confirmPwd').value;
        var errEl = document.getElementById('errorAlert');
        if (errEl) errEl.classList.add('d-none');
        if (code.length !== 5) { if (errEl) { errEl.textContent = 'Please enter the complete 5-digit code from your email.'; errEl.classList.remove('d-none'); } return; }
        if (pwd.length < 8) { if (errEl) { errEl.textContent = 'Password must be at least 8 characters.'; errEl.classList.remove('d-none'); } return; }
        if (pwd !== cpwd) { if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('d-none'); } return; }
        var btn = document.getElementById('resetBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Resetting...'; }
        setTimeout(function () {
          var success = document.getElementById('successAlert');
          if (success) success.classList.remove('d-none');
          if (resetForm) resetForm.style.display = 'none';
          if (window.BH && typeof BH.showToast === 'function') BH.showToast('Password reset successfully!');
          setTimeout(function () { window.location.href = 'login.html'; }, 2000);
        }, 1000);
      });
    }
  };

  window.BH = BH;
})();
