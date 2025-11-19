// src/dashboard/script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- Global Elements ---
    const restaurantGrid = document.querySelector('.restaurant-grid');
    const filterPills = document.querySelectorAll('.filter-pills .pill');
    const navLinks = document.querySelectorAll('.navbar nav .nav-link');
    const exploreLink = document.getElementById('explore-link');
    const favoritesLink = document.getElementById('favorites-link');
    const userAvatarEl = document.querySelector('.user-avatar');


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
                    <button class="${btnClass}" ${btnDisabled}>${btnText}</button>
                </div>
            </article>
        `;
    }

    function renderRestaurants(restaurants) {
        restaurantGrid.innerHTML = '';
        if (restaurants.length === 0) {
            restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-grey);">No restaurants found in this category.</p>';
            return;
        }

        const restaurantHTML = restaurants.map(createRestaurantCard).join('');
        restaurantGrid.innerHTML = restaurantHTML;
        setupFavoriteToggles();
    }

    // ----------------------------------------------------
    // --- 3. DATA FETCHING AND UI LOGIC ---
    // ----------------------------------------------------

    // Function to handle the tab switching effect
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
                    'X-User-Id': userId || '' // Send userId for potential favorited status checks
                }
            });
            
            if (!response.ok) {
                // Handle 403 error specifically for viewing favorites while logged out
                if (response.status === 403 && filter === 'favorites') {
                     restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--primary-color);">Please log in to view your favorite restaurants.</p>';
                     return;
                }
                throw new Error('Server error: ' + response.statusText);
            }
            const restaurants = await response.json();
            
            // TEMP: Inject demo status if not provided by server
            const finalRestaurants = restaurants.map((r, index) => ({
                ...r,
                status: r.status || (index === 2 || index === 6 ? 'Fully Booked' : 'Available'),
            }));

            renderRestaurants(finalRestaurants);

        } catch (error) {
            console.error('Error fetching restaurants:', error);
            restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #EF4444;">Failed to load restaurants. Check if your Node.js server is running and connected to Supabase.</p>';
        }
    }


    // ----------------------------------------------------
    // --- 4. EVENT LISTENERS AND INITIAL LOAD ---
    // ----------------------------------------------------
    
    // Navigation Tab Event Listeners
    if (exploreLink) {
        exploreLink.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavLink('explore-link');
            fetchRestaurants(); // Fetch all restaurants
        });
    }

    if (favoritesLink) {
        favoritesLink.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNavLink('favorites-link');
            fetchRestaurants('favorites'); // Fetch only favorited restaurants
        });
    }
    
    // Filter Pill Toggle (Existing logic retained)
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            console.log('Filtering by:', this.textContent);
        });
    });


    // Initial run on page load
    updateUserAvatar();
    fetchRestaurants();
});