// js/booking.js

document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById("booking-request-form");
    const bookingTrailSelect = document.getElementById("booking-trail");
    const confirmationMessage = document.getElementById("booking-confirmation");
    const dateRangeInput = document.getElementById("booking-date-range"); // Get the new input

    // Populate trail select options in the booking form
    if (bookingTrailSelect && typeof getAllTrails === "function") {
        const trails = getAllTrails();
        trails.forEach(trail => {
            const option = document.createElement("option");
            option.value = trail.id;
            option.textContent = `${trail.name} (${trail.distance} km)`;
            bookingTrailSelect.appendChild(option);
        });
    }

    // Initialize Litepicker if the input exists
    if (dateRangeInput && typeof Litepicker === "function") {
        try {
            const picker = new Litepicker({
                element: dateRangeInput,
                singleMode: false, // Allow range selection
                format: "YYYY-MM-DD", // Date format
                tooltipText: {
                    one: "day",
                    other: "days"
                },
                numberOfMonths: 2, // Show two months for easier range selection
                minDate: new Date() // Prevent selecting past dates
            });
            console.log("[Booking] Litepicker initialized.");
        } catch (error) {
            console.error("[Booking] Failed to initialize Litepicker:", error);
            // Optionally provide fallback or message to user
            dateRangeInput.placeholder = "Error loading date picker";
        }
    } else {
        if (!dateRangeInput) console.error("[Booking] Date range input element not found.");
        if (typeof Litepicker !== "function") console.error("[Booking] Litepicker library not loaded.");
    }

    // Handle booking form submission
    if (bookingForm) {
        bookingForm.addEventListener("submit", (event) => {
            event.preventDefault(); // Prevent actual form submission

            // --- Form Data Retrieval (Optional) ---
            // You could retrieve the data here if you wanted to store it locally
            // or prepare it for a future backend integration.
            // const formData = {
            //     name: document.getElementById("booking-name").value,
            //     email: document.getElementById("booking-email").value,
            //     phone: document.getElementById("booking-phone").value,
            //     dateRange: dateRangeInput.value, // Get value from Litepicker input
            //     hikers: document.getElementById("booking-hikers").value,
            //     trail: document.getElementById("booking-trail").value,
            //     message: document.getElementById("booking-message").value,
            // };
            // console.log("Booking Request Data:", formData);
            // ----------------------------------------

            // Basic validation check (HTML5 `required` attribute handles most)
            if (!bookingForm.checkValidity()) {
                // Optionally provide more specific feedback
                alert("Please fill out all required fields correctly.");
                return;
            }

            // Retrieve form data
            const name = document.getElementById("booking-name").value;
            const email = document.getElementById("booking-email").value;
            const phone = document.getElementById("booking-phone").value;
            const dateRange = dateRangeInput.value;
            const hikers = document.getElementById("booking-hikers").value;
            const trailSelect = document.getElementById("booking-trail");
            const trailName = trailSelect.options[trailSelect.selectedIndex].text;
            const message = document.getElementById("booking-message").value;

            // Construct mailto link
            const recipient = "caretaker@queensriver.co.za";
            const subject = "Booking Request via PWA";
            let body = `New Booking Request:\n\n`;
            body += `Name: ${name}\n`;
            body += `Email: ${email}\n`;
            body += `Phone: ${phone}\n`;
            body += `Requested Dates: ${dateRange}\n`;
            body += `Number of Hikers: ${hikers}\n`;
            body += `Selected Trail: ${trailName}\n`;
            if (message) {
                body += `Message: ${message}\n`;
            }

            const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            // Show confirmation message
            if (confirmationMessage) {
                confirmationMessage.textContent = "Opening email application..."; // Update confirmation text
                confirmationMessage.style.display = "block";
            }

            // Attempt to open mail client
            window.location.href = mailtoLink;

            // Optionally clear the form after attempting mailto
            // bookingForm.reset();
            // if (picker) picker.clearSelection(); // Clear date picker if reset

            // Hide confirmation after a few seconds
            setTimeout(() => {
                if (confirmationMessage) {
                    confirmationMessage.style.display = "none";
                    confirmationMessage.textContent = "Thank you! Your booking request has been submitted. We will contact you shortly."; // Reset text
                }
            }, 5000); // Hide after 5 seconds
        });
    }
});

