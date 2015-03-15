var request = require('request'),
    cheerio = require('cheerio');

var Scraper = {};

Scraper.official = function(url, res) {
  request(url, function(error, response, html){
    if (error) {
      res.send({
        'success': false,
        'error': error,
        'shows': []
      });
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

Scraper.unofficial = function(url, res) {
  res.send({
    'success': false,
    'error': 'Not yet implemented',
    'shows': []
  });
};

var exports = module.exports = Scraper;
