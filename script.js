// Define global variables
let map;
let safetyData = {}; // Object to store safety data for each route segment
let directionsRenderer;
let incidentCounter;
let safetyScore;

// Function to initialize the map
function initMap() {
    // Initialize the map with default options
     map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 30.2672, lng: -97.7431 }, // Default to Austin
        zoom: 10, // Default zoom level
    });

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);


    //document.getElementById("calculate-route-btn").addEventListener("click", handleRouteCalculation);
}

// Function to fetch safety data from external API
async function fetchSafetyData(start, end) {
    try {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    // Parse CSV data into array of objects
                    const csvData = xhr.responseText;
                    const rows = csvData.split('\n');
                    
                    // Define tolerance for latitude and longitude
                    const tolerance = 0.015;

                    // Initialize incident counter
                    incidentCounter = 0;

                    // Iterate through CSV data rows
                    for (let i = 1; i < rows.length; i++) {
                        const values = rows[i].split(',');
                        const latitude = parseFloat(values[24].trim()); // Column 25 
                        const longitude = parseFloat(values[25].trim()); // Column 26

                        // Check if latitude falls within tolerance of start or end latitude
                        if (Math.abs(latitude - start.lat) <= tolerance || Math.abs(latitude - end.lat) <= tolerance) {
                            // Check if longitude falls within tolerance of start or end longitude
                            if (Math.abs(longitude - start.lng) <= tolerance || Math.abs(longitude - end.lng) <= tolerance) {
                                // Increment incident counter
                                incidentCounter++;
                            }
                        }
                    }

                    // Output incident counter
                    console.log("Incident counter:", incidentCounter);
                } else {
                    console.error('Failed to fetch CSV data:', xhr.statusText);
                }
            }
        };
        xhr.open('GET', 'path/to/your/csv/file.csv');
        xhr.send();
            
        // Process the safety data and store it in the safetyData object
        // Example: safetyData[startEndKey] = safetyRating;
        // You may need to parse and format the data based on the API response structure
    } catch (error) {
        console.error("Error fetching safety data:", error);
    }
}

// Function to calculate walking routes between two points
function calculateRoute(start, end) {
    console.log(start);
    console.log(end);
    const request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
    };
    const directionsService = new google.maps.DirectionsService();
    safetyScore = 0;
    directionsService.route(request, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);

            // Once the route is calculated, fetch safety data for each route segment
            const routeSegments = response.routes[0].legs;
            routeSegments.forEach(segment => {
                const start = segment.start_location;
                const end = segment.end_location;
                fetchSafetyData(start, end);
                safetyScore += incidentCounter;
                console.log("Safety score: " + safetyScore);
            });
            safetyScore = (safetyScore / (17 * 800000)) * 100000;
        } else {
            console.error("Error calculating route:", status);
        }
    });
}

// Function to handle user input and trigger route calculation
function handleRouteCalculation() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    // Trigger route calculation and safety data fetching
    calculateRoute(start, end);
}
