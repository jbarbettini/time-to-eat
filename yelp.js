// Calls Yelp API. Yelp requires OAuth 1.0a authentication on each request
// https://www.yelp.com/developers/documentation/v2/authentication
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

  // In a real app, this would probably be hidden in the backend.
  // But for the sake of this demo, I'm leaving it as is.
  // Please don't mess with me. I'm just trying to learn javascript :)
  var consumerSecret = 'CgsakLLF-LVuCymnGrS771bI2gU';
  var tokenSecret = 'NdjiUUV9J20gqVHJFM45BN3Ph8A';
  var signature = oauthSignature.generate(method, baseUrl, params, consumerSecret, tokenSecret, { encodeSignature: false });
  params['oauth_signature'] = signature;

  var finalUrl = baseUrl + '?' + toQueryString(params);
  jsonp(finalUrl, id, internalCallbackName).then(function(data) {
    callback(data);
  });
}

// Required for Yelp API access
// Found how to do this via StackOverflow: http://stackoverflow.com/a/31556957/6159183
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

// Create random string to fit Yelp's oauth_nonce criteria
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

// Also via StackOverflow: http://stackoverflow.com/a/5505137/6159183
function toQueryString(obj) {
    var parts = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
        }
    }
    return parts.join("&");
}
