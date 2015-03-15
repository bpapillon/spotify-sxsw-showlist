/**
 * Some of this is adapted from the Spotify Web API tutorial code
 * https://github.com/spotify/web-api-auth-examples
 */

var express = require('express'),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    scraper = require('./lib/scrapers')
    CONFIG = require('./settings/config.json'),
    CREDENTIALS = require('./settings/credentials.json');

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state',
    app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {
  var state = generateRandomString(16),
      scope = 'user-read-private user-read-email playlist-read-private';
  res.cookie(stateKey, state);
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CREDENTIALS.CLIENT_ID,
      scope: scope,
      redirect_uri: CREDENTIALS.REDIRECT_URI,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  var code = req.query.code || null,
      state = req.query.state || null,
      storedState = req.cookies ? req.cookies[stateKey] : null;
  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: CREDENTIALS.REDIRECT_URI,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(CREDENTIALS.CLIENT_ID + ':' + CREDENTIALS.CLIENT_SECRET).toString('base64'))
      },
      json: true
    };
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var accessToken = body.access_token,
            refreshToken = body.refresh_token,
            options = {
              url: 'https://api.spotify.com/v1/me',
              headers: { 'Authorization': 'Bearer ' + accessToken },
              json: true
            };
        res.redirect('/#' +
          querystring.stringify({
            access_token: accessToken,
            refresh_token: refreshToken
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {
  var refreshToken = req.query.refresh_token,
      authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(CREDENTIALS.CLIENT_ID + ':' + CREDENTIALS.CLIENT_SECRET).toString('base64')) },
        form: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        json: true
      };
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var accessToken = body.access_token;
      res.send({
        'access_token': accessToken
      });
    }
  });
});

app.get('/shows/official/*', function(req, res) {
  var urlParts = req.url.split('/'),
      day = urlParts[urlParts.length - 1];
  if (CONFIG.SXSW_DAYS.indexOf(day) === -1) {
    return res.send({
      'success': false,
      'error': 'Invalid show day: ' + day,
      'shows': []
    });
  }
  var idx = CONFIG.SXSW_DAYS.indexOf(day),
      url = 'http://schedule.sxsw.com/?conference=music&day=' + (idx + CONFIG.SXSW_START_DAY);
  scraper.official(url, res);
});

app.get('/shows/unofficial/*', function(req, res) {
  var urlParts = req.url.split('/'),
      day = urlParts[urlParts.length - 1],
      url = null;
  scraper.unofficial(url, res);
});

console.log('Listening on 8888');
app.listen(8888);
