document.addEventListener('DOMContentLoaded', async () => {

    // 0. Update User Avatar
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
        const userAvatarEl = document.getElementById('restaurant-avatar-initials');
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

    updateUserAvatar();

    // 1. Get Restaurant ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('id');
    const userId = localStorage.getItem('userId'); // Needed for reservation

    if (!restaurantId) {
        alert("No restaurant specified.");
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    // 2. Fetch Restaurant Details
    try {
        const response = await fetch(`/restaurants/${restaurantId}`);
        if (!response.ok) throw new Error("Failed to fetch details");

        const data = await response.json();
        populatePage(data);
    } catch (error) {
        console.error(error);
        document.getElementById('res-name').textContent = "Error loading restaurant";
    }

    function populatePage(data) {
        document.getElementById('res-name').textContent = data.name;
        document.getElementById('res-cuisine').textContent = data.cuisine_type;
        document.getElementById('res-location').textContent = data.location || 'Unknown';
        document.getElementById('res-price').textContent = data.price_range || '$$';
        document.getElementById('res-total-reviews').textContent = `${data.total_reviews || 0} reviews`;

        document.getElementById('res-rating').textContent = data.average_rating || 'New';

        // Set status
        const statusEl = document.getElementById('res-status');
        statusEl.textContent = data.status || 'Open';
        if (data.status === 'Fully Booked') statusEl.style.background = '#EF4444'; // Red
    }

    // 3. Modal Logic
    const modal = document.getElementById('reservation-modal');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('reservation-form');

    openBtn.addEventListener('click', () => {
        if (!userId) {
            alert("Please login to reserve.");
            window.location.href = '../login/login.html';
            return;
        }
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // 4. Handle Reservation Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = document.getElementById('modal-date').value;
        const time = document.getElementById('modal-time').value;
        const party = document.getElementById('modal-party').value;

        if (!date || !time) { alert("Please select date and time"); return; }

        try {
            const response = await fetch('/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    reservation_date: date,
                    reservation_time: time,
                    party_size: party
                })
            });

            if (response.ok) {
                alert("Reservation Confirmed!");
                modal.classList.add('hidden');
            } else {
                const err = await response.json();
                alert("Error: " + err.message);
            }
        } catch (error) {
            console.error(error);
            alert("Connection failed");
        }
    });

    // 5. Review Logic
    const reviewModal = document.getElementById('review-modal');
    const openReviewBtn = document.getElementById('open-review-modal-btn');
    const closeReviewBtn = document.querySelector('.close-review-modal');
    const reviewForm = document.getElementById('review-form');
    const reviewsList = document.getElementById('reviews-list');

    // Fetch and display reviews
    async function fetchReviews() {
        try {
            const response = await fetch(`/restaurants/${restaurantId}/reviews`);
            if (!response.ok) throw new Error("Failed to fetch reviews");
            const reviews = await response.json();
            renderReviews(reviews);
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    }

    function renderReviews(reviews) {
        reviewsList.innerHTML = '';
        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>No reviews yet.</p>
                </div>`;
            document.getElementById('review-rating').textContent = '--';
            return;
        }

        // Calculate average rating
        const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        document.getElementById('review-rating').textContent = avgRating;
        document.getElementById('res-rating').textContent = avgRating; // Update main rating too

        reviews.forEach(review => {
            const reviewEl = document.createElement('div');
            reviewEl.className = 'review-item';
            reviewEl.style.borderBottom = '1px solid #eee';
            reviewEl.style.padding = '1rem 0';
            reviewEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>${review.users ? review.users.name : 'Anonymous'}</strong>
                    <span style="color: #F59E0B;"><i class="fas fa-star"></i> ${review.rating}</span>
                </div>
                <p style="color: #666; font-size: 0.9rem;">${review.comment}</p>
                <small style="color: #999;">${new Date(review.created_at).toLocaleDateString()}</small>
            `;
            reviewsList.appendChild(reviewEl);
        });
    }

    fetchReviews();

    // 6. Menu Logic
    const menusList = document.getElementById('menus-list');

    // Fetch and display menus
    async function fetchMenus() {
        try {
            const response = await fetch(`/restaurants/${restaurantId}/menus`);
            if (!response.ok) throw new Error("Failed to fetch menus");
            const menus = await response.json();
            renderMenus(menus);
        } catch (error) {
            console.error("Error loading menus:", error);
        }
    }

    function renderMenus(menus) {
        if (!menusList) return; // Guard if element doesn't exist yet

        menusList.innerHTML = '';
        if (menus.length === 0) {
            menusList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>No menus available.</p>
                </div>`;
            return;
        }

        menus.forEach(menu => {
            const menuEl = document.createElement('div');
            menuEl.className = 'menu-item';
            menuEl.innerHTML = `
                <h4>${menu.name}</h4>
                ${menu.description ? `<p>${menu.description}</p>` : ''}
            `;
            menusList.appendChild(menuEl);
        });
    }

    fetchMenus();


    // Modal Handlers
    openReviewBtn.addEventListener('click', () => {
        if (!userId) {
            alert("Please login to write a review.");
            window.location.href = '../login/login.html';
            return;
        }
        reviewModal.classList.remove('hidden');
    });

    closeReviewBtn.addEventListener('click', () => reviewModal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === reviewModal) reviewModal.classList.add('hidden');
    });

    // Submit Review
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ratingEl = document.querySelector('input[name="rating"]:checked');
        const rating = ratingEl ? ratingEl.value : null;
        const comment = document.getElementById('review-comment').value;

        if (!rating) {
            alert("Please select a rating");
            return;
        }

        try {
            const response = await fetch(`/restaurants/${restaurantId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId
                },
                body: JSON.stringify({ rating, comment })
            });

            if (response.ok) {
                alert("Review submitted!");
                reviewModal.classList.add('hidden');
                reviewForm.reset();
                fetchReviews(); // Refresh list
            } else {
                const err = await response.json();
                alert("Error: " + err.message);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to submit review");
        }
    });
});