// Define global variables
let map;
let safetyData = {}; // Object to store safety data for each route segment

// Function to initialize the map
function initMap() {
    // Initialize the map with default options
        map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 30.2672, lng: 97.7431 }, // Default to Austin
        zoom: 10, // Default zoom level
    });
}

// Function to fetch safety data from external API
async function fetchSafetyData(start, end) {
    try {
        // Make an API request to fetch safety data for the specified route
        const response = await fetch(`https://example.com/safety-api?start=${start}&end=${end}`);
        const data = await response.json();

        // Process the safety data and store it in the safetyData object
        // Example: safetyData[startEndKey] = safetyRating;
        // You may need to parse and format the data based on the API response structure
    } catch (error) {
        console.error("Error fetching safety data:", error);
    }
}

// Function to calculate walking routes between two points
function calculateRoute(start, end) {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    const request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.WALKING,
    };

    directionsService.route(request, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);

            // Once the route is calculated, fetch safety data for each route segment
            // Replace "response.routes[0].legs" with the appropriate path in the response object
            const routeSegments = response.routes[0].legs;
            routeSegments.forEach(segment => {
                const start = segment.start_location;
                const end = segment.end_location;
                fetchSafetyData(start, end);
            });
        } else {
            console.error("Error calculating route:", status);
        }
    });
}

// Function to handle user input and trigger route calculation
function handleRouteCalculation() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    // Trigger route calculation and safety data fetching
    calculateRoute(start, end);
}

// Add event listener for the route calculation button
document.getElementById("calculate-route-btn").addEventListener("click", handleRouteCalculation);
