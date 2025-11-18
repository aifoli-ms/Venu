// src/dashboard/script.js

document.addEventListener('DOMContentLoaded', function() {
    
    const restaurantGrid = document.querySelector('.restaurant-grid');
    const filterPills = document.querySelectorAll('.filter-pills .pill');
    
    // 1. Favorite (Heart) Button Toggle Function (Defined at the top to prevent ReferenceError)
    function setupFavoriteToggles() {
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Toggle the 'active' class on the button
                this.classList.toggle('active');

                // Find the <i> icon inside and toggle its class
                const icon = this.querySelector('i');
                icon.classList.toggle('fa-regular'); // Regular (outline)
                icon.classList.toggle('fa-solid');   // Solid
            });
        });
    }


    // 2. Filter Pill Toggle (Existing logic retained)
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Remove 'active' class from all pills
            filterPills.forEach(p => p.classList.remove('active'));
            
            // Add 'active' class to the clicked pill
            this.classList.add('active');

            // In a real app, this would trigger a call to fetchRestaurants(filter=this.textContent)
            console.log('Filtering by:', this.textContent);
        });
    });

    // --- Dynamic Restaurant Card Generation ---

    function createRestaurantCard(restaurant) {
        // Assume default status of 'Available' unless specified
        const isFullyBooked = restaurant.status === 'Fully Booked'; 
        const isFavorite = restaurant.is_favorite; // Placeholder logic until Favorites table is integrated

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
        
        // FIX: Correct local image paths for the browser to resolve them
        let imageUrl = restaurant.image_url || 'https://via.placeholder.com/400';
        
        if (imageUrl.includes('Sol-Lounge-Bar-exterior.jpg')) {
            imageUrl = '../../img/Sol-Lounge-Bar-exterior.jpg'; 
        } else if (imageUrl.includes('quattro-image.jpg')) {
            imageUrl = '../../img/quattro-image.jpg'; 
        } else if (imageUrl.includes('shogun-interior.jpg')) {
            imageUrl = '../../img/shogun-interior.jpg'; 
        }


        // Use fields from your database schema
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
                        <span><i class="fas fa-map-marker-alt"></i> ${restaurant.location || 'Unknown'}</span>
                        <span>${restaurant.price_range || '$$'}</span>
                        <span>${restaurant.total_reviews || 0} reviews</span>
                    </div>
                    <button class="${btnClass}" ${btnDisabled}>${btnText}</button>
                </div>
            </article>
        `;
    }

    function renderRestaurants(restaurants) {
        restaurantGrid.innerHTML = ''; // Clear existing content
        if (restaurants.length === 0) {
            restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">No restaurants found.</p>';
            return;
        }

        const restaurantHTML = restaurants.map(createRestaurantCard).join('');
        restaurantGrid.innerHTML = restaurantHTML;

        // Call the setup function to activate the heart buttons
        setupFavoriteToggles();
    }

    async function fetchRestaurants() {
        try {
            const response = await fetch('http://localhost:3000/restaurants');
            if (!response.ok) {
                // If network is OK but server returns 4xx/5xx
                throw new Error('Server error: ' + response.statusText);
            }
            const restaurants = await response.json();
            
            // TEMP: Inject demo status/favorite state based on index for visual parity
            const demoRestaurants = restaurants.map((r, index) => ({
                ...r,
                status: index === 2 || index === 6 ? 'Fully Booked' : 'Available',
                is_favorite: index === 4 || index === 7 || index === 11 
            }));

            renderRestaurants(demoRestaurants);

        } catch (error) {
            console.error('Error fetching restaurants:', error);
            // Display generic error message on the grid
            restaurantGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #EF4444;">Failed to load restaurants. Check if your Node.js server is running and connected to Supabase.</p>';
        }
    }

    // Run on page load
    fetchRestaurants();
});