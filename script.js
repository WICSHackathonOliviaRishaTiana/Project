// Define global variables
let map;
let directionsRenderer;
let safetyScore = 0;
let incidentCounter = 0;

// Function to initialize the map
function initMap() {
    // Initialize the map with default options
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 30.2672, lng: -97.7431 }, // Default to Austin
        zoom: 10, // Default zoom level
    });

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

// Function to fetch safety data from external API
async function fetchSafetyData(start, end, callback) {
    try {
        const response = await fetch('https://data.austintexas.gov/resource/fdj4-gpfu.json');
        console.log(response.status); // Check HTTP status code
        console.log(response.statusText);
        if (!response.ok) {
            throw new Error('Failed to fetch safety data: ' + response.statusText);
        }

        const data = await response.json();

        // Define tolerance for latitude and longitude
        const tolerance = 0.015;

        // Get the latitude and longitude of start and end locations
        const startLat = start.lat();
        const startLng = start.lng();
        const endLat = end.lat();
        const endLng = end.lng();

        // Initialize incident counter
        let incidentCounter = 0;

        // Iterate through API data
        data.forEach(incident => {
            const latitude = incident.latitude;
            const longitude = incident.longitude;

            // Check if latitude falls within tolerance of start or end latitude
            if (((latitude <= (tolerance + startLat) && (startLat - tolerance) <= latitude) || (latitude <= (tolerance + endLat) &&(startLat - tolerance) <= latitude || (endLat - tolerance) <= latitude)) &&
            (longitude <= (tolerance + startLng) && ((startLng - tolerance) <= longitude))|| (longitude <= (tolerance + endLng) && (endLng - tolerance) <= longitude)) {
                // Increment incident counter
                incidentCounter++;
            }
        });

        // Output incident counter
        console.log("Incident counter:", incidentCounter);
        callback(incidentCounter); // Invoke callback with incident count
    } catch (error) {
        console.error("Error fetching safety data:", error);
    }
}

function calculateRoute(start, end) {
    const request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
    };
    const directionsService = new google.maps.DirectionsService();
    safetyScore = 0;
    let totalDistance = 0; // Variable to store total distance

    directionsService.route(request, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);

            // Once the route is calculated, fetch safety data for each route step
            const routeSegments = response.routes[0].legs;
            console.log("Number of route segments:", routeSegments.length); // Log number of route segments

            const promises = routeSegments.map(segment => {
                const steps = segment.steps;
                return steps.map(step => {
                    return new Promise((resolve, reject) => {
                        const startLocation = step.start_location;
                        const endLocation = step.end_location;
                        console.log("Fetching safety data for step:", startLocation, endLocation); // Log start and end locations

                        // Calculate distance for each step
                        const stepDistance = google.maps.geometry.spherical.computeDistanceBetween(startLocation, endLocation);
                        totalDistance += stepDistance;

                        // Fetch safety data for each step
                        fetchSafetyData(startLocation, endLocation, (count) => {
                            safetyScore += count;
                            console.log("Safety score: " + safetyScore);
                            resolve();
                        });
                    });
                });
            });

            // Flatten the array of promises
            const flattenedPromises = promises.flat();

            // Wait for all promises to resolve
            Promise.all(flattenedPromises)
                .then(() => {
                    const totalDistanceInMiles = totalDistance / 1609.34; // Convert total distance to miles
                    safetyScore = (safetyScore / (totalDistanceInMiles * 21));
                    const paragraphElement = document.getElementById('new-paragraph');
                    if (safetyScore > 45.782) {
                        paragraphElement.textContent = 'This route is unsafe. If you are planning to walk this route at night, try to go with a group of people or take a car service.';
                    } else if (safetyScore < 37.458) {
                        paragraphElement.textContent = 'This route is fairly safe. As always try not to walk alone, but this walking path will not be a huge issue';
                    } else {
                        paragraphElement.textContent = 'This route is considered neutral. It follows the average crime rates, but we always advise caution at night.';
                    }
                    console.log("Total distance:", totalDistanceInMiles.toFixed(2), "miles"); // Log total distance in miles with two decimal places
                    console.log("Final safety score:", safetyScore); // Log final safety score
                })
                .catch(error => {
                    console.error("Error fetching safety data:", error);
                });
        } else {
            console.error("Error calculating route:", status);
        }
    });
}

// Function to handle user input and trigger route calculation
function handleRouteCalculation() {
    const startInput = document.getElementById('start').value;
    const endInput = document.getElementById('end').value;

    // Geocode start and end addresses
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: startInput }, function(startResults, status) {
        if (status === "OK") {
            const start = startResults[0].geometry.location;
            geocoder.geocode({ address: endInput }, function(endResults, status) {
                if (status === "OK") {
                    const end = endResults[0].geometry.location;
                    // Trigger route calculation and safety data fetching
                    calculateRoute(start, end);
                } else {
                    console.error("Geocode was not successful for the end address:", status);
                }
            });
        } else {
            console.error("Geocode was not successful for the start address:", status);
        }
    });
}
