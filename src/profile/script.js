document.addEventListener('DOMContentLoaded', () => {
    
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.view-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Remove 'active' class from all sidebar links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // 2. Add 'active' class to clicked link
            link.classList.add('active');

            // 3. Hide all sections
            sections.forEach(sec => sec.style.display = 'none');

            // 4. Show target section
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });

    // Optional: Toggle Password Visibility in Settings
    const togglePw = document.querySelector('.toggle-pw');
    if(togglePw) {
        togglePw.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = "password";
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    }
});