document.addEventListener('DOMContentLoaded', function() {
    
    // Get the form inputs
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const peopleInput = document.getElementById('people');

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