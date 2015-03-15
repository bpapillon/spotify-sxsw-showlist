var CONFIG = require('../settings/config.json'),
    _ = require('underscore'),
    cheerio = require('cheerio'),
    request = require('request');

var Scraper = {};

Scraper._error = function(res, error) {
  return res.send({
    'success': false,
    'error': error,
    'shows': []
  });
};

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
