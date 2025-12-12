
document.addEventListener('DOMContentLoaded', function () {

    const bookingForm = document.getElementById('homepage-booking-form');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const peopleInput = document.getElementById('people');


    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const userId = localStorage.getItem('userId');

 
            if (!userId) {
            
                window.location.href = '../login/login.html';
                return;
            }

            const date = dateInput.value;
            const time = timeInput.value;
            const partySize = peopleInput.value.replace(' people', '');
            if (!date || !time || isNaN(parseInt(partySize))) {
                alert("Please enter valid booking details.");
                return;
            }

            window.location.href = '../dashboard/dashboard.html';
        });
    }

    dateInput.addEventListener('focus', function () {
        this.type = 'date';
        if (this.value === '13/11/2025') {
            this.value = '';
        }
    });

    dateInput.addEventListener('blur', function () {
        if (!this.value) {
            this.type = 'text';
            this.value = '13/11/2025';
        }
    });

    timeInput.addEventListener('focus', function () {
        this.type = 'time';
        if (this.value === '7:00 PM') {
            this.value = '19:00';   
        }
    });

    timeInput.addEventListener('blur', function () {
        if (!this.value) {
            this.type = 'text';
            this.value = '7:00 PM'; 
        }
    });

    peopleInput.addEventListener('focus', function () {
        this.type = 'number';
        this.min = 1; 
        if (this.value === '2 people') {
            this.value = 2;
        }
    });

    peopleInput.addEventListener('blur', function () {
        if (!this.value) {
            this.type = 'text';
            this.value = '2 people'; 
        } else if (this.value) {
        }
    });

    const restaurantsList = document.getElementById('restaurants-list');

    async function fetchRestaurants() {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants`); 
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

        restaurantsList.innerHTML = ''; 

        if (restaurants.length === 0) {
            restaurantsList.innerHTML = '<p style="text-align: center; width: 100%;">No restaurants found.</p>';
            return;
        }

          
        const displayRestaurants = restaurants.slice(0, 3);

        displayRestaurants.forEach(restaurant => {
            const card = document.createElement('div');
            card.className = 'card';

            const imageUrl = restaurant.image_url || '../../img/default-restaurant.jpg';

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


    fetchRestaurants();

});