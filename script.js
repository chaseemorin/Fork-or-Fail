let currentIndex = 0;
let restaurants = [];
let filteredRestaurants = []; // New variable to store filtered restaurants

// Fisher-Yates Shuffle Algorithm (with placeholder lock)
function shuffleArrayWithPlaceholder(array, placeholderProperty, placeholderValue) {
  const placeholderIndex = array.findIndex(item => item[placeholderProperty] === placeholderValue);
  if (placeholderIndex === -1) {
    console.warn("Placeholder not found in the array.");
    return array;
  }

  const placeholder = array.splice(placeholderIndex, 1)[0];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  array.push(placeholder);
  return array;
}

// Filter restaurants by category and shuffle the filtered results
function filterRestaurantsByCategory(category) {
  if (category === "all") {
    filteredRestaurants = [...restaurants]; // Show all restaurants
  } else {
    filteredRestaurants = restaurants.filter(
      restaurant => restaurant.Category === category
    );
  }

  // Shuffle the filtered restaurants
  shuffleArrayWithPlaceholder(filteredRestaurants, "Name", "No More Options");

  // Reset the current index and update the card display
  currentIndex = 0;
  displayCard();
}

function updateFilterButtonIcon(selectedCategory) {
  const filterButton = document.getElementById("filter-button"); // Select the button element
  const categoryIcons = {
    all: "fa-utensils",        // Fork and knife for "All"
    "Fast Food": "fa-car",     // Car for "Fast Food"
    "Sit-Down": "fa-chair",    // Chair for "Sit-Down"
    Breakfast: "fa-mug-hot",   // Mug for "Breakfast"
    Dessert: "fa-ice-cream",   // Ice Cream for "Dessert"
  };

  // Update the icon inside the button
  filterButton.innerHTML = `<i class="fas ${categoryIcons[selectedCategory] || categoryIcons.all}"></i>`;
}

// Toggle visibility of the category dropdown menu and handle selection
const filterButton = document.getElementById("filter-button");
const categoryDropdown = document.getElementById("category-filter");

filterButton.addEventListener("click", () => {
  categoryDropdown.classList.toggle("hidden"); // Show or hide the dropdown
});

categoryDropdown.addEventListener("change", (event) => {
  const selectedCategory = event.target.value;
  filterRestaurantsByCategory(selectedCategory);
  categoryDropdown.classList.add("hidden"); // Automatically hide the dropdown after selection

  // Update the icon on the filter button
  updateFilterButtonIcon(selectedCategory);

  // Apply filtering logic
  filterRestaurantsByCategory(selectedCategory);
});

// Initialize with the default "All" icon
updateFilterButtonIcon("all");

// Fetch data from SheetDB
async function fetchRestaurants() {
  try {
    const response = await fetch('https://sheetdb.io/api/v1/agggdkqge2kr9?_cache=no');
    const data = await response.json();

    // Initialize restaurants and normalize like values
    restaurants = data.map(restaurant => ({
      ...restaurant,
      Category: restaurant.Category || "Uncategorized", // Ensure the Category field exists
      User1_Like: normalizeLikeValue(restaurant.User1_Like),
      User2_Like: normalizeLikeValue(restaurant.User2_Like),
    }));

    filteredRestaurants = [...restaurants]; // Initialize with all restaurants
    shuffleArrayWithPlaceholder(filteredRestaurants, "Name", "No More Options");
    displayCard();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Normalize like values into boolean
function normalizeLikeValue(value) {
  if (typeof value === 'string') {
    const lowerValue = value.trim().toLowerCase();
    return ['true', 'like', 'yes', '1'].includes(lowerValue); // Add other truthy strings as needed
  }
  return Boolean(value); // Handle non-string values
}

let activeProfile = "User1";

const profilePictures = {
  User1: "https://i.imgur.com/FObK0qf.jpeg",
  User2: "https://i.imgur.com/lz5h2dq.jpeg",
};

// Initialize profile and dropdown references
const profilePicture = document.getElementById("profile-picture");
const dropdownMenu = document.getElementById("dropdown-menu");

// Set default profile picture and glow
profilePicture.style.backgroundImage = `url(${profilePictures[activeProfile]})`;
const card = document.getElementById("card");
card.classList.add(`${activeProfile === "User1" ? "user1-glow" : "user2-glow"}`);

// Toggle dropdown visibility
profilePicture.addEventListener("click", () => {
  dropdownMenu.classList.toggle("hidden");
});

// Handle user selection
dropdownMenu.addEventListener("click", (event) => {
  if (event.target.classList.contains("dropdown-item")) {
    activeProfile = event.target.dataset.user;
    profilePicture.style.backgroundImage = `url(${profilePictures[activeProfile]})`;
    card.classList.remove("user1-glow", "user2-glow");
    card.classList.add(`${activeProfile === "User1" ? "user1-glow" : "user2-glow"}`);
    dropdownMenu.classList.add("hidden");

    // Reset currentIndex and refresh filteredRestaurants
    currentIndex = 0;
    if (filteredRestaurants.length === 0) {
      console.warn("No restaurants available for the selected category.");
      return;
    }

    // Validate and reset filteredRestaurants
    filterRestaurantsByCategory(document.getElementById("category-filter").value);
    displayCard(); // Re-display the updated card
  }
});

// Close dropdown when clicking outside
document.addEventListener("click", (event) => {
  if (!profilePicture.contains(event.target) && !dropdownMenu.contains(event.target)) {
    dropdownMenu.classList.add("hidden");
  }
});

// Function to display the current restaurant card
function displayCard() {
  if (!filteredRestaurants[currentIndex]) {
    console.warn("No restaurant available at current index.");
    return;
  }

  const restaurant = filteredRestaurants[currentIndex];
  const name = document.getElementById("restaurant-name");
  const description = document.getElementById("restaurant-description");
  const location = document.getElementById("restaurant-location");
  const image = document.getElementById("restaurant-image");

  card.classList.remove("swipe-up", "swipe-down");
  name.textContent = restaurant.Name || "Unknown Name";
  description.textContent = restaurant.Description || "No description available.";
  location.textContent = restaurant.Location || "Location not provided.";
  image.src = restaurant.Image || "default-image.png"; // Default image as fallback
}

// Add animation to buttons and card
function animateCard(direction) {
  const card = document.getElementById("card");
  card.classList.add(direction === "up" ? "swipe-up" : "swipe-down");

  setTimeout(() => {
    currentIndex = (currentIndex + 1) % filteredRestaurants.length;
    displayCard();
  }, 300);
}

function updateLike(user, restaurantName) {
  console.log(`Liked by ${user}: ${restaurantName}`);

  const likeColumn = user === "User1" ? "User1_Like" : "User2_Like";
  const body = { [likeColumn]: true }; // Always sending a boolean `true` for "like"

  fetch(`https://sheetdb.io/api/v1/agggdkqge2kr9/Name/${restaurantName}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(response => response.json())
    .then(() => {
      console.log("Like updated successfully!");

      // Refresh data from the sheet to ensure it's up-to-date
      return fetch('https://sheetdb.io/api/v1/agggdkqge2kr9?_cache=no');
    })
    .then(response => response.json())
    .then(data => {
      // Normalize and update restaurants
      restaurants = data.map(restaurant => ({
        ...restaurant,
        User1_Like: normalizeLikeValue(restaurant.User1_Like),
        User2_Like: normalizeLikeValue(restaurant.User2_Like),
      }));

      console.log("Fetched data for current restaurants:", restaurants);

      // Validate and refresh `filteredRestaurants`
      const selectedCategory = document.getElementById("category-filter").value;
      filterRestaurantsByCategory(selectedCategory);

      // Ensure a valid `currentIndex` and display updated card
      if (filteredRestaurants.length > 0) {
        currentIndex = Math.min(currentIndex, filteredRestaurants.length - 1);
        displayCard();
      } else {
        console.warn("No restaurants available in the current filter.");
      }

      // Check for a match with the liked restaurant
      checkForMatch(restaurantName);
    })
    .catch(error => {
      console.error("Error updating like or fetching data:", error);
    });
}

function checkForMatch(restaurantName) {
  console.log(`Restaurants array before match check:`, restaurants);

  const likedRestaurant = restaurants.find(r => r.Name === restaurantName);
  if (!likedRestaurant) {
    console.error(`No restaurant found with the name: ${restaurantName}`);
    return;
  }

  console.log(`Evaluating match for: ${likedRestaurant.Name}`);
  console.log("Current Restaurant Data:", likedRestaurant);

  const user1Like = likedRestaurant.User1_Like;
  const user2Like = likedRestaurant.User2_Like;

  console.log(`User1_Like: ${user1Like}, User2_Like: ${user2Like}`);

  // Ensure matching logic only evaluates for the liked restaurant
  if (user1Like && user2Like) {
    console.log(`Match found for: ${likedRestaurant.Name}`);
    showMatchScreen(likedRestaurant); // Trigger the match screen
  } else {
    console.log("No match yet.");
  }
}

// Match screen display
function showMatchScreen(restaurant) {
  const matchScreen = document.getElementById("match-screen");

  // Populate match details
  document.getElementById("match-restaurant-image").src = restaurant.Image;
  document.getElementById("match-restaurant-name").textContent = restaurant.Name || "Unknown Name";
  document.getElementById("match-restaurant-description").textContent = restaurant.Description || "No description available.";
  document.getElementById("match-restaurant-location").textContent = restaurant.Location || "Location not provided.";

  // Generate confetti
  const confettiContainer = document.querySelector(".confetti-container");
  confettiContainer.innerHTML = ""; // Clear existing confetti

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    confetti.style.backgroundColor = getRandomColor();
    confettiContainer.appendChild(confetti);
  }

  // Show the Match screen
  matchScreen.classList.remove("hidden");
}

// Helper to generate random colors for confetti
function getRandomColor() {
  const colors = ["#32cd32", "#90ee90", "#228b22", "#7cfc00", "#adff2f"];
  return colors[Math.floor(Math.random() * colors.length)];
}

document.getElementById("like-button").addEventListener("click", () => {
  const currentRestaurant = filteredRestaurants[currentIndex];
  updateLike(activeProfile, currentRestaurant.Name);
  animateCard("up");
});

document.getElementById("dislike-button").addEventListener("click", () => {
  console.log(`Skipped by ${activeProfile}: ${filteredRestaurants[currentIndex].Name}`);
  animateCard("down");
});

fetchRestaurants();