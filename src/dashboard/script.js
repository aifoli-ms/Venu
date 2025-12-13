
document.addEventListener('DOMContentLoaded', function () {


    const restaurantGrid = document.querySelector('.restaurant-grid');
    const filterPills = document.querySelectorAll('.filter-pills .pill');
    const navLinks = document.querySelectorAll('.navbar nav .nav-link');
    const exploreLink = document.getElementById('explore-link');
    const favoritesLink = document.getElementById('favorites-link');
    const userAvatarEl = document.querySelector('.user-avatar');



    const userRole = localStorage.getItem('userRole');
    const ownerRestaurantId = localStorage.getItem('ownerRestaurantId');
    console.log('Debug Manage Button:', { userRole, ownerRestaurantId });

    if (userRole === 'owner' && ownerRestaurantId) {
        const navUl = document.querySelector('.navbar nav ul');
        if (navUl) {
            const manageLi = document.createElement('li');
            manageLi.innerHTML = `<a href="../restaurant/manage.html?id=${ownerRestaurantId}" class="nav-link" id="manage-link" style="color: var(--primary-color); font-weight: bold;"><i class="fas fa-store"></i> Manage Restaurant</a>`;
            navUl.appendChild(manageLi);
            console.log('Manage button added to DOM');
        } else {
            console.error('Navbar list not found');
        }
    }

    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const filterLocationInput = document.getElementById('filter-location');
    const filterPriceInput = document.getElementById('filter-price');
    const filterRatingInput = document.getElementById('filter-rating');
    const searchInput = document.getElementById('search-input');


    let allRestaurantsData = [];
    let currentCuisine = 'All';
    let currentSearchTerm = '';

    function getInitials(name) {
        if (!name) return 'SI';

        const parts = name.split(/\s+/).filter(part => part.length > 0);

        if (parts.length >= 2) {
            const firstInitial = parts[0].charAt(0).toUpperCase();
            const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
            return `${firstInitial}${lastInitial}`;
        } else if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return 'SI';
    }

    function updateUserAvatar() {
        const userName = localStorage.getItem('userName');

        if (userAvatarEl) {
            const initials = getInitials(userName);
            userAvatarEl.textContent = initials;

            if (!userName) {
                userAvatarEl.href = '../login/login.html';
            } else {
                userAvatarEl.href = '../profile/profile.html';
            }
        }
    }



    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {

            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            window.location.href = '../login/login.html';
        });
    }

    function setupFavoriteToggles() {
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', async function (e) {
                e.preventDefault();

                const userId = localStorage.getItem('userId');
                if (!userId) {
                    alert("Please log in to add favorites.");
                    window.location.href = '../login/login.html';
                    return;
                }

                const card = this.closest('.restaurant-card');
                const restaurantId = card ? parseInt(card.dataset.id) : null;

                if (!restaurantId) {
                    console.error("Restaurant ID not found.");
                    return;
                }


                const icon = this.querySelector('i');
                this.classList.toggle('active');
                icon.classList.toggle('fa-regular');
                icon.classList.toggle('fa-solid');

                try {
                    const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({ restaurant_id: restaurantId })
                    });

                    if (!response.ok) {
                        throw new Error('Server reported failure to toggle favorite.');
                    }

                } catch (error) {
                    console.error('API Error:', error);
                    alert("Failed to save favorite status. Try again.");


                    this.classList.toggle('active');
                    icon.classList.toggle('fa-regular');
                    icon.classList.toggle('fa-solid');
                }
            });
        });
    }

    function setupReserveButtons() {
        document.querySelectorAll('.reserve-btn').forEach(button => {
            button.addEventListener('click', function (e) {
                if (this.disabled || this.classList.contains('btn-disabled')) {
                    return;
                }

                const restaurantId = this.getAttribute('data-restaurant-id');
                if (restaurantId) {
                    window.location.href = `../restaurant/restaurant.html?id=${restaurantId}`;
                }
            });
        });
    }


    function createRestaurantCard(restaurant) {

        const isFullyBooked = restaurant.status === 'Fully Booked';
        const isFavorite = restaurant.is_favorite || false;

        const statusTag = isFullyBooked
            ? `<div class="status-tag">Fully Booked</div>`
            : '';
        const btnClass = isFullyBooked
            ? 'btn btn-disabled'
            : 'btn btn-primary';
        const btnText = isFullyBooked
            ? 'Not Available'
            : 'Reserve a Table';
        const btnDisabled = isFullyBooked ? 'disabled' : '';


        let imageUrl = restaurant.image_url



        return `
            <article class="restaurant-card" data-id="${restaurant.id}">
                <div class="card-image">
                    <img src="${imageUrl}" alt="${restaurant.name}">
                    ${statusTag}
                    <button class="favorite-btn icon-btn ${isFavorite ? 'active' : ''}">
                        <i class="${isFavorite ? 'fas' : 'fa-regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <h3>${restaurant.name}</h3>
                        <div class="rating">
                            <i class="fas fa-star"></i> ${restaurant.average_rating || 'N/A'}
                        </div>
                    </div>
                    <div class="card-details">
                        <div class="detail-badge">
                            <i class="fas fa-utensils"></i>
                            <span>${restaurant.cuisine_type || 'General'}</span>
                        </div>
                        <div class="detail-badge">
                            <i class="fas fa-wallet"></i>
                            <span>${restaurant.price_range || '₵₵'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${restaurant.location || 'Unknown'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-comment-alt"></i>
                            <span>${restaurant.total_reviews || 0} reviews</span>
                        </div>
                    </div>
                    <button class="${btnClass} reserve-btn" ${btnDisabled} data-restaurant-id="${restaurant.id}">${btnText}</button>
                </div>
            </article>
        `;
    }

    function renderRestaurants(restaurants) {
        restaurantGrid.innerHTML = '';
        if (restaurants.length === 0) {
            restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-grey);">No restaurants found matching these filters.</p>';
            return;
        }

        const restaurantHTML = restaurants.map(createRestaurantCard).join('');
        restaurantGrid.innerHTML = restaurantHTML;
        setupFavoriteToggles();
        setupReserveButtons();
    }


    if (filterToggleBtn && filterDropdown) {
        filterToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
        });


        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && e.target !== filterToggleBtn) {
                filterDropdown.classList.remove('show');
            }
        });


        filterDropdown.addEventListener('click', (e) => e.stopPropagation());
    }


    function applyFilters() {
        let filtered = allRestaurantsData;


        if (currentSearchTerm) {
            const searchLower = currentSearchTerm.toLowerCase().trim();
            filtered = filtered.filter(r => {
                const nameMatch = r.name && r.name.toLowerCase().includes(searchLower);
                const locationMatch = r.location && r.location.toLowerCase().includes(searchLower);
                const cuisineMatch = r.cuisine_type && r.cuisine_type.toLowerCase().includes(searchLower);
                return nameMatch || locationMatch || cuisineMatch;
            });
        }

        if (currentCuisine !== 'All') {
            filtered = filtered.filter(r =>
                r.cuisine_type && r.cuisine_type.toLowerCase().includes(currentCuisine.toLowerCase())
            );
        }

        const locValue = filterLocationInput ? filterLocationInput.value.toLowerCase().trim() : '';
        if (locValue) {
            filtered = filtered.filter(r =>
                r.location && r.location.toLowerCase().includes(locValue)
            );
        }


        const priceValue = filterPriceInput ? filterPriceInput.value : '';
        if (priceValue) {
            filtered = filtered.filter(r => r.price_range === priceValue);
        }

        const ratingValue = filterRatingInput ? parseFloat(filterRatingInput.value) : 0;
        if (ratingValue > 0) {
            filtered = filtered.filter(r => (r.average_rating || 0) >= ratingValue);
        }

        renderRestaurants(filtered);
    }


    function clearFilters() {
        if (filterLocationInput) filterLocationInput.value = '';
        if (filterPriceInput) filterPriceInput.value = '';
        if (filterRatingInput) filterRatingInput.value = '0';
        if (searchInput) searchInput.value = '';

        currentSearchTerm = '';

        currentCuisine = 'All';
        filterPills.forEach(pill => {
            pill.classList.remove('active');
            if (pill.getAttribute('data-cuisine') === 'All' || pill.textContent.trim() === 'All') {
                pill.classList.add('active');
            }
        });

        applyFilters();
        filterDropdown.classList.remove('show');
    }
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
            filterDropdown.classList.remove('show');
        });
    }


    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearFilters();
        });
    }


    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            applyFilters();
        });
    }


    filterPills.forEach(pill => {
        pill.addEventListener('click', function () {

            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            currentCuisine = this.textContent.trim();
            if (this.getAttribute('data-cuisine')) {
                currentCuisine = this.getAttribute('data-cuisine');
            }

            applyFilters();
        });
    });



    function setActiveNavLink(linkId) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.getElementById(linkId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async function fetchRestaurants(filter = null) {
        const userId = localStorage.getItem('userId');

        let url = `${API_BASE_URL}/restaurants`;
        if (filter === 'favorites') {
            url += '?filter=favorites';
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userId ? localStorage.getItem('authToken') : ''}`
                }
            });

            if (!response.ok) {
                if (response.status === 403) {

                    console.warn("Session expired. Logging out.");
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userName');

                    if (filter === 'favorites') {
                        window.location.href = '../login/login.html?msg=expired';
                        return;
                    }
                }
                throw new Error('Server error: ' + response.statusText);
            }
            const restaurants = await response.json();


            allRestaurantsData = restaurants.map((r, index) => ({
                ...r,

                status: r.status || (index === 2 || index === 6 ? 'Fully Booked' : 'Available'),
                price_range: (r.price_range || '₵₵').replace(/\$/g, '₵'),
                average_rating: r.average_rating || 0
            }));


            applyFilters();

        } catch (error) {
            console.error('Error fetching restaurants:', error);
            restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #EF4444;">Failed to load restaurants. Please check your database connection.</p>';
        }
    }



    if (exploreLink) {
        exploreLink.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavLink('explore-link');
            fetchRestaurants();
        });
    }

    if (favoritesLink) {
        favoritesLink.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavLink('favorites-link');
            fetchRestaurants('favorites');
        });
    }


    updateUserAvatar();
    fetchRestaurants();


    const alfredToggleBtn = document.getElementById('alfred-toggle-btn');
    const alfredChatWindow = document.getElementById('alfred-chat-window');
    const alfredCloseBtn = document.getElementById('alfred-close-btn');
    const alfredInputForm = document.getElementById('alfred-input-form');
    const alfredInput = document.getElementById('alfred-input');
    const alfredMessages = document.getElementById('alfred-messages');


    if (alfredToggleBtn && alfredChatWindow) {
        alfredToggleBtn.addEventListener('click', () => {
            alfredChatWindow.classList.toggle('hidden');
            if (!alfredChatWindow.classList.contains('hidden')) {
                alfredInput.focus();
            }
        });
        alfredCloseBtn.addEventListener('click', () => {
            alfredChatWindow.classList.add('hidden');
        });
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        div.textContent = text;
        alfredMessages.appendChild(div);
        alfredMessages.scrollTop = alfredMessages.scrollHeight;
    }



    if (alfredInputForm) {
        alfredInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = alfredInput.value.trim();
            if (!text) return;


            addMessage(text, 'user');
            alfredInput.value = '';

            const userId = localStorage.getItem('userId');
            if (!userId) {
                addMessage("Please log in to chat with Alfred.", 'alfred');
                return;
            }


            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('message', 'alfred');
            loadingDiv.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
            loadingDiv.id = 'alfred-loading';
            alfredMessages.appendChild(loadingDiv);

            try {

                const response = await fetch(`${API_BASE_URL}/alfred/ask`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ user_input: text })
                });


                const loader = document.getElementById('alfred-loading');
                if (loader) loader.remove();

                if (response.ok) {
                    const data = await response.json();
                    addMessage(data.reply, 'alfred');
                } else if (response.status === 403) {
                    addMessage("Session expired. Please log in again.", 'alfred');
                } else {
                    addMessage(`Error: Unknown error occurred.`, 'alfred');
                }

            } catch (err) {
                console.error(err);
                const loader = document.getElementById('alfred-loading');
                if (loader) loader.remove();
                addMessage("Connection error. Check your internet.", 'alfred');
            }
        });
    }
});
