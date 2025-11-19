// src/homepage/script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Get the form and inputs
    const bookingForm = document.getElementById('homepage-booking-form');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const peopleInput = document.getElementById('people');

    // --- NEW: Handle Form Submission ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
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
            alert(`Searching for tables on ${date} at ${time} for ${partySize} people.`);
            window.location.href = '../dashboard/dashboard.html';
        });
    }

    // --- Existing: Date, Time, People Input Logic ---
    // ... (Your existing input focus/blur logic to manage placeholders/types) ...
    
    // --- Date Input Logic ---
    dateInput.addEventListener('focus', function() {
        this.type = 'date';
        // Clear the placeholder value
        if (this.value === '13/11/2025') {
            this.value = '';
        }
    });

    dateInput.addEventListener('blur', function() {
        // If the input is empty after blurring, revert to text
        if (!this.value) {
            this.type = 'text';
            this.value = '13/11/2025'; // Restore placeholder
        }
    });

    // --- Time Input Logic ---
    timeInput.addEventListener('focus', function() {
        this.type = 'time';
        if (this.value === '7:00 PM') {
            this.value = '19:00'; // Set a default time value
        }
    });

    timeInput.addEventListener('blur', function() {
        if (!this.value) {
            this.type = 'text';
            this.value = '7:00 PM'; // Restore placeholder
        }
    });

    // --- People Input Logic ---
    peopleInput.addEventListener('focus', function() {
        this.type = 'number';
        this.min = 1; // Set a minimum number of people
        if (this.value === '2 people') {
            this.value = 2; // Set a default number value
        }
    });

    peopleInput.addEventListener('blur', function() {
        if (!this.value) {
            this.type = 'text';
            this.value = '2 people'; // Restore placeholder
        } else if (this.value) {
            // Optional: Re-format to 'text' to show "X people"
            // this.type = 'text';
            // this.value = this.value + ' people';
        }
    });

});