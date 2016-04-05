function yelpQuery(location, term, callback) {
  var baseUrl = 'https://api.yelp.com/v2/search';
  var method = 'GET';

  var id = randomString(5, '0123456789');
  var internalCallbackName = 'jsonp_callback_' + id

  var params = {
      callback: internalCallbackName,
      location: location,
      oauth_consumer_key: 'Ad8tVzhbouMTyCMHnNdBbQ',
      oauth_token: 'EdQaVe_8dA_1WBLmEn5-8yqgtuhMaZlD',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: new Date().getTime(),
      oauth_nonce: randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
      term: term,
      sort: 2
  };

  var consumerSecret = 'CgsakLLF-LVuCymnGrS771bI2gU';
  var tokenSecret = 'NdjiUUV9J20gqVHJFM45BN3Ph8A';
  var signature = oauthSignature.generate(method, baseUrl, params, consumerSecret, tokenSecret, { encodeSignature: false });
  params['oauth_signature'] = signature;

  var finalUrl = baseUrl + '?' + toQueryString(params);
  jsonp(finalUrl, id, internalCallbackName).then(function(data) {
    callback(data);
  });
}

function jsonp(uri, id, callbackName) {
    return new Promise(function(resolve, reject){
        window[callbackName] = function(data) {
            delete window[callbackName]
            var ele = document.getElementById(id)
            ele.parentNode.removeChild(ele)
            resolve(data)
        }

        var script = document.createElement('script');
        script.src = uri;
        script.id = id;
        script.async = true;
        script.addEventListener('error', reject);
        document.head.appendChild(script);
    })
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function toQueryString(obj) {
    var parts = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
        }
    }
    return parts.join("&");
}

function googleQuery(latitude, longitude, name, callback){
  var id = randomString(5, '0123456789');
  var internalCallbackName = 'jsonp_callback_' + id

  var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + latitude + "," + longitude + "&radius=500&type=restaurant&name=" + encodeURIComponent(name) + "&key=AIzaSyChUuOhQ2kncZSIHxHgNkaJk3NmEoXNPtg&jsonpCallback=" + internalCallbackName;

  jsonp(url, id, internalCallbackName).then(function(data) {
    callback(data);
  });
}
