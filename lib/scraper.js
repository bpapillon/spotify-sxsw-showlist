var CONFIG = require('../config.json'),
    _ = require('underscore'),
    cheerio = require('cheerio'),
    request = require('request');

if (CONFIG.USE_CACHE) {
  var redis = require('redis'),
      redisClient = redis.createClient();
}

var Scraper = {};

Scraper._cacheKey = function(source, day) {
  return source.toLowerCase() + '-' + day.toLowerCase();
}

Scraper._error = function(res, error) {
  return res.send({
    'success': false,
    'error': error,
    'shows': []
  });
};

Scraper._getCached = function(source, day, fn) {
  var key = Scraper._cacheKey(source, day);
  if (CONFIG.USE_CACHE) {
    redisClient.get(key, function (err, reply) {
      if (typeof reply === 'string') {
        return fn(JSON.parse(reply));
      } else {
        return fn(null);
      }
    });
  } else {
    return fn(null);
  }
};

Scraper._storeCache = function(source, day, shows) {
  var key = Scraper._cacheKey(source, day);
  if (CONFIG.USE_CACHE) {
    redisClient.set(key, JSON.stringify(shows || []));
    redisClient.expire(key, CONFIG.CACHE_TTL_SECONDS);
  }
};

Scraper.get = function(source, day, res) {
  var fn = Scraper[source];
  if (typeof fn !== 'function') {
    return res.send({
      'success': false,
      'error': 'Invalid source: ' + source,
      'shows': []
    });
  }
  console.log('Scraper.get', source, day);
  Scraper._getCached(source, day, function(cachedShows){
    if (cachedShows === null) {
      console.log('no cache available');
      Scraper[source](day, res);
    } else {
      console.log('using cache');
      return res.send({
        'success': false,
        'shows': cachedShows
      });
    }
  })
}

Scraper.official = function(day, res) {
  var idx = CONFIG.SXSW_DAYS.indexOf(day),
      url = 'http://schedule.sxsw.com/?conference=music&day=' + (idx + CONFIG.SXSW_START_DAY);
  if (idx === -1) {
    return Scraper._error('Invalid show day: ' + day);
  }
  request(url, function(error, response, html){
    if (error) {
      return Scraper._error(error);
    } else {
      var $ = cheerio.load(html),
          nodes = $('#main .data')[0].childNodes,
          shows = [],
          elm, elm_id, artist, location, time;
      for (var i = 0; i < nodes.length; i++) {
        elm_id = nodes[i].attribs && nodes[i].attribs.id;
        if (!elm_id || elm_id.substr(0, 11) !== 'cell_event_') {
          continue;
        }
        elm = $(nodes[i]).find('.col1');
        elm = elm && elm.find('.link_item');
        artist = elm && elm.text().trim();
        if (!artist) {
          continue;
        }
        elm = $(nodes[i]).find('.col3');
        elm = elm && elm.find('.location');
        location = elm && elm.text() || '';
        location = location.trim() || 'TBA';
        elm = $(nodes[i]).find('.col4');
        elm = elm && elm.find('.date_time');
        date_time = elm && elm.text() || '';
        date_time = date_time.trim() || 'TBA';
        shows.push({
          artist: artist,
          location: location,
          time: date_time
        });
      }
      Scraper._storeCache('official', day, shows);
      res.send({
        'success': true,
        'shows': shows
      });
    }
  });
};

Scraper.unofficial = function(day, res) {
  var i, dayParts = ['day', 'night'],
      loadedCount = 0,
      shows = [];
  if (CONFIG.SXSW_DAYS.indexOf(day) === -1) {
    return Scraper._error('Invalid show day: ' + day);
  }
  _.each(dayParts, function(dayPart){
    var url = 'http://showlistaustin.com/sxsw/' + CONFIG.SXSW_YEAR + '/' + day.substr(0,3) + dayPart + '.shtml';
    request(url, function(error, response, html){
      if (error) {
        loadedCount++;
        return Scraper._error(error);
      } else {
        var $ = cheerio.load(html),
            content = $('.printcontent'),
            shows_html = $('.printcontent').find('ul').html();
        shows_html = shows_html && shows_html.split(/<hr style="color:#cccccc;"\s*\/*>/);
        if (typeof shows_html !== 'object') {
          return Scraper._error('Parser error');
        }
        shows = shows.concat(_.compact(shows_html));
        loadedCount++;
        if (loadedCount >= dayParts.length) {
          Scraper._storeCache('unofficial', day, shows);
          res.send({
            'success': true,
            'shows': shows
          });
        }
      }
    });
  })
};

var exports = module.exports = Scraper;
