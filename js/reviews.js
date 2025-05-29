// js/reviews.js

const userReviewsKey = 'queenRoseUserReviews';

// Load existing reviews from localStorage
function loadUserReviews() {
    const reviewsContainer = document.getElementById('user-reviews');
    if (!reviewsContainer) return;

    reviewsContainer.innerHTML = ''; // Clear existing reviews
    const storedReviews = JSON.parse(localStorage.getItem(userReviewsKey) || '[]');

    if (storedReviews.length === 0) {
        reviewsContainer.innerHTML = '<p>No user reviews yet. Be the first!</p>';
        return;
    }

    storedReviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.classList.add('review-item');
        reviewElement.innerHTML = `
            <p><strong>${escapeHTML(review.name)}</strong> (${getStars(review.rating)}):</p>
            <p>${escapeHTML(review.comment)}</p>
            <small>Submitted on: ${new Date(review.timestamp).toLocaleDateString()}</small>
        `;
        reviewsContainer.appendChild(reviewElement);
    });
}

// Handle review form submission
function handleReviewSubmission(event) {
    event.preventDefault();

    const nameInput = document.getElementById('reviewer-name');
    const ratingInput = document.getElementById('review-rating');
    const commentInput = document.getElementById('review-comment');

    const newReview = {
        name: nameInput.value.trim(),
        rating: parseInt(ratingInput.value, 10),
        comment: commentInput.value.trim(),
        timestamp: new Date().toISOString()
    };

    if (!newReview.name || !newReview.comment) {
        alert('Please fill in all fields.');
        return;
    }

    // Save to localStorage
    const storedReviews = JSON.parse(localStorage.getItem(userReviewsKey) || '[]');
    storedReviews.push(newReview);
    localStorage.setItem(userReviewsKey, JSON.stringify(storedReviews));

    // Clear form and reload reviews
    nameInput.value = '';
    ratingInput.value = '5'; // Reset rating
    commentInput.value = '';
    loadUserReviews();

    alert('Thank you for your review!');
}

// Helper function to generate star ratings
function getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Helper function to escape HTML to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Initialize review functionality
document.addEventListener('DOMContentLoaded', () => {
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
    }
    loadUserReviews(); // Load reviews when the page loads
});

