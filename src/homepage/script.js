// src/homepage/script.js

document.addEventListener('DOMContentLoaded', function () {

    // Get the form and inputs
    const bookingForm = document.getElementById('homepage-booking-form');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const peopleInput = document.getElementById('people');

    // --- NEW: Handle Form Submission ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent default form action

            const userId = localStorage.getItem('userId');

            // 1. Check if user is logged in
            if (!userId) {
                alert("Please sign in to find a table.");
                // Redirects to login page if no session is found
                window.location.href = '../login/login.html';
                return;
            }

            // 2. Gather data (we rely on the logic below to clean the inputs)
            const date = dateInput.value;
            const time = timeInput.value;
            const partySize = peopleInput.value.replace(' people', '');

            // Basic validation check (can be improved)
            if (!date || !time || isNaN(parseInt(partySize))) {
                alert("Please enter valid booking details.");
                return;
            }

            // In a real application, you would now store this data temporarily 
            // and redirect the user to the dashboard with filters applied.

            // For now, we simulate success and redirect to the dashboard
            // where they can click 'Reserve a Table' on a specific restaurant.

            window.location.href = '../dashboard/dashboard.html';
        });
    }

    // --- Existing: Date, Time, People Input Logic ---
    // ... (Your existing input focus/blur logic to manage placeholders/types) ...

    // --- Date Input Logic ---
    dateInput.addEventListener('focus', function () {
        this.type = 'date';
        // Clear the placeholder value
        if (this.value === '13/11/2025') {
            this.value = '';
        }
    });

    dateInput.addEventListener('blur', function () {
        // If the input is empty after blurring, revert to text
        if (!this.value) {
            this.type = 'text';
            this.value = '13/11/2025'; // Restore placeholder
        }
    });

    // --- Time Input Logic ---
    timeInput.addEventListener('focus', function () {
        this.type = 'time';
        if (this.value === '7:00 PM') {
            this.value = '19:00'; // Set a default time value
        }
    });

    timeInput.addEventListener('blur', function () {
        if (!this.value) {
            this.type = 'text';
            this.value = '7:00 PM'; // Restore placeholder
        }
    });

    // --- People Input Logic ---
    peopleInput.addEventListener('focus', function () {
        this.type = 'number';
        this.min = 1; // Set a minimum number of people
        if (this.value === '2 people') {
            this.value = 2; // Set a default number value
        }
    });

    peopleInput.addEventListener('blur', function () {
        if (!this.value) {
            this.type = 'text';
            this.value = '2 people'; // Restore placeholder
        } else if (this.value) {
            // Optional: Re-format to 'text' to show "X people"
            // this.type = 'text';
            // this.value = this.value + ' people';
        }
    });

    // --- NEW: Fetch and Render Restaurants ---
    const restaurantsList = document.getElementById('restaurants-list');

    async function fetchRestaurants() {
        try {
            const response = await fetch('/restaurants'); // Relative path works because of proxy or same origin
            if (!response.ok) {
                throw new Error('Failed to fetch restaurants');
            }
            const restaurants = await response.json();
            renderRestaurants(restaurants);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            if (restaurantsList) {
                restaurantsList.innerHTML = '<p style="text-align: center; width: 100%;">Failed to load restaurants. Please try again later.</p>';
            }
        }
    }

    function renderRestaurants(restaurants) {
        if (!restaurantsList) return;

        restaurantsList.innerHTML = ''; // Clear loading state

        if (restaurants.length === 0) {
            restaurantsList.innerHTML = '<p style="text-align: center; width: 100%;">No restaurants found.</p>';
            return;
        }

        // Limit to 3 restaurants for the homepage
        const displayRestaurants = restaurants.slice(0, 3);

        displayRestaurants.forEach(restaurant => {
            const card = document.createElement('div');
            card.className = 'card';

            // Default image if none provided
            const imageUrl = restaurant.image_url || '../../img/default-restaurant.jpg';

            // Format price
            const priceDisplay = restaurant.price_range || '$$';

            card.innerHTML = `
                <div class="card-image">
                    <img src="${imageUrl}" alt="${restaurant.name}" onerror="this.src='../../img/default-restaurant.jpg'">
                </div>
                <div class="card-header">
                    <h3>${restaurant.name}</h3>
                    <span class="rating">⭐ ${restaurant.rating || 'New'}</span>
                    <span class="price">${priceDisplay}</span>
                </div>
                <div class="card-body">
                    <p class="location">${restaurant.location || 'Location not available'}</p>
                    <p class="description">${restaurant.description || 'No description available.'}</p>
                </div>
                <button class="btn btn-primary" onclick="window.location.href='../restaurant/restaurant.html?id=${restaurant.id}'">
                    Reserve a table
                </button>
            `;
            restaurantsList.appendChild(card);
        });
    }

    // Fetch restaurants on load
    fetchRestaurants();

});