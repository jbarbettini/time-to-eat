var fullList = [];
var shortList = [];
var currentRestaurant;
var desiredLocation;
var desiredPrice;
var map;
var infowindow;
var currentMarker;

function pageScroll(nextSection){
  var element = document.getElementById(nextSection);
  element.style = ""; // ensures that upcoming section is visible
  element.scrollIntoView();
}

function display(status, id) {
  var newValue = "";
  if (!status) {
    newValue = "display:none";
  }
  document.getElementById(id).style = newValue;
}

function inputLocation(e) {
  if (e.keyCode === 13) {
    setLocation();
    return false;
  }
  return true;
}

function setLocation() {
  desiredLocation = document.getElementById('location').value;
  pageScroll('section3');
}

function setPriceRange(userPriceInput) {
  desiredPrice = userPriceInput;
  display(true, 'loading'); // display loading animation
  generateResult(); // start query call to Yelp and Google Places
}

function weightedRating(restaurant) {
  return restaurant.rating * restaurant.review_count;
}

function matchesPrice(restaurant){
  if (desiredPrice === 1 && (restaurant.priceLevel === 1 || restaurant.priceLevel === 0)){
    return true;
  } else if (desiredPrice === 2 && (restaurant.priceLevel === 2 || restaurant.priceLevel === 3)){
    return true;
  } else if (desiredPrice === 4 && restaurant.priceLevel === 4){
    return true;
  } else {
    return false;
  }
}

// this is the bulk of the querying & matching logic
function generateResult() {
  yelpQuery(desiredLocation, 'food', function(response) {

    // Yelp's 'Higest Rated' search returns results according to their adjusted rating system,
    // but I want to apply my own adjusted rating because I'm picky.
    fullList = response.businesses.sort(function(a, b) {
        if (weightedRating(a) > weightedRating(b)){
           return -1;
        } else if (weightedRating(a) < weightedRating(b)) {
          return 1;
        } else {
          return 0;
        }
      });

    // Google Maps wouldn't display properly because it was on a hidden element,
    // so need to reset style attribute of Section 4 early.
    display(true, 'section4');

    // Initialize Google Maps Display for user location
    initMap({lat: response.region.center.latitude, lng: response.region.center.longitude});

    // Initialize Google Places Library
    var googlePlaces = new google.maps.places.PlacesService(map);

    var delayCounter = 0;

    fullList.forEach(function(place) {
      // Set a new property to allow us to know when all Google queries are done
      place['googlePlacesStatus'] = false;

      // Use lat/long of restaurant to find its equivalent in Google Places
      var locationCoord = {lat: place.location.coordinate.latitude, lng: place.location.coordinate.longitude};

      function googlePlacesQuery() {
        googlePlaces.nearbySearch({
          location: locationCoord,
          radius: 500,
          name: place.name,
          type: ['restaurant']
        },
        function(googleResponse, status) {
          // Google Places may not have the price level for the restaurant,
          // so setting price level to -1 to indicate that this data is missing.
          place['priceLevel'] = -1;

          // Verify that no errors occurred in the Google call
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            if (googleResponse[0]['price_level']){
              place['priceLevel'] = googleResponse[0]['price_level'];
            }
            // Saving location to use as a map marker later
            place['markerLoc'] = googleResponse[0].geometry.location;
          }
          // Indicate that this query happened and no need to wait in test.
          place['googlePlacesStatus'] = true;
        });
      }

      // Stagger the request so that Google Places isn't bombarded all at once
      setTimeout(googlePlacesQuery(), delayCounter);
      delayCounter += 300;
    });

    // all requests have been scheduled, but none have returned yet.
    // so we need to wait until Google replies to us.
    waitForResults();
  });
}

function allDone(listArray){
  var stillFalse = listArray.filter(function(item){
    return item['googlePlacesStatus'] === false;
  });

  if (stillFalse.length === 0){
    return true;
  } else {
    return false;
  }
}

function waitForResults() {
  if (allDone(fullList)) { // Check that Google Query is finished
    shortList = fullList.filter(matchesPrice);
    currentRestaurant = 0;
    display(false, 'loading');

    // There may be no results that fit user's parameters.
    // If this is true, send user to reset their parameters. Otherwise, continue as normal.
    if (shortList.length > 0) {
      print();
      pageScroll('section4');
    } else {
      pageScroll('section5');
    }
  } else {
    setTimeout(waitForResults, 250); // continue to wait for all queries to run.
  }
}

// Print restaurant results to HTML
function print() {
  document.getElementById("restaurant-name").innerHTML = shortList[currentRestaurant].name;
  document.getElementById("category").innerHTML = printCategories(shortList[currentRestaurant].categories);
  document.getElementById("phone").innerHTML = shortList[currentRestaurant].display_phone;
  document.getElementById("review-count").innerHTML = shortList[currentRestaurant].review_count;
  document.getElementById("rating").innerHTML = printStars(shortList[currentRestaurant].rating);
  document.getElementById("snippet").innerHTML = shortList[currentRestaurant].snippet_text;
  document.getElementById("location-display").innerHTML = printAddress(shortList[currentRestaurant].location.display_address);
  document.getElementById("read-more").innerHTML = printURL(shortList[currentRestaurant].url);
  removeMarker();
  createMarker(shortList[currentRestaurant].markerLoc, shortList[currentRestaurant].name);
}

// Yelp Categories returns an array with individual categories as subarrays.
// This function allows me to pull the best result of each subarray,
// and turn it into a presentable string for display.
function printCategories(categories) {
  return categories.map(function(category) {
    return category[0];
  }).join(", ");
}

function printStars(rating) {
  if (rating === 5) {
    return '<img src="images/5stars.png" alt="5stars" style="width:150px; vertical-align:middle;">';
  } else if (rating === 4) {
    return '<img src="images/4stars.png" alt="4stars" style="width:150px; vertical-align:middle;">';
  } else if (rating > 4 && rating < 5) {
    return '<img src="images/4-5stars.png" alt="4.5stars" style="width:150px;vertical-align:middle;">';
  }
}

function printAddress(address){
  return address.join("<br>");
}

function printURL(url){
  return '<a href="' + url + '"> (read more)</a>';
}

// Allows user to cycle through the short list of restaurants that fit their criteria
function nextResult(){
  currentRestaurant += 1;
  if (currentRestaurant === shortList.length){
      document.getElementById("next").disabled = true;
      pageScroll('section5');
  } else {
    print();
  }
}

// displays Google Maps with location markers for the restaurants
function initMap(location) {
  map = new google.maps.Map(document.getElementById('map'), {
    center: location,
    zoom: 11
  });
  infowindow = new google.maps.InfoWindow();
}

function createMarker(location, name) {
  currentMarker = new google.maps.Marker({
    map: map,
    position: location
  });
  google.maps.event.addListener(currentMarker, 'click', function() {
    infowindow.setContent(name);
    infowindow.open(map, this);
  });
}

function removeMarker(){
  if (currentMarker){
    currentMarker.setMap(null);
  }
}

// Allows the user to go through the demo again without needing to refresh the page
function reset(){
  currentrestaurant = 0;
  fullList = [];
  shortList = [];
  display(false, 'section2');
  display(false, 'section3');
  display(false, 'section4');
  display(false, 'section5');
  document.getElementById('location').value = "";
  document.getElementById("next").disabled = false;
  pageScroll('section1');
}
