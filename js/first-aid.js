// First Aid Guide Collapsible Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get all collapsible buttons
    const collapsibleButtons = document.querySelectorAll('.collapsible-button');
    
    // Add click event listener to each button
    collapsibleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Toggle active class on the button
            this.classList.toggle('active');
            
            // Get the content panel
            const content = this.nextElementSibling;
            
            // If the content is already active (open), close it
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                content.style.maxHeight = null;
            } else {
                // Close all other open content panels
                document.querySelectorAll('.collapsible-content.active').forEach(openContent => {
                    openContent.classList.remove('active');
                    openContent.style.maxHeight = null;
                    openContent.previousElementSibling.classList.remove('active');
                });
                
                // Open this content panel
                content.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
});
