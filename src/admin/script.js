//This file is used to display the admin page
//It handles all the logic for the admin page
//It takes the information from the admin.html file and sends it to the API
//It also handles the display of the admin page and reservations
//It also handles the display of the popup messages

const API_URL = '../../index.php';

function getToken() {
    return localStorage.getItem('authToken');
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }
}

checkAuth();


function showModal(title, message, isConfirm = false, onConfirm = null) {
    document.getElementById('generic-modal-title').innerText = title;
    document.getElementById('generic-modal-message').innerText = message;

    const cancelBtn = document.getElementById('generic-cancel-btn');
    const confirmBtn = document.getElementById('generic-confirm-btn');

    if (isConfirm) {
        cancelBtn.style.display = 'inline-block';
        confirmBtn.innerText = 'Confirm';
        confirmBtn.onclick = () => {
            if (onConfirm) onConfirm();
            closeGenericModal();
        };
    } else {
        cancelBtn.style.display = 'none';
        confirmBtn.innerText = 'OK';
        confirmBtn.onclick = closeGenericModal;
    }

    document.getElementById('generic-modal').style.display = 'flex';
}

function closeGenericModal() {
    document.getElementById('generic-modal').style.display = 'none';
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Authorization': `Bearer ${getToken()}`
    };
    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/admin/${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    if (response.status === 401 || response.status === 403) {
        showModal("Unauthorized", "You do not have permission to access this resource.", false, () => {
            window.location.href = '../login/login.html';
        });
        return null;
    }

    return response.json();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`${tabName}-tab`).style.display = 'block';
    event.target.classList.add('active');

    if (tabName === 'users') loadUsers();
    if (tabName === 'reviews') loadReviews();
    if (tabName === 'dashboard') loadStats();
}

async function loadStats() {
    const stats = await apiCall('stats');
    if (!stats) return;

    document.getElementById('total-users').innerText = stats.users;
    document.getElementById('total-reviews').innerText = stats.reviews;
    document.getElementById('total-restaurants').innerText = stats.restaurants;
}

async function loadUsers() {
    const users = await apiCall('users');
    if (!users) return;

    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');


        let actionButtons = '';


        if (user.role !== 'admin') {
            actionButtons += `<button class="action-btn delete-btn" onclick="deleteUser(${user.id})">Delete</button>`;
        }

        if (user.role === 'owner') {
            actionButtons += `<button class="action-btn demote-btn" onclick="updateRole(${user.id}, 'user')">Remove Owner</button>`;
        } else if (user.role !== 'admin') {

            actionButtons += `<button class="action-btn promote-btn" onclick="updateRole(${user.id}, 'owner')">Make Owner</button>`;
        }

        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role || 'user'}</td>
            <td>${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteUser(id) {
    showModal('Delete User', 'Are you sure you want to delete this user?', true, async () => {
        const res = await apiCall(`users/${id}`, 'DELETE');
        if (res && res.message) showModal('Notification', res.message);
        loadUsers();
    });
}


let targetUserId = null;

async function updateRole(id, newRole) {
    if (newRole === 'user' || newRole === 'customer') {
        showModal('Demote User', 'Demote this user? They will be removed as owner from any restaurants.', true, async () => {
            const res = await apiCall(`users/${id}/role`, 'POST', { role: 'customer' });
            if (res && res.message) showModal('Notification', res.message);
            loadUsers();
        });
    } else if (newRole === 'owner') {
        targetUserId = id;
        const modal = document.getElementById('promote-modal');
        const select = document.getElementById('restaurant-select');

        const restaurants = await apiCall('all_restaurants');
        if (!restaurants) return;

        select.innerHTML = '<option value="">-- Select Restaurant --</option>';
        restaurants.filter(r => !r.owner_id).forEach(r => {
            select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
        });

        modal.style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('promote-modal').style.display = 'none';
    targetUserId = null;
}

async function confirmPromotion() {
    const select = document.getElementById('restaurant-select');
    const restaurantId = select.value;

    if (!restaurantId) {
        showModal('Error', "Please select a restaurant.");
        return;
    }

    showModal('Confirm Promotion', 'Assign this user as owner of the selected restaurant?', true, async () => {
        const res = await apiCall(`users/${targetUserId}/role`, 'POST', {
            role: 'owner',
            restaurant_id: restaurantId
        });
        if (res && res.message) showModal('Notification', res.message);

        closeModal();
        loadUsers();
    });
}

async function loadReviews() {
    const reviews = await apiCall('reviews');
    if (!reviews) return;

    const tbody = document.getElementById('reviews-table-body');
    tbody.innerHTML = '';

    reviews.forEach(review => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${review.id}</td>
            <td>${review.user_name}</td>
            <td>${review.restaurant_name}</td>
            <td>${review.rating}</td>
            <td>${review.comment}</td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteReview(${review.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteReview(id) {
    showModal('Delete Review', 'Delete this review?', true, async () => {
        await apiCall(`reviews/${id}`, 'DELETE');
        showModal('Notification', 'Review deleted.');
        loadReviews();
    });
}

document.getElementById('add-restaurant-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const res = await apiCall('restaurants', 'POST', data);
    if (res && res.message) {
        showModal('Success', res.message);
        e.target.reset();
    }
});

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    window.location.href = '../login/login.html';
}


loadStats();
