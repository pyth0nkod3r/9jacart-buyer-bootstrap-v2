/**
 * BuyerHub API Layer (BH.api.*)
 *
 * Mock async API mirroring the React reference (src/api/*.ts).
 * Reads from BH.products / BH.categories / BH.orders / BH.mockUser already
 * defined in js/data.js, but wraps everything as Promises with simulated
 * latency, pagination, and a small in-memory cache so pages can switch from
 * `BH.products` to `await BH.api.listProducts(...)` with minimal HTML diff.
 *
 * Response envelope:
 *   { status, error, message, data, pagination? }
 *
 * Pagination shape (matches React):
 *   { currentPage, perPage, totalPages, totalItems }
 *
 * Auth methods mutate BH.Auth (already in app.js) and persist the same
 * keys, so existing UI bindings (data-auth-area, data-user-name, etc.)
 * keep working untouched.
 */
(function () {
  'use strict';

  var BH = window.BH || {};

  /* ========== CONSTANTS ========== */
  var DEFAULT_PER_PAGE = 12;
  var CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
  var RECENTLY_VIEWED_KEY = 'BuyerHub-recently-viewed';
  var RECENTLY_VIEWED_LIMIT = 10;

  /* ========== UTILITIES ========== */
  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /** Simulate API delay; tweak to mirror React's simulateDelay defaults. */
  function simulateDelay(ms) {
    return sleep(typeof ms === 'number' ? ms : 300);
  }

  function ok(data, extra) {
    var res = { status: 200, error: false, message: 'OK', data: data };
    if (extra) {
      for (var k in extra) {
        if (extra.hasOwnProperty(k)) res[k] = extra[k];
      }
    }
    return res;
  }

  function fail(status, message, data) {
    return { status: status, error: true, message: message, data: data || null };
  }

  function paginate(items, page, perPage) {
    page = Math.max(1, parseInt(page, 10) || 1);
    perPage = Math.max(1, parseInt(perPage, 10) || DEFAULT_PER_PAGE);
    var totalItems = items.length;
    var totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    var start = (page - 1) * perPage;
    var slice = items.slice(start, start + perPage);
    return {
      data: slice,
      pagination: {
        currentPage: page,
        perPage: perPage,
        totalPages: totalPages,
        totalItems: totalItems
      }
    };
  }

  function lower(v) { return (v || '').toString().toLowerCase(); }

  /* ========== CACHE ========== */
  // Minimal in-memory cache keyed by string. Each entry: { value, ts }.
  var memCache = new Map();

  function cacheGet(key) {
    var entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      memCache.delete(key);
      return null;
    }
    return entry.value;
  }

  function cacheSet(key, value) {
    memCache.set(key, { value: value, ts: Date.now() });
  }

  function cacheBust(prefix) {
    if (!prefix) { memCache.clear(); return; }
    memCache.forEach(function (_v, k) {
      if (k.indexOf(prefix) === 0) memCache.delete(k);
    });
  }

  /* ========== INTERNAL: SOURCE ACCESSORS ========== */
  function srcProducts() { return Array.isArray(BH.products) ? BH.products : []; }
  function srcCategories() { return Array.isArray(BH.categories) ? BH.categories : []; }
  function srcOrders() { return Array.isArray(BH.orders) ? BH.orders : []; }
  function srcAddresses() { return Array.isArray(BH.addresses) ? BH.addresses : []; }
  function srcSellers() { return Array.isArray(BH.sellers) ? BH.sellers : []; }

  /* ========== PRODUCTS ========== */
  function filterProducts(list, params) {
    var q = lower(params && params.search);
    var cat = lower(params && params.category);
    var isActive = params && params.isActive;
    return list.filter(function (p) {
      if (isActive === '1' && p.status && p.status !== 'active') return false;
      if (cat) {
        var matchesCat = lower(p.categoryId) === cat;
        if (!matchesCat) return false;
      }
      if (q) {
        var hay = lower(p.name) + ' ' +
          lower(p.description) + ' ' +
          (Array.isArray(p.tags) ? lower(p.tags.join(' ')) : '');
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  var productsApi = {
    /**
     * List products with optional pagination/search/category filter.
     * @param {{page?:number, perPage?:number, search?:string, category?:string, isActive?:string}} params
     */
    listProducts: function (params) {
      params = params || {};
      var key = 'products:list:' + JSON.stringify(params);
      var cached = cacheGet(key);
      if (cached) return Promise.resolve(cached);
      return simulateDelay(400).then(function () {
        var filtered = filterProducts(srcProducts(), params);
        var paged = paginate(filtered, params.page, params.perPage);
        var res = ok(paged.data, { pagination: paged.pagination, message: 'Products retrieved successfully' });
        cacheSet(key, res);
        return res;
      });
    },

    /**
     * Fetch all products across all pages of a base query (used by FlashSales
     * and similar sections that need everything in one shot).
     */
    listAllProducts: function (params) {
      params = params || {};
      var key = 'products:all:' + JSON.stringify(params);
      var cached = cacheGet(key);
      if (cached) return Promise.resolve(cached);
      return simulateDelay(400).then(function () {
        var filtered = filterProducts(srcProducts(), params);
        var res = ok(filtered, {
          pagination: {
            currentPage: 1,
            perPage: filtered.length,
            totalPages: 1,
            totalItems: filtered.length
          },
          message: 'Products retrieved successfully'
        });
        cacheSet(key, res);
        return res;
      });
    },

    /** Get a single product by id. */
    getProduct: function (productId) {
      var key = 'products:one:' + productId;
      var cached = cacheGet(key);
      if (cached) return Promise.resolve(cached);
      return simulateDelay(300).then(function () {
        var found = srcProducts().find(function (p) { return p.id === productId; });
        if (!found) return fail(404, 'Product not found');
        var res = ok(found, { message: 'Product retrieved successfully' });
        cacheSet(key, res);
        return res;
      });
    },

    /** Products filtered by category id (with same pagination/search options). */
    listProductsByCategory: function (categoryId, params) {
      params = params || {};
      params.category = categoryId;
      return productsApi.listProducts(params);
    },

    /**
     * Track a product view for "recently viewed" recommendations.
     * Stores a rolling list of product ids in localStorage. No-op if no id.
     */
    trackProductView: function (productId) {
      return simulateDelay(50).then(function () {
        if (!productId) return ok(null);
        try {
          var raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
          var ids = raw ? JSON.parse(raw) : [];
          // Move to front; dedupe; cap.
          ids = [productId].concat(ids.filter(function (id) { return id !== productId; }));
          ids = ids.slice(0, RECENTLY_VIEWED_LIMIT);
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
        } catch (e) { /* ignore */ }
        return ok(null);
      });
    },

    /** Read recently-viewed products (resolved to full product objects). */
    getRecentlyViewed: function () {
      return simulateDelay(150).then(function () {
        var ids = [];
        try {
          var raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
          ids = raw ? JSON.parse(raw) : [];
        } catch (e) { ids = []; }
        var pool = srcProducts();
        var resolved = ids
          .map(function (id) { return pool.find(function (p) { return p.id === id; }); })
          .filter(Boolean);
        return ok(resolved);
      });
    },

    /**
     * Aggregate ratings for a product. Bootstrap data already carries
     * `reviews.average` / `reviews.total`, so we surface those rather than
     * generating random numbers like the React mock.
     */
    getProductRatings: function (productId) {
      return simulateDelay(200).then(function () {
        var p = srcProducts().find(function (x) { return x.id === productId; });
        var avg = p && p.reviews ? Number(p.reviews.average) || 0 : 0;
        var count = p && p.reviews ? Number(p.reviews.total) || 0 : 0;
        return ok({ totalRating: String(avg), ratingCount: String(count) });
      });
    }
  };

  /* ========== CATEGORIES ========== */
  var categoriesApi = {
    /** Paginated category list. */
    listCategories: function (params) {
      params = params || {};
      var key = 'categories:list:' + JSON.stringify(params);
      var cached = cacheGet(key);
      if (cached) return Promise.resolve(cached);
      return simulateDelay(300).then(function () {
        var paged = paginate(srcCategories(), params.page, params.perPage || 50);
        var res = ok(paged.data, {
          pagination: paged.pagination,
          message: 'Categories retrieved successfully'
        });
        cacheSet(key, res);
        return res;
      });
    },

    /** Convenience: all level-1 non-archived categories. */
    getMainCategories: function () {
      return simulateDelay(200).then(function () {
        var list = srcCategories().filter(function (c) {
          return c.level === 1 && !c.archived;
        });
        return ok(list);
      });
    }
  };

  /* ========== ORDERS ========== */
  var orderApi = {
    /** Get all orders for the signed-in user (mock: returns BH.orders). */
    listOrders: function () {
      return simulateDelay(400).then(function () {
        return ok(srcOrders().slice(), {
          message: 'Orders retrieved successfully'
        });
      });
    },

    /** Get a single order by id. */
    getOrder: function (orderId) {
      return simulateDelay(300).then(function () {
        var found = srcOrders().find(function (o) { return o.id === orderId; });
        if (!found) return fail(404, 'Order not found');
        return ok(found, { message: 'Order retrieved successfully' });
      });
    },

    /**
     * Create an order from cart + billing details.
     * @param {object} payload  { billing, items, paymentMethod, couponCode? }
     * @returns {{ orderNo, redirectUrl, data: { orderId, total, status, ... } }}
     */
    createOrder: function (payload) {
      return simulateDelay(500).then(function () {
        var items = (payload && payload.items) || [];
        var total = items.reduce(function (sum, it) {
          var price = typeof it.price === 'number'
            ? it.price
            : (it.product && typeof it.product.price === 'object'
                ? Number(it.product.price.current) || 0
                : Number(it.product && it.product.price) || 0);
          return sum + price * (it.quantity || 1);
        }, 0);
        var orderNo = 'ORD-' + Date.now();
        // Append to BH.orders so subsequent listOrders() shows it.
        var newOrder = {
          id: orderNo,
          items: items.map(function (it) {
            return {
              id: (it.product && it.product.id) || it.productId,
              product: it.product,
              quantity: it.quantity || 1
            };
          }),
          total: total,
          status: 'pending',
          createdAt: new Date().toISOString(),
          shippingAddress: (payload && payload.billing) || {}
        };
        if (Array.isArray(BH.orders)) BH.orders.unshift(newOrder);
        cacheBust('orders:');
        return {
          status: 200,
          error: false,
          message: 'Order placed successfully',
          orderNo: orderNo,
          redirectUrl: 'orders.html?placed=' + orderNo,
          paymentData: { authorizationUrl: 'orders.html?placed=' + orderNo },
          data: {
            orderId: orderNo,
            orderNumber: orderNo,
            total: total,
            subtotal: total,
            tax: 0,
            shipping: total > 50000 ? 0 : 2500,
            status: 'pending',
            paymentMethod: (payload && payload.paymentMethod) || 'card',
            estimatedDelivery: '3-5 business days',
            createdAt: newOrder.createdAt
          }
        };
      });
    },

    /** Submit an overall rating for an order. */
    rateOrder: function (payload) {
      return simulateDelay(300).then(function () {
        return ok({ submitted: true, payload: payload }, {
          message: 'Rating submitted successfully'
        });
      });
    },

    /** Submit per-item ratings for an order. */
    rateOrderItems: function (orderNo, ratings) {
      return simulateDelay(300).then(function () {
        return ok({ orderNo: orderNo, count: (ratings || []).length }, {
          message: 'Ratings submitted successfully'
        });
      });
    },

    /** Get any existing ratings for an order (mock: empty list). */
    getOrderRatings: function (orderId) {
      return simulateDelay(200).then(function () {
        return ok([], { message: 'Ratings retrieved successfully' });
      });
    },

    /**
     * Get tracking events for an order. Synthesizes events from order.status
     * so the bootstrap track page can render a multi-stage timeline.
     */
    trackOrder: function (orderId) {
      return simulateDelay(350).then(function () {
        var order = srcOrders().find(function (o) { return o.id === orderId; });
        if (!order) return fail(404, 'Order not found');
        var status = (order.status || 'pending').toLowerCase();
        var placedDate = new Date(order.createdAt);
        var processingDate = new Date(placedDate.getTime() + 3600 * 1000);
        var shippedDate = new Date(placedDate.getTime() + 24 * 3600 * 1000);
        var deliveredDate = new Date(placedDate.getTime() + 3 * 24 * 3600 * 1000);
        var done = {
          placed: true,
          processing: status !== 'pending',
          shipped: status === 'shipped' || status === 'delivered',
          delivered: status === 'delivered'
        };
        var events = [
          { key: 'placed',     label: 'Order Placed',  date: placedDate.toISOString(),     done: done.placed },
          { key: 'processing', label: 'Processing',    date: done.processing ? processingDate.toISOString() : null, done: done.processing },
          { key: 'shipped',    label: 'Shipped',       date: done.shipped    ? shippedDate.toISOString()    : null, done: done.shipped },
          { key: 'delivered',  label: 'Delivered',     date: done.delivered  ? deliveredDate.toISOString()  : null, done: done.delivered }
        ];
        return ok({
          orderId: order.id,
          status: status,
          carrier: 'BuyerHub Logistics',
          estimatedDelivery: deliveredDate.toISOString(),
          events: events
        });
      });
    }
  };

  /* ========== AUTH ========== */
  var authApi = {
    /**
     * Login with email/password. Persists rememberMe preference, then mutates
     * BH.Auth (which already handles localStorage + UI rerender).
     */
    login: function (email, password, rememberMe) {
      return simulateDelay(500).then(function () {
        if (!email || !password) {
          return fail(400, 'Email and password are required');
        }
        try {
          localStorage.setItem('BuyerHub-remember-me', rememberMe ? '1' : '0');
        } catch (e) { /* ignore */ }
        BH.Auth.login(email, password);
        return ok({
          buyerId: BH.Auth.getUser().id,
          firstName: BH.Auth.getUser().firstName,
          lastName: BH.Auth.getUser().lastName,
          emailAddress: email,
          token: BH.Auth.getToken()
        }, { message: 'Login successful' });
      });
    },

    /** Register a new user; returns verificationId/identifier for OTP step. */
    register: function (userData) {
      return simulateDelay(600).then(function () {
        if (!userData || !userData.email || !userData.password) {
          return fail(400, 'Missing required fields');
        }
        BH.Auth.register({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        });
        return ok({
          verificationId: 'verify_' + Math.random().toString(36).slice(2),
          identifier: userData.email
        }, { message: 'Registration successful. Please verify your email.' });
      });
    },

    /** Verify email with OTP code (mock: any 5 or 6 digit code passes). */
    verifyEmail: function (identifier, code) {
      return simulateDelay(400).then(function () {
        if (!code || (code.length !== 5 && code.length !== 6)) {
          return fail(400, 'Invalid verification code');
        }
        return ok(null, { message: 'Email verified successfully' });
      });
    },

    /** Resend OTP (mock: always succeeds after delay). */
    resendOtp: function (identifier) {
      return simulateDelay(300).then(function () {
        return ok(null, { message: 'Verification code sent successfully' });
      });
    },

    /** Mock Google OAuth login. */
    googleLogin: function (idToken) {
      return simulateDelay(500).then(function () {
        BH.Auth.login('google.user@example.com', 'google');
        return ok({
          buyerId: 'google_' + Math.random().toString(36).slice(2),
          token: BH.Auth.getToken()
        }, { message: 'Google login successful' });
      });
    },

    /** Forgot-password: returns a verificationId the reset page consumes. */
    forgotPassword: function (email) {
      return simulateDelay(400).then(function () {
        if (!email) return fail(400, 'Email is required');
        return ok({
          verificationId: 'verify_' + Math.random().toString(36).slice(2),
          identifier: email
        }, { message: 'Password reset link sent to your email' });
      });
    },

    /** Reset password using the token from forgot-password. */
    resetPassword: function (token, password, passwordConfirmation) {
      return simulateDelay(400).then(function () {
        if (!password || password.length < 8) {
          return fail(400, 'Password must be at least 8 characters');
        }
        if (password !== passwordConfirmation) {
          return fail(400, 'Passwords do not match');
        }
        return ok(null, { message: 'Password reset successful' });
      });
    },

    /** Update the signed-in user's profile fields. */
    updateProfile: function (data) {
      return simulateDelay(400).then(function () {
        if (!BH.Auth.isAuthenticated()) {
          return fail(401, 'Not authenticated');
        }
        BH.Auth.updateUser(data || {});
        return ok(BH.Auth.getUser(), { message: 'Profile updated' });
      });
    }
  };

  /* ========== ADDRESSES ========== */
  var addressApi = {
    listAddresses: function () {
      return simulateDelay(250).then(function () {
        return ok(srcAddresses().slice());
      });
    },
    addAddress: function (addr) {
      return simulateDelay(300).then(function () {
        var next = Object.assign({ id: 'addr_' + Date.now() }, addr || {});
        if (!Array.isArray(BH.addresses)) BH.addresses = [];
        if (next.isDefault) {
          BH.addresses.forEach(function (a) { a.isDefault = false; });
        }
        BH.addresses.push(next);
        return ok(next, { message: 'Address added' });
      });
    },
    updateAddress: function (id, addr) {
      return simulateDelay(300).then(function () {
        var idx = (BH.addresses || []).findIndex(function (a) { return a.id === id; });
        if (idx < 0) return fail(404, 'Address not found');
        if (addr && addr.isDefault) {
          BH.addresses.forEach(function (a) { a.isDefault = false; });
        }
        BH.addresses[idx] = Object.assign({}, BH.addresses[idx], addr || {});
        return ok(BH.addresses[idx], { message: 'Address updated' });
      });
    },
    deleteAddress: function (id) {
      return simulateDelay(300).then(function () {
        if (!Array.isArray(BH.addresses)) return fail(404, 'Address not found');
        var before = BH.addresses.length;
        BH.addresses = BH.addresses.filter(function (a) { return a.id !== id; });
        if (BH.addresses.length === before) return fail(404, 'Address not found');
        return ok(null, { message: 'Address deleted' });
      });
    }
  };

  /* ========== TICKETS / SUPPORT ========== */
  var ticketApi = {
    submitTicket: function (payload) {
      return simulateDelay(800).then(function () {
        return ok({ ticketId: 'TCK-' + Date.now(), payload: payload }, {
          message: 'Your message has been sent successfully!'
        });
      });
    }
  };

  /* ========== PUBLIC EXPORT ========== */
  BH.api = {
    // namespaces
    products: productsApi,
    categories: categoriesApi,
    orders: orderApi,
    auth: authApi,
    addresses: addressApi,
    tickets: ticketApi,
    // utilities (exposed for tests / pages that need them)
    _cache: {
      bust: cacheBust,
      clear: function () { memCache.clear(); }
    },
    _delay: simulateDelay,
    // Convenience flat aliases that match the wording used in progress.txt
    listProducts: function (p) { return productsApi.listProducts(p); },
    getProduct: function (id) { return productsApi.getProduct(id); },
    listCategories: function (p) { return categoriesApi.listCategories(p); },
    listOrders: function () { return orderApi.listOrders(); },
    getOrder: function (id) { return orderApi.getOrder(id); },
    createOrder: function (p) { return orderApi.createOrder(p); },
    trackOrder: function (id) { return orderApi.trackOrder(id); }
  };

  window.BH = BH;
})();
