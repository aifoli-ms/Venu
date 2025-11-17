document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Favorite (Heart) Button Toggle
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    favoriteButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Toggle the 'active' class on the button
            this.classList.toggle('active');

            // Find the <i> icon inside and toggle its class
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-regular'); // Regular (outline)
            icon.classList.toggle('fa-solid');   // Solid
        });
    });


    // 2. Filter Pill Toggle
    const filterPills = document.querySelectorAll('.filter-pills .pill');

    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Remove 'active' class from all pills
            filterPills.forEach(p => p.classList.remove('active'));
            
            // Add 'active' class to the clicked pill
            this.classList.add('active');

            // In a real app, you would now filter the restaurant grid
            // based on the text of this pill, e.g., this.textContent
            console.log('Filtering by:', this.textContent);
        });
    });

});