var fullList = [];
var shortList = [];
var currentRestaurant;
var desiredPrice;
var travelTime;
var travelMode;

function generateResult() {
  var location = document.getElementById('location').value;

  yelpQuery(location, 'food', function(response) {
    var sortedList = response.businesses.sort(function(a, b){
        if (weightedRating(a) > weightedRating(b)){
           return -1;
        } else if (weightedRating(a) < weightedRating(b)){
          return 1;
        } else {return 0;}
      });
    fullList = sortedList;

    document.getElementById('section4').style = "";
    initMap({lat: response.region.center.latitude, lng: response.region.center.longitude});
    var service = new google.maps.places.PlacesService(map);

    var delayCounter = 0;

    fullList.forEach(function(place){
      place['googlePlacesStatus'] = false;
      var locationCoord = {lat: place.location.coordinate.latitude, lng: place.location.coordinate.longitude};

      setTimeout(function(){
        service.nearbySearch({
          location: locationCoord,
          radius: 500,
          name: place.name,
          type: ['restaurant']
        }, function(placesResponse, status) {
          place['priceLevel'] = -1;
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            if (placesResponse[0]['price_level']){
              place['priceLevel'] = placesResponse[0]['price_level'];
            }
            place['markerLoc'] = placesResponse[0].geometry.location;
          } else {
            console.log('status error' + status);
          }
          place['googlePlacesStatus'] = true;
        });
    }, delayCounter);
    delayCounter+=300;
  });
  waitForResults();
  });
}

// Google API has an frequency limit for database requests.
// These functions help delay the response times so that I can compare Yelp to Google API successfully

function isReadyTest(listArray){
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
  if (isReadyTest(fullList)){
    shortList = fullList.filter(function(restaurant){
      if (desiredPrice === 1 && (restaurant.priceLevel === 1 || restaurant.priceLevel === 0)){
        return true;
      } else if (desiredPrice === 2 && (restaurant.priceLevel === 2 || restaurant.priceLevel === 3)){
        return true;
      } else if (desiredPrice === 4 && restaurant.priceLevel === 4){
        return true;
      } else {
        return false;
      }
    });

    currentRestaurant = 0;
    document.getElementById('loading').style="display:none";

    if (shortList.length > 0){
      print();
      pageScroll('section4');
    } else {
      pageScroll('section5');
    }

  } else {
    setTimeout(waitForResults, 250);
  }
}


// Print Results to HTML

function print(){
  document.getElementById("restaurant-name").innerHTML = shortList[currentRestaurant].name;
  document.getElementById("category").innerHTML = cleanCategories(shortList[currentRestaurant].categories);
  document.getElementById("phone").innerHTML = shortList[currentRestaurant].display_phone;
  document.getElementById("review-count").innerHTML = shortList[currentRestaurant].review_count;
  document.getElementById("rating").innerHTML = printRatings(shortList[currentRestaurant].rating);
  document.getElementById("snippet").innerHTML = shortList[currentRestaurant].snippet_text;
  document.getElementById("location-display").innerHTML = printAddress(shortList[currentRestaurant].location.display_address);
  document.getElementById("read-more").innerHTML = printURL(shortList[currentRestaurant].url);
  removeMarker();
  createMarker(shortList[currentRestaurant].markerLoc, shortList[currentRestaurant].name);
}

function printRatings(rating){
  if (rating === 5){
    return '<img src="images/5stars.png" alt="5stars" style="width:150px; vertical-align:middle;">';
  } else if (rating === 4){
    return '<img src="images/4stars.png" alt="4stars" style="width:150px; vertical-align:middle;">';
  } else if (rating > 4 && rating < 5){
    return '<img src="images/4-5stars.png" alt="4.5stars" style="width:150px;vertical-align:middle;">';
  }
}

function printAddress(address){
  return address.join("<br>");
}

function printURL(url){
  return '<a href="' + url + '">(read more)</a>';
}

function nextResult(){
  currentRestaurant += 1;
  if (currentRestaurant === shortList.length){
      document.getElementById("next").disabled = true;
      pageScroll('section5');
  } else {
    print();
  }
}

// do action & set parameter functions

function pressEnter(e){
  if (e.keyCode === 13) {
    pageScroll('section3');
    return false;
  }
  return true;
}

function pageScroll(nextSection){
  var element = document.getElementById(nextSection);
  element.style="";
  element.scrollIntoView();
}

function weightedRating(restaurant){
  return restaurant.rating * restaurant.review_count;
}

function setPriceRange(userPriceInput){
  desiredPrice = userPriceInput;
  document.getElementById('loading').style="";
  generateResult();
}

function cleanCategories (categories){
  var indivCategories = [];
  for (var i = 0; i < categories.length; i++){
    indivCategories.push(categories[i][0]) + ", ";
  }
  return indivCategories.join(", ");
}

function reset(){
  currentrestaurant = 0;
  fullList = [];
  shortList = [];
  document.getElementById('section2').style="display:none";
  document.getElementById('section3').style="display:none";
  document.getElementById('section4').style="display:none";
  document.getElementById('section5').style="display:none";
  document.getElementById('location').value = "";
  document.getElementById("next").disabled = false;
  pageScroll('section1');
}

var map;
var infowindow;
var currentMarker;

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
