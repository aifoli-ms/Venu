// src/dashboard/script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Elements ---
    const restaurantGrid = document.querySelector('.restaurant-grid');
    const filterPills = document.querySelectorAll('.filter-pills .pill');
    const navLinks = document.querySelectorAll('.navbar nav .nav-link');
    const exploreLink = document.getElementById('explore-link');
    const favoritesLink = document.getElementById('favorites-link');
    const userAvatarEl = document.querySelector('.user-avatar');

    // --- New Filter Elements ---
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const filterLocationInput = document.getElementById('filter-location');
    const filterPriceInput = document.getElementById('filter-price');
    const filterRatingInput = document.getElementById('filter-rating');
    const searchInput = document.getElementById('search-input');

    // --- State Management ---
    let allRestaurantsData = []; // Store fetched data here to filter locally
    let currentCuisine = 'All';
    let currentSearchTerm = '';

    // ----------------------------------------------------
    // --- 1. UTILITY FUNCTIONS: AVATAR AND TOGGLES ---
    // ----------------------------------------------------

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
            
            // Set the correct navigation link
            if (!userName) {
                 userAvatarEl.href = '../login/login.html';
            } else {
                 userAvatarEl.href = '../profile/profile.html';
            }
        }
    }
    
    // Favorite (Heart) Button Toggle Function
    function setupFavoriteToggles() {
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', async function(e) {
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
                
                // Optimistic UI Update (Change heart icon immediately)
                const icon = this.querySelector('i');
                this.classList.toggle('active');
                icon.classList.toggle('fa-regular');
                icon.classList.toggle('fa-solid');

                try {
                    const response = await fetch('http://localhost:3000/favorites/toggle', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-User-Id': userId
                        },
                        body: JSON.stringify({ restaurant_id: restaurantId })
                    });

                    if (!response.ok) {
                        throw new Error('Server reported failure to toggle favorite.');
                    }
                    
                } catch (error) {
                    console.error('API Error:', error);
                    alert("Failed to save favorite status. Try again.");
                    
                    // Revert UI change if API fails
                    this.classList.toggle('active');
                    icon.classList.toggle('fa-regular');
                    icon.classList.toggle('fa-solid');
                }
            });
        });
    }

    // Reserve Button Navigation Function
    function setupReserveButtons() {
        document.querySelectorAll('.reserve-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                // Don't navigate if button is disabled (Fully Booked)
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

    // ----------------------------------------------------
    // --- 2. RENDERING FUNCTIONS ---
    // ----------------------------------------------------

    function createRestaurantCard(restaurant) {
        // Use default status and favorite flag if not provided by the server
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
        
        // FIX: Correct local image paths for the browser
        let imageUrl = restaurant.image_url || 'https://via.placeholder.com/400';
        
        if (imageUrl.includes('Sol-Lounge-Bar-exterior.jpg')) {
            imageUrl = '../../img/Sol-Lounge-Bar-exterior.jpg'; 
        } else if (imageUrl.includes('quattro-image.jpg')) {
            imageUrl = '../../img/quattro-image.jpg'; 
        } else if (imageUrl.includes('shogun-interior.jpg')) {
            imageUrl = '../../img/shogun-interior.jpg'; 
        }

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
                        <span>${restaurant.cuisine_type || 'General'}</span>
                        <span style="padding: 0 0.2rem;"> • </span>
                        <span><i class="fas fa-map-marker-alt"></i> ${restaurant.location || 'Unknown'}</span>
                        <span style="padding: 0 0.2rem;"> • </span>
                        <span>${restaurant.price_range || '$$'}</span>
                        <span style="padding: 0 0.2rem;"> • </span>
                        <span>${restaurant.total_reviews || 0} reviews</span>
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

    // ----------------------------------------------------
    // --- 3. FILTER LOGIC ---
    // ----------------------------------------------------

    // Toggle Filter Dropdown
    if (filterToggleBtn && filterDropdown) {
        filterToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            filterDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && e.target !== filterToggleBtn) {
                filterDropdown.classList.remove('show');
            }
        });
        
        // Prevent clicks inside dropdown from closing it
        filterDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Apply Filters Logic
    function applyFilters() {
        let filtered = allRestaurantsData;

        // A. Filter by Search Term (Name, Location, Cuisine)
        if (currentSearchTerm) {
            const searchLower = currentSearchTerm.toLowerCase().trim();
            filtered = filtered.filter(r => {
                const nameMatch = r.name && r.name.toLowerCase().includes(searchLower);
                const locationMatch = r.location && r.location.toLowerCase().includes(searchLower);
                const cuisineMatch = r.cuisine_type && r.cuisine_type.toLowerCase().includes(searchLower);
                return nameMatch || locationMatch || cuisineMatch;
            });
        }

        // B. Filter by Cuisine (Pills)
        if (currentCuisine !== 'All') {
            filtered = filtered.filter(r => 
                r.cuisine_type && r.cuisine_type.toLowerCase().includes(currentCuisine.toLowerCase())
            );
        }

        // C. Filter by Location (Input)
        const locValue = filterLocationInput ? filterLocationInput.value.toLowerCase().trim() : '';
        if (locValue) {
            filtered = filtered.filter(r => 
                r.location && r.location.toLowerCase().includes(locValue)
            );
        }

        // D. Filter by Price (Select)
        const priceValue = filterPriceInput ? filterPriceInput.value : '';
        if (priceValue) {
            filtered = filtered.filter(r => r.price_range === priceValue);
        }

        // E. Filter by Rating (Select)
        const ratingValue = filterRatingInput ? parseFloat(filterRatingInput.value) : 0;
        if (ratingValue > 0) {
            filtered = filtered.filter(r => (r.average_rating || 0) >= ratingValue);
        }

        renderRestaurants(filtered);
    }

    // Clear Filters Function
    function clearFilters() {
        // Reset all filter inputs
        if (filterLocationInput) filterLocationInput.value = '';
        if (filterPriceInput) filterPriceInput.value = '';
        if (filterRatingInput) filterRatingInput.value = '0';
        if (searchInput) searchInput.value = '';
        
        // Reset search term
        currentSearchTerm = '';
        
        // Reset cuisine to "All"
        currentCuisine = 'All';
        filterPills.forEach(pill => {
            pill.classList.remove('active');
            if (pill.getAttribute('data-cuisine') === 'All' || pill.textContent.trim() === 'All') {
                pill.classList.add('active');
            }
        });
        
        // Reapply filters (which will show all restaurants now)
        applyFilters();
        filterDropdown.classList.remove('show'); // Close menu
    }

    // "Apply Filters" Button Listener
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
            filterDropdown.classList.remove('show'); // Close menu
        });
    }

    // "Clear Filters" Button Listener
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearFilters();
        });
    }

    // Search Input Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            applyFilters();
        });
    }

    // Filter Pills Listener
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Update UI
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            // Update Logic
            currentCuisine = this.textContent.trim();
            if (this.getAttribute('data-cuisine')) {
                 currentCuisine = this.getAttribute('data-cuisine');
            }
            
            applyFilters();
        });
    });


    // ----------------------------------------------------
    // --- 4. DATA FETCHING AND UI LOGIC ---
    // ----------------------------------------------------

    function setActiveNavLink(linkId) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.getElementById(linkId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async function fetchRestaurants(filter = null) {
        const userId = localStorage.getItem('userId');
        
        let url = 'http://localhost:3000/restaurants';
        if (filter === 'favorites') {
            url += '?filter=favorites';
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-User-Id': userId || '' 
                }
            });
            
            if (!response.ok) {
                if (response.status === 403 && filter === 'favorites') {
                     restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--primary-color);">Please log in to view your favorite restaurants.</p>';
                     return;
                }
                throw new Error('Server error: ' + response.statusText);
            }
            const restaurants = await response.json();
            
            // Normalize data and Store Globally
            allRestaurantsData = restaurants.map((r, index) => ({
                ...r,
                // Demo status logic (keep existing logic or replace with real data)
                status: r.status || (index === 2 || index === 6 ? 'Fully Booked' : 'Available'),
                price_range: r.price_range || '$$',
                average_rating: r.average_rating || 0
            }));

            // Render with current filters applied
            applyFilters();

        } catch (error) {
            console.error('Error fetching restaurants:', error);
            restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #EF4444;">Failed to load restaurants. Check if your Node.js server is running and connected to Supabase.</p>';
        }
    }


    // ----------------------------------------------------
    // --- 5. EVENT LISTENERS AND INITIAL LOAD ---
    // ----------------------------------------------------
    
    // Navigation Tab Event Listeners
    if (exploreLink) {
        exploreLink.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavLink('explore-link');
            // Reset filters when going back to explore? Optional.
            // currentCuisine = 'All'; 
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
    
    // Initial run on page load
    updateUserAvatar();
    fetchRestaurants();

    // --- ALFRED LOGIC ---
    const alfredToggleBtn = document.getElementById('alfred-toggle-btn');
    const alfredChatWindow = document.getElementById('alfred-chat-window');
    const alfredCloseBtn = document.getElementById('alfred-close-btn');
    const alfredInputForm = document.getElementById('alfred-input-form');
    const alfredInput = document.getElementById('alfred-input');
    const alfredMessages = document.getElementById('alfred-messages');

    // Toggle Window
    if(alfredToggleBtn && alfredChatWindow) {
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

    if(alfredInputForm) {
        alfredInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = alfredInput.value.trim();
            if(!text) return;

            // 1. Add User Message
            addMessage(text, 'user');
            alfredInput.value = '';

            // 2. Show Loading State
            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('message', 'alfred');
            loadingDiv.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
            loadingDiv.id = 'alfred-loading';
            alfredMessages.appendChild(loadingDiv);

            try {
                // 3. Send to Backend
                const response = await fetch('http://localhost:3000/alfred/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_input: text })
                });

                // Remove loading indicator
                const loader = document.getElementById('alfred-loading');
                if(loader) loader.remove();

                if(response.ok) {
                    const data = await response.json();
                    addMessage(data.reply, 'alfred');
                } else {
                    addMessage("I'm having trouble reaching my brain server. Please try again.", 'alfred');
                }

            } catch (err) {
                console.error(err);
                const loader = document.getElementById('alfred-loading');
                if(loader) loader.remove();
                addMessage("Connection error. Check your internet.", 'alfred');
            }
        });
    }
});