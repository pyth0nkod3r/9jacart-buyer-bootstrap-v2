/**
 * BuyerHub Components
 * Header, Footer, SecondaryNav, ProductCard, Breadcrumbs, etc.
 * Matching NewHeader.tsx, Footer.tsx, SecondaryNav.tsx, ProductCard.tsx
 */

(function() {
  'use strict';
  var BH = window.BH || {};

  // ========== HEADER ==========
  BH.renderHeader = function(options) {
    options = options || {};
    var currentPage = options.page || 'home';
    var container = document.getElementById('bh-header');
    if (!container) return;

    var cartCount = BH.Cart.getTotalItems();
    var isAuth = BH.Auth.isAuthenticated();
    var user = BH.Auth.getUser();
    var categories = BH.searchCategories || ['All','Electronics','Clothing','Home & Garden','Sports','Books','Beauty','Automotive'];

    var catOptions = categories.map(function(c) {
      return '<option value="' + c + '">' + (c.length > 8 ? c.substring(0,8) + '...' : c) + '</option>';
    }).join('');

    container.innerHTML = '\
    <header class="bh-header sticky-top">\
      <div class="bh-container px-3 px-lg-4 py-2 py-lg-3">\
        <div class="d-flex align-items-center justify-content-between gap-3 d-lg-none mb-2">\
          <button class="btn btn-sm p-2" onclick="BH.toggleMobileMenu()" aria-label="Menu">\
            <i class="bi bi-list fs-5"></i>\
          </button>\
          <a href="index.html" class="flex-shrink-0">\
            <img src="img/logo.svg" alt="BuyerHub" style="height:28px;width:auto">\
          </a>\
          <div class="d-flex align-items-center gap-1">\
            ' + (isAuth ? '\
            <div class="dropdown">\
              <button class="btn btn-sm p-2" data-bs-toggle="dropdown" aria-expanded="false">\
                <i class="bi bi-person fs-5"></i>\
              </button>\
              <ul class="dropdown-menu dropdown-menu-end" style="width:280px">\
                <li class="px-3 pt-3 pb-2 border-bottom">\
                  <p class="fw-medium mb-0">' + (user ? user.firstName + ' ' + user.lastName : '') + '</p>\
                  <p class="text-muted small mb-0">' + (user ? user.email : '') + '</p>\
                </li>\
                <li><a class="dropdown-item py-3" href="account.html">Your Profile</a></li>\
                <li><a class="dropdown-item py-3" href="orders.html">Your Orders</a></li>\
                <li><a class="dropdown-item py-3" href="wishlist.html">Your Wishlist</a></li>\
                <li><a class="dropdown-item py-3" href="contact-admin.html">Contact Support</a></li>\
                <li><hr class="dropdown-divider"></li>\
                <li><a class="dropdown-item py-3 text-danger" href="#" onclick="event.preventDefault();BH.Auth.logout();window.location.href=\'index.html\'">Sign Out</a></li>\
              </ul>\
            </div>' : '\
            <a href="login.html" class="btn btn-sm p-2">\
              <i class="bi bi-person fs-5"></i>\
            </a>') + '\
            <a href="cart.html" class="btn btn-sm p-2 position-relative">\
              <i class="bi bi-cart3 fs-5"></i>\
              <span data-cart-count class="bh-cart-badge position-absolute top-0 start-100 translate-middle badge rounded-pill" style="display:' + (cartCount > 0 ? 'flex' : 'none') + '">' + cartCount + '</span>\
            </a>\
          </div>\
        </div>\
        <div class="d-none d-lg-flex align-items-center justify-content-between gap-4">\
          <a href="index.html" class="flex-shrink-0">\
            <img src="img/logo.svg" alt="BuyerHub" style="height:32px;width:auto">\
          </a>\
          <button class="btn btn-sm d-flex align-items-center text-start lh-1 flex-shrink-0">\
            <i class="bi bi-geo-alt fs-5 me-2"></i>\
            <div><div class="bh-header-label">Deliver to</div><div class="fw-medium">Your Location</div></div>\
          </button>\
          <form class="flex-grow-1" style="max-width:600px" onsubmit="BH.handleSearch(event)">\
            <div class="d-flex rounded overflow-hidden bh-search-bar">\
              <div class="position-relative flex-shrink-0 bh-search-cat">\
                <select id="searchCategory" class="bg-transparent text-white px-3 py-2 border-0 appearance-none pe-7" onchange="">\
                  ' + catOptions + '\
                </select>\
                <i class="bi bi-chevron-down position-absolute end-2 top-50 translate-middle-y text-white small pointer-events-none"></i>\
              </div>\
              <input type="text" id="searchInput" placeholder="Search products..." class="form-control border-0 py-2 flex-grow-1 bh-search-input" />\
              <button type="submit" class="btn px-3 py-2 bh-search-btn flex-shrink-0">\
                <i class="bi bi-search"></i>\
              </button>\
            </div>\
          </form>\
          <div class="d-flex align-items-center gap-2 flex-shrink-0">\
            <div class="dropdown">\
              <button class="btn btn-sm d-flex align-items-center gap-1" data-bs-toggle="dropdown" aria-expanded="false">\
                <i class="bi bi-palette"></i><span>Theme</span>\
              </button>\
              <ul class="dropdown-menu dropdown-menu-end">\
                ' + BH.renderThemeOptions() + '\
              </ul>\
            </div>\
            <a href="contact-admin.html" class="btn btn-sm d-flex align-items-center gap-1">\
              <i class="bi bi-question-circle"></i><span>Help</span>\
            </a>\
            ' + (isAuth ? '\
            <div class="dropdown">\
              <button class="btn btn-sm d-flex align-items-center gap-1" data-bs-toggle="dropdown" aria-expanded="false">\
                <i class="bi bi-person me-1"></i>\
                <div class="text-start"><div class="bh-header-label">Hello, ' + (user ? user.firstName : '') + '</div><div class="fw-medium">Account & Lists</div></div>\
                <i class="bi bi-chevron-down ms-1 small"></i>\
              </button>\
              <ul class="dropdown-menu dropdown-menu-end" style="width:280px">\
                <li class="px-3 pt-3 pb-2 border-bottom"><p class="fw-medium mb-0">' + (user ? user.firstName + ' ' + user.lastName : '') + '</p><p class="text-muted small mb-0">' + (user ? user.email : '') + '</p></li>\
                <li><a class="dropdown-item" href="account.html">Your Profile</a></li>\
                <li><a class="dropdown-item" href="orders.html">Your Orders</a></li>\
                <li><a class="dropdown-item" href="wishlist.html">Your Wishlist</a></li>\
                <li><a class="dropdown-item" href="contact-admin.html">Contact Support</a></li>\
                <li><hr class="dropdown-divider"></li>\
                <li><a class="dropdown-item text-danger" href="#" onclick="event.preventDefault();BH.Auth.logout();window.location.href=\'index.html\'">Sign Out</a></li>\
              </ul>\
            </div>\
            <a href="orders.html" class="btn btn-sm d-flex align-items-center text-start lh-1">\
              <div><div class="bh-header-label">Returns</div><div class="fw-medium">& Orders</div></div>\
            </a>' : '\
            <a href="login.html" class="btn btn-sm d-flex align-items-center gap-1">\
              <i class="bi bi-person me-1"></i><span>Hello, Sign in</span>\
            </a>') + '\
            <a href="cart.html" class="btn btn-sm d-flex align-items-center position-relative">\
              <i class="bi bi-cart3 fs-5"></i>\
              <span class="ms-1 fw-medium">Cart</span>\
              <span data-cart-count class="bh-cart-badge position-absolute top-0 start-100 translate-middle badge rounded-pill" style="display:' + (cartCount > 0 ? 'flex' : 'none') + '">' + cartCount + '</span>\
            </a>\
          </div>\
        </div>\
        <div class="d-lg-none">\
          <form onsubmit="BH.handleSearch(event)">\
            <div class="d-flex rounded overflow-hidden bh-search-bar">\
              <div class="position-relative flex-shrink-0 bh-search-cat">\
                <select class="bg-transparent text-white px-2 py-2 border-0 appearance-none pe-5 text-small">\
                  ' + categories.slice(0,6).map(function(c) { return '<option value="'+c+'">'+c+'</option>'; }).join('') + '\
                </select>\
                <i class="bi bi-chevron-down position-absolute end-1 top-50 translate-middle-y text-white smaller pointer-events-none"></i>\
              </div>\
              <input type="text" id="searchInputMobile" placeholder="Search products..." class="form-control border-0 py-2 bh-search-input" />\
              <button type="submit" class="btn px-3 py-2 bh-search-btn"><i class="bi bi-search"></i></button>\
            </div>\
          </form>\
        </div>\
      </div>\
      <div id="mobileMenu" class="bh-mobile-menu d-lg-none" style="display:none">\
        <div class="px-4 py-3">\
          <div class="d-flex align-items-center text-sm mb-3"><i class="bi bi-geo-alt me-2"></i><span>Deliver to Your Location</span></div>\
          <div class="border-top pt-3">\
            <a href="products.html" class="d-flex align-items-center py-3" style="min-height:44px" onclick="BH.toggleMobileMenu()">All Products</a>\
            <a href="products.html" class="d-flex align-items-center py-3" style="min-height:44px" onclick="BH.toggleMobileMenu()">Categories</a>\
            <a href="contact.html" class="d-flex align-items-center py-3" style="min-height:44px" onclick="BH.toggleMobileMenu()">Customer Service</a>\
          </div>\
        </div>\
      </div>\
    </header>';
  };

  BH.renderThemeOptions = function() {
    var themes = [
      { id: 'default', label: 'Default', color: '#8DEB6E' },
      { id: 'dark', label: 'Dark Mode', color: '#1a1a2e' },
      { id: 'luxury', label: 'Luxury', color: '#D4A017' },
      { id: 'minimal', label: 'Minimal', color: '#a0a0a0' },
      { id: 'vibrant', label: 'Vibrant', color: '#9b59b6' },
    ];
    var current = BH.Theme.current;
    return themes.map(function(t) {
      var active = current === t.id;
      return '<li><button data-theme-option="' + t.id + '" class="dropdown-item d-flex align-items-center gap-2 ' + (active ? 'active' : '') + '" onclick="BH.Theme.set(\'' + t.id + '\')"><span class="rounded-circle d-inline-block" style="width:12px;height:12px;background:' + t.color + '"></span>' + t.label + '</button></li>';
    }).join('');
  };

  BH.toggleMobileMenu = function() {
    var menu = document.getElementById('mobileMenu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  };

  BH.handleSearch = function(e) {
    e.preventDefault();
    var input = document.getElementById('searchInput') || document.getElementById('searchInputMobile');
    var catSel = document.getElementById('searchCategory');
    if (!input) return;
    var q = input.value.trim();
    if (!q) return;
    var params = new URLSearchParams({ q: q });
    if (catSel && catSel.value !== 'All') params.set('category', catSel.value.toLowerCase());
    window.location.href = 'search.html?' + params.toString();
  };

  // ========== SECONDARY NAV ==========
  BH.renderSecondaryNav = function(options) {
    options = options || {};
    var container = document.getElementById('bh-secondary-nav');
    if (!container) return;

    var activeCat = options.activeCategory || '';
    var cats = BH.mainCategories || [];
    var catsHtml = cats.slice(0, 8).map(function(cat, i) {
      var isActive = activeCat === cat.id;
      var href = cat.id === 'services' ? 'services.html' : 'category.html?cat=' + cat.id + '&name=' + encodeURIComponent(cat.name);
      return '<a href="' + href + '" class="bh-secondary-link ' + (isActive ? 'active' : '') + '">' + cat.name + '</a>' +
        (i < Math.min(cats.length, 8) - 1 ? '<i class="bi bi-chevron-right bh-sep"></i>' : '');
    }).join('');

    container.innerHTML = '\
    <nav class="bh-secondary-nav">\
      <div class="bh-container px-4">\
        <div class="d-flex align-items-center gap-4 py-2 overflow-auto" style="scrollbar-width:none">\
          <a href="products.html" class="bh-secondary-link ' + (options.activeAll ? 'active' : '') + '">All</a>\
          ' + catsHtml + '\
          <div class="d-flex align-items-center gap-4 ms-auto flex-shrink-0">\
            <a href="deals.html" class="bh-secondary-link ' + (options.activeDeals ? 'active' : '') + '">Today\'s Deals</a>\
            <a href="new-arrivals.html" class="bh-secondary-link ' + (options.activeNew ? 'active' : '') + '">New Arrivals</a>\
            <a href="bestsellers.html" class="bh-secondary-link ' + (options.activeBest ? 'active' : '') + '">Best Sellers</a>\
          </div>\
        </div>\
      </div>\
    </nav>';
  };

  // ========== FOOTER ==========
  BH.renderFooter = function() {
    var container = document.getElementById('bh-footer');
    if (!container) return;
    var year = new Date().getFullYear();

    container.innerHTML = '\
    <footer class="bh-footer">\
      <div class="bh-container px-4 py-8 py-lg-12">\
        <div class="row g-6 g-lg-8 mb-8 mb-lg-12">\
          <div class="col-sm-6 col-lg-4 mx-auto text-center text-lg-start">\
            <h3 class="text-lg fw-semibold mb-4">Know Us More</h3>\
            <ul class="list-unstyled space-y-2">\
              <li><a href="about.html" class="bh-footer-link">About Us</a></li>\
              <li><a href="terms.html" class="bh-footer-link">Terms & Conditions (T\'s & C\'s)</a></li>\
              <li><a href="contact-admin.html" class="bh-footer-link">Contact Admin</a></li>\
            </ul>\
          </div>\
          <div class="col-sm-6 col-lg-4 mx-auto text-center text-lg-start">\
            <h3 class="text-lg fw-semibold mb-4">Make Money With Us</h3>\
            <ul class="list-unstyled space-y-2">\
              <li><a href="#" class="bh-footer-link">Sell Products on Our Platform</a></li>\
            </ul>\
            <h3 class="text-lg fw-semibold mb-4 mt-6">Let Us Help You</h3>\
            <ul class="list-unstyled space-y-2">\
              <li><a href="contact-admin.html" class="bh-footer-link">Help (Contact Admin)</a></li>\
            </ul>\
          </div>\
          <div class="col-sm-6 col-lg-4 mx-auto text-center text-lg-start">\
            <h3 class="text-lg fw-semibold mb-4">Payment Options</h3>\
            <ul class="list-unstyled space-y-2">\
              <li><span class="bh-footer-text">Bank Payments (Visa, MasterCard)</span></li>\
              <li><span class="bh-footer-text">Buy Now, Pay Later (Coming Soon)</span></li>\
              <li><span class="bh-footer-text">Pay on Delivery (Coming Soon)</span></li>\
              <li><span class="bh-footer-text">Emergency Credit (Coming Soon)</span></li>\
            </ul>\
          </div>\
        </div>\
        <div class="row g-6 g-lg-8 border-top pt-6 pt-lg-8">\
          <div class="col-lg-4 mx-auto text-center text-lg-start">\
            <div class="mb-3"><img src="img/logo.svg" alt="BuyerHub" style="height:32px;width:auto"></div>\
            <div class="bh-footer-text space-y-2">\
              <p class="d-flex align-items-start gap-2 mb-1"><i class="bi bi-geo-alt mt-1"></i><span>123 Main Street, City, Country</span></p>\
              <p class="d-flex align-items-start gap-2 mb-1"><i class="bi bi-telephone mt-1"></i><span>+1 (234) 567-8900</span></p>\
              <p class="d-flex align-items-start gap-2 mb-1"><i class="bi bi-envelope mt-1"></i><span>contact@example.com</span></p>\
            </div>\
            <div class="d-flex gap-3 mt-3 justify-content-center justify-content-lg-start">\
              <a href="#" class="bh-footer-link"><i class="bi bi-facebook fs-5"></i></a>\
              <a href="#" class="bh-footer-link"><i class="bi bi-twitter-x fs-5"></i></a>\
              <a href="#" class="bh-footer-link"><i class="bi bi-instagram fs-5"></i></a>\
              <a href="#" class="bh-footer-link"><i class="bi bi-linkedin fs-5"></i></a>\
            </div>\
          </div>\
          <div class="col-6 col-lg-4 mx-auto text-center text-lg-start">\
            <h4 class="fw-semibold mb-3">Account</h4>\
            <ul class="list-unstyled space-y-2">\
              <li><a href="account.html" class="bh-footer-link">My Account</a></li>\
              <li><a href="login.html" class="bh-footer-link">Login / Register</a></li>\
              <li><a href="cart.html" class="bh-footer-link">Cart</a></li>\
              <li><a href="wishlist.html" class="bh-footer-link">Wishlist</a></li>\
            </ul>\
          </div>\
          <div class="col-6 col-lg-4 mx-auto text-center text-lg-start">\
            <h4 class="fw-semibold mb-3">Quick Links</h4>\
            <ul class="list-unstyled space-y-2">\
              <li><a href="shipping.html" class="bh-footer-link">Shipping and return policy</a></li>\
              <li><a href="refund.html" class="bh-footer-link">Refund Policy</a></li>\
              <li><a href="dispute.html" class="bh-footer-link">Dispute Policy</a></li>\
            </ul>\
          </div>\
        </div>\
      </div>\
      <div class="bh-footer-bottom">\
        <div class="bh-container px-4 py-3">\
          <p class="text-center text-sm mb-0">&copy; Copyright ' + year + '. All rights reserved.</p>\
        </div>\
      </div>\
    </footer>';
  };

  // ========== PRODUCT CARD ==========
  BH.renderProductCard = function(product) {
    var price = typeof product.price === 'number' ? product.price : (product.price && product.price.current) || 0;
    var originalPrice = product.price && product.price.original;
    var discount = product.price && product.price.discount;
    var imgSrc = Array.isArray(product.images) ? product.images[0] : (product.images && product.images.main) || '';
    var alt = (product.images && product.images.alt) || product.name || 'Product';
    var isWishlisted = BH.Wishlist.isItemInWishlist(product.id);
    var inStock = product.inventory && product.inventory.inStock;
    var desc = product.shortDescription || product.description || '';

    var discountHtml = '';
    if (discount && discount.percentage > 0) {
      discountHtml = '<span class="bh-discount-badge">-' + Math.round(discount.percentage) + '%</span>';
    }

    var originalPriceHtml = '';
    if (originalPrice && originalPrice > price) {
      originalPriceHtml = '<span class="bh-original-price">' + BH.formatPrice(originalPrice) + '</span>';
    }

    return '\
    <div class="bh-product-card">\
      <a href="product.html?id=' + product.id + '" class="text-decoration-none">\
        <div class="bh-product-img-wrap">\
          ' + discountHtml + '\
          <button class="bh-wishlist-btn ' + (isWishlisted ? 'active' : '') + '" onclick="event.preventDefault();event.stopPropagation();BH.toggleWishlist(\'' + product.id + '\')" title="Add to wishlist">\
            <i class="bi bi-heart' + (isWishlisted ? '-fill' : '') + '"></i>\
          </button>\
          <img src="' + imgSrc + '" alt="' + alt + '" class="bh-product-img" loading="lazy" />\
          ' + (inStock ? '<div class="bh-quick-add"><button class="bh-quick-add-btn" onclick="event.preventDefault();event.stopPropagation();BH.quickAddToCart(\'' + product.id + '\')"><i class="bi bi-cart3 me-1"></i>Add To Cart</button></div>' : '') + '\
        </div>\
        <div class="bh-product-info">\
          <h3 class="bh-product-name">' + product.name + '</h3>\
          ' + (desc ? '<p class="bh-product-desc">' + BH.truncateText(desc, 12) + '</p>' : '') + '\
          <div class="bh-product-price">\
            <span class="bh-price-current">' + BH.formatPrice(price) + '</span>\
            ' + originalPriceHtml + '\
          </div>\
        </div>\
      </a>\
    </div>';
  };

  BH.toggleWishlist = function(productId) {
    if (BH.Wishlist.isItemInWishlist(productId)) {
      BH.Wishlist.removeItem(productId);
      BH.showToast('Removed from wishlist');
    } else {
      var product = BH.products.find(function(p) { return p.id === productId; });
      if (product) BH.Wishlist.addItem(product);
    }
    // Re-render current page cards
    document.dispatchEvent(new CustomEvent('bh:wishlistupdate'));
  };

  BH.quickAddToCart = function(productId) {
    var product = BH.products.find(function(p) { return p.id === productId; });
    if (product) BH.Cart.addItem(product, 1);
  };

  // ========== BREADCRUMB ==========
  BH.renderBreadcrumb = function(items) {
    return '<nav class="mb-4"><ol class="breadcrumb bh-breadcrumb">' +
      '<li class="breadcrumb-item"><a href="index.html">Home</a></li>' +
      items.map(function(item, i) {
        var isLast = i === items.length - 1;
        return '<li class="breadcrumb-item ' + (isLast ? 'active' : '') + '">' +
          (isLast ? item.label : '<a href="' + item.href + '">' + item.label + '</a>') + '</li>';
      }).join('') +
      '</ol></nav>';
  };

  // ========== STAR RATING ==========
  BH.renderStars = function(rating, size) {
    size = size || 'sm';
    var html = '<div class="bh-stars">';
    for (var i = 1; i <= 5; i++) {
      html += '<i class="bi bi-star' + (i <= rating ? '-fill' : '') + ' text-' + size + '"></i>';
    }
    html += '</div>';
    return html;
  };

  // ========== RATING BREAKDOWN ==========
  BH.renderRatingBreakdown = function(product) {
    if (!product.reviews || !product.reviews.breakdown) return '';
    var bd = product.reviews.breakdown;
    var total = product.reviews.total;
    var html = '<div class="bh-rating-breakdown">';
    for (var star = 5; star >= 1; star--) {
      var count = bd[star] || 0;
      var pct = total > 0 ? Math.round((count / total) * 100) : 0;
      html += '<div class="d-flex align-items-center gap-2 mb-1">\
        <span class="text-sm">' + star + '</span>\
        <i class="bi bi-star-fill text-warning small"></i>\
        <div class="flex-grow-1 bg-light rounded" style="height:6px"><div class="bg-warning rounded" style="height:6px;width:' + pct + '%"></div></div>\
        <span class="text-sm text-muted">' + count + '</span></div>';
    }
    html += '</div>';
    return html;
  };

  // ========== INIT PAGE ==========
  BH.initPage = function(options) {
    options = options || {};
    BH.renderHeader(options);
    if (!options.hideSecondaryNav) {
      BH.renderSecondaryNav(options);
    }
    BH.renderFooter();
  };

  window.BH = BH;
})();
