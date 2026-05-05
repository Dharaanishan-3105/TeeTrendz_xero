window.dataLayer = window.dataLayer || [];

function getUser() {
  return JSON.parse(localStorage.getItem('teetrendz_user')) || null;
}

function getUsers() {
  return JSON.parse(localStorage.getItem('teetrendz_users')) || [];
}

function saveUser(user) {
  localStorage.setItem('teetrendz_user', JSON.stringify(user));
  renderAuthLinks();
}

function saveUsers(users) {
  localStorage.setItem('teetrendz_users', JSON.stringify(users));
}

function clearUser() {
  localStorage.removeItem('teetrendz_user');
  renderAuthLinks();
}

function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return getUsers().find(user => user.email === normalized);
}

function generateUserId() {
  return `user_${Math.random().toString(36).slice(2, 10)}`;
}

function trackEvent(eventName, payload = {}) {
  const user = getUser();
  const eventPayload = {
    event: eventName,
    ...payload
  };

  if (user) {
    eventPayload.user_id = user.userId;
    eventPayload.user_email = user.email;
  }

  window.dataLayer.push(eventPayload);
  console.log('dataLayer event:', eventName, eventPayload);
}

function getCart() {
  return JSON.parse(localStorage.getItem('teetrendz_cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('teetrendz_cart', JSON.stringify(cart));
}

function getWishlist() {
  return JSON.parse(localStorage.getItem('teetrendz_wishlist')) || [];
}

function saveWishlist(wishlist) {
  localStorage.setItem('teetrendz_wishlist', JSON.stringify(wishlist));
  renderWishlistCount();
}

function isWishlisted(productId) {
  return getWishlist().some(item => item.id === productId);
}

function addProductToCart(product) {
  if (!product || !product.id) {
    return;
  }

  const cart = getCart();
  const existing = cart.find(item => item.id === product.id && item.selectedSize === (product.selectedSize || 'M'));

  if (existing) {
    existing.quantity += product.quantity || 1;
  } else {
    cart.push({
      ...product,
      quantity: product.quantity || 1,
      selectedSize: product.selectedSize || 'M'
    });
  }

  saveCart(cart);
  if (window.updateCartCount) {
    window.updateCartCount();
  }

  trackEvent('add_to_cart', {
    ecommerce: {
      currency: 'INR',
      value: product.price * (product.quantity || 1),
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: product.quantity || 1,
          item_variant: product.selectedSize || 'M'
        }
      ]
    }
  });
}

function addToWishlist(product) {
  if (!product || !product.id) {
    return;
  }

  const user = getUser();
  if (!user) {
    window.location.href = 'account.html';
    return;
  }

  const wishlist = getWishlist();
  if (wishlist.some(item => item.id === product.id)) {
    alert(product.name + ' is already in your wishlist.');
    return;
  }

  wishlist.push({
    ...product,
    addedAt: new Date().toISOString()
  });

  saveWishlist(wishlist);
  trackEvent('add_to_wishlist', {
    ecommerce: {
      currency: 'INR',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price
        }
      ]
    }
  });

  alert(product.name + ' added to wishlist');
}

function removeFromWishlist(productId) {
  const wishlist = getWishlist().filter(item => item.id !== productId);
  saveWishlist(wishlist);
  trackEvent('remove_from_wishlist', {
    product_id: productId
  });

  if (window.renderWishlistItems) {
    window.renderWishlistItems();
  }
}

function saveForLater(product) {
  if (!product || !product.id) {
    return;
  }

  const user = getUser();
  if (!user) {
    window.location.href = 'account.html';
    return;
  }

  if (!isWishlisted(product.id)) {
    addToWishlist(product);
  }
  removeItemFromCartByProduct(product.id);
}

function removeItemFromCartByProduct(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);

  if (window.renderCartItems) {
    window.renderCartItems();
  }
  if (window.updateCartCount) {
    window.updateCartCount();
  }
}

function renderWishlistCount() {
  const count = getWishlist().length;
  const badge = document.getElementById('wishlistCount');
  if (badge) {
    badge.textContent = count;
  }
}

function renderAuthLinks() {
  const user = getUser();
  const accountNav = document.getElementById('accountNav');
  const wishlistNav = document.getElementById('wishlistNav');

  if (accountNav) {
    if (user) {
      accountNav.textContent = `Hi, ${user.firstName || user.email}`;
      accountNav.classList.add('fw-bold');
    } else {
      accountNav.textContent = 'Sign In';
      accountNav.classList.remove('fw-bold');
    }
  }

  if (wishlistNav) {
    if (!user) {
      wishlistNav.classList.add('text-muted');
    } else {
      wishlistNav.classList.remove('text-muted');
    }
  }

  renderWishlistCount();
}

function initAccountPage() {
  const user = getUser();
  const loggedInSection = document.getElementById('accountProfile');
  const authForms = document.getElementById('authForms');
  const logoutBtn = document.getElementById('logoutBtn');

  if (user) {
    if (loggedInSection) {
      loggedInSection.classList.remove('d-none');
      loggedInSection.querySelector('#profileName').textContent = user.firstName || 'Customer';
      loggedInSection.querySelector('#profileEmail').textContent = user.email;
      loggedInSection.querySelector('#profileId').textContent = user.userId;
      loggedInSection.querySelector('#profileCreatedAt').textContent = new Date(user.createdAt).toLocaleString();
    }
    if (authForms) {
      authForms.classList.add('d-none');
    }
  } else {
    if (loggedInSection) {
      loggedInSection.classList.add('d-none');
    }
    if (authForms) {
      authForms.classList.remove('d-none');
    }
  }

  const signUpForm = document.getElementById('signUpForm');
  const loginForm = document.getElementById('loginForm');
  const signUpMessage = document.getElementById('signUpMessage');
  const loginMessage = document.getElementById('loginMessage');

  if (signUpForm) {
    signUpForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const firstName = document.getElementById('signUpFirstName').value.trim();
      const email = document.getElementById('signUpEmail').value.trim().toLowerCase();

      if (!firstName || !email) {
        signUpMessage.textContent = 'Please enter a name and email.';
        signUpMessage.classList.remove('d-none');
        return;
      }

      if (findUserByEmail(email)) {
        signUpMessage.textContent = 'Email already exists. Please log in.';
        signUpMessage.classList.remove('d-none');
        return;
      }

      const user = {
        userId: generateUserId(),
        email,
        firstName,
        createdAt: new Date().toISOString()
      };

      const users = getUsers();
      users.push(user);
      saveUsers(users);
      saveUser(user);
      signUpMessage.textContent = 'Welcome! You are signed in.';
      signUpMessage.classList.remove('d-none');
      signUpForm.reset();
      renderAuthLinks();
      trackEvent('user_signup', {
        user_id: user.userId,
        user_email: user.email
      });
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const user = findUserByEmail(email);

      if (!user) {
        loginMessage.textContent = 'No account found with that email.';
        loginMessage.classList.remove('d-none');
        return;
      }

      saveUser(user);
      loginMessage.textContent = 'Logged in successfully.';
      loginMessage.classList.remove('d-none');
      loginForm.reset();
      renderAuthLinks();
      trackEvent('user_login', {
        user_id: user.userId,
        user_email: user.email
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      const user = getUser();
      clearUser();
      trackEvent('user_logout', {
        user_id: user ? user.userId : undefined,
        user_email: user ? user.email : undefined
      });
      if (user) {
        alert('You have been signed out.');
      }
    });
  }
}

function initWishlistPage() {
  const wrapper = document.getElementById('wishlistItems');
  const emptyState = document.getElementById('emptyWishlistState');
  const wishlistCount = getWishlist().length;

  if (wrapper) {
    const wishlist = getWishlist();
    wrapper.innerHTML = '';

    if (wishlist.length === 0) {
      emptyState.classList.remove('d-none');
      return;
    }

    emptyState.classList.add('d-none');

    wishlist.forEach(item => {
      const card = document.createElement('div');
      card.className = 'col-md-6';
      card.innerHTML = `
        <div class="card p-4 mb-4">
          <div class="row g-3 align-items-center">
            <div class="col-4">
              <img src="${item.image}" alt="${item.name}" class="img-fluid rounded-3">
            </div>
            <div class="col-8">
              <h5 class="fw-bold mb-1">${item.name}</h5>
              <p class="mini-text mb-2">${item.category} • ₹${item.price}</p>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-primary btn-sm" onclick='addProductToCart(${JSON.stringify(item)})'>Add to Cart</button>
                <button class="btn btn-outline-danger btn-sm" onclick='removeFromWishlist("${item.id}")'>Remove</button>
              </div>
            </div>
          </div>
        </div>
      `;
      wrapper.appendChild(card);
    });
  }

  trackEvent('view_wishlist', {
    page_type: 'wishlist',
    wishlist_count: wishlistCount
  });
}

function initCommonUi() {
  renderAuthLinks();
  renderWishlistCount();
}

document.addEventListener('DOMContentLoaded', function() {
  initCommonUi();
});
