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
        const response = await fetch(`http://localhost:3000/restaurants/${restaurantId}`);
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
        document.getElementById('res-rating').textContent = data.average_rating || 'New';
        
        // Set status
        const statusEl = document.getElementById('res-status');
        statusEl.textContent = data.status || 'Open';
        if(data.status === 'Fully Booked') statusEl.style.background = '#EF4444'; // Red
    }

    // 3. Modal Logic
    const modal = document.getElementById('reservation-modal');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('reservation-form');

    openBtn.addEventListener('click', () => {
        if(!userId) {
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

        if(!date || !time) { alert("Please select date and time"); return; }

        try {
            const response = await fetch('http://localhost:3000/reservations', {
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
});