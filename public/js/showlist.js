;(function(document, Handlebars, $, _){

  "use strict";

  var noop = function(){},
      Showlists = {
        OFFICIAL: 'OFFICIAL',
        UNOFFICIAL: 'UNOFFICIAL',
      },
      Showlist = function() {
        this.spotify_id = null;
        this.playlists = [];
        this.sxsw_year = sxsw_year;
        this.artists = [];
        this.artist_ids = [];
        this.selected_playlists = [];
        this.unofficial_pages = {};
        this.shows = {
          OFFICIAL: {},
          UNOFFICIAL: {}
        };
        this.run();
      };

  Showlist.prototype = {

    constructor: Showlist,

    bindEvents: function(){
      var that = this;
      document.getElementById('filter-shows').addEventListener('click', function(){
        that.renderShows();
      }, false);
      document.getElementById('obtain-new-token').addEventListener('click', function(){
        that.refreshToken();
      }, false);
      document.getElementById('clear-selections').addEventListener('click', function(){
        that.clearSelections();
      }, false);
    },

    clearSelections: function(){
      this.artists = [];
      this.artist_ids = [];
      this.selected_playlists = [];
      this.renderArtists();
      this.renderPlaylists();
    },

    collectArtists: function(url, callback) {
      var that = this;
      typeof callback !== 'function' && (callback = noop);
      $.ajax({
        url: url,
        headers: {
          'Authorization': 'Bearer ' + that.access_token
        },
        success: function(response) {
          var artists, i, j, k, l,
              tracks = response.tracks.items;
          for (i = 0, j = tracks.length; i < j; i++){
            artists = tracks[i].track.artists;
            for (k = 0, l = artists.length; k < l; k++) {
              if (that.artist_ids.indexOf(artists[k].id) === -1) {
                that.artists.push(artists[k]);
                that.artist_ids.push(artists[k].id);
              }
            }
          }
          callback();
        }
      });
    },

    filterOfficialShows: function(day) {
      var that = this,
          filtered = {},
          artist_names = this.getArtistNames();
      $.each(this.shows[Showlists.OFFICIAL][day], function(i, show) {
        if (artist_names.indexOf(show.artist) > -1) {
          if (!filtered[show.artist]) filtered[show.artist] = [];
          filtered[show.artist].push(show);
        }
      });
      return filtered;
    },

    getArtistNames: function(){
      return this.artists.map(function(artist){
        return artist.name;
      });
    },

    getArtistRegexp: function(artist_names){
      typeof artist_names === 'undefined' && (artist_names = this.getArtistNames());
      return new RegExp(artist_names.map(function(n){
            return "\\b" + n + "\\b";
          }).join('|'), "i");
    },

    getHashParams: function() {
      var hashParams = {},
          e, r = /([^&;=]+)=?([^&;]*)/g,
          q = window.location.hash.substring(1);
      while (e = r.exec(q)) {
         hashParams[e[1]] = decodeURIComponent(e[2]);
      }
      return hashParams;
    },

    isLoaded: function(showlist, day) {
      return this.shows[showlist] && this.shows[showlist][day] &&
        this.shows[showlist][day].length > 0;
    },

    loadDayOfficial: function(day, fn) {
      var that = this, artist, location, time, notes, nodes, node,
          div_id = 'scraper-official-' + day,
          url = this.officialUrl(day);
      typeof fn !== 'function' && (fn = noop);
      if (!this.shows[Showlists.OFFICIAL]) {
        this.shows[Showlists.OFFICIAL] = {};
      }
      if (this.isLoaded(Showlists.OFFICIAL, day)) {
        return fn();
      }
      this.shows[Showlists.OFFICIAL][day] = [];
      if (typeof url === 'undefined') return fn();
      $('body').append('<div id="' + div_id + '" style="display: none;" />');
      $('#' + div_id).load(url + ' #main', function(){
        nodes = $('#' + div_id +' #main .data')[0].childNodes;
        for (var i = 0; i < nodes.length; i++) {
          if (typeof nodes[i].id === 'undefined' || nodes[i].id.substr(0, 11) !== 'cell_event_') {
            continue;
          }
          node = $(nodes[i])[0];
          artist = $(node.getElementsByClassName('col1'))[0] &&
            $(node.getElementsByClassName('col1'))[0].getElementsByClassName('link_item')[0] &&
            $(node.getElementsByClassName('col1'))[0].getElementsByClassName('link_item')[0].innerText.trim();
          location = $(node.getElementsByClassName('col3'))[0] &&
            $(node.getElementsByClassName('col3'))[0].getElementsByClassName('location')[0] &&
            $(node.getElementsByClassName('col3'))[0].getElementsByClassName('location')[0].innerText.trim() || 'TBA';
          time = $(node.getElementsByClassName('col4'))[0] &&
            $(node.getElementsByClassName('col4'))[0].getElementsByClassName('date_time')[0] &&
            $(node.getElementsByClassName('col4'))[0].getElementsByClassName('date_time')[0].innerText.trim() || 'TBA';
          if (!artist) continue;
          that.shows[Showlists.OFFICIAL][day].push({
            artist: artist,
            location: location,
            time: time
          });
        }
        $('#' + div_id).remove();
        fn();
      });
    },

    loadDayUnofficial: function(day, fn) {
      var day_parts = ['day', 'night'];
      if (!this.shows[Showlists.UNOFFICIAL]) {
        this.shows[Showlists.UNOFFICIAL] = {};
      }
      if (this.isLoaded(Showlists.UNOFFICIAL, day)) {
        return fn();
      }
      this.shows[Showlists.UNOFFICIAL][day] = [];
      this.unofficial_pages[day] = [];
      for (var i = 0; i < day_parts.length; i++) {
        this.loadPageUnofficial(day, day_parts[i], fn);
      }
    },

    loadPageUnofficial: function(day, day_part, fn) {
      var that = this, shows_html, shows,
          url = 'http://showlistaustin.com/sxsw/' + this.sxsw_year + '/' + day.substr(0,3) + day_part + '.shtml',
          div_id = 'scraper-unofficial-' + day.substr(0,3) + day_part;
      fn = fn || noop;
      $('body').append('<div id="' + div_id + '" style="display: none;" />');
      $('#' + div_id).load(url + ' .printcontent', function(){
        shows_html = $('#' + div_id)[0].getElementsByTagName('ul')[0].innerHTML;
        shows = shows_html.split(/<hr style="color:#cccccc;"\s*\/*>/);
        for (var i = 0; i < shows.length; i++) {
          if (!shows[i]) continue;
          that.shows[Showlists.UNOFFICIAL][day].push(shows[i]);
        }
        $('#' + div_id).remove();
        that.unofficial_pages[day].push(url);
        if (that.unofficial_pages[day] && that.unofficial_pages[day].length === 2) {
          fn();
        }
      });
    },

    loadPlaylists: function(){
      var that = this,
          playlist_url = 'https://api.spotify.com/v1/users/' + this.spotify_id + '/playlists',
          loadPlaylists = function(url, callback){
            typeof callback !== 'function' && (callback = noop);
            if (!url) {
              return callback();
            }
            $.ajax({
                url: url,
                data: {
                  'limit': 50
                },
                headers: {
                  'Authorization': 'Bearer ' + that.access_token
                },
                success: function(response) {
                  var playlists = response.items.map(function(playlist){
                    playlist.selected = false;
                    return playlist;
                  });
                  that.playlists = that.playlists.concat(playlists);
                  if (response.next) {
                    loadPlaylists(response.next);
                  } else {
                    callback();
                  }
                }
            });
          };
      this.playlists = [];
      loadPlaylists(playlist_url, function(){
        that.renderPlaylists();
      });
    },

    refreshToken: function(callback){
      typeof callback !== 'function' && (callback = noop);
      $.ajax({
        url: '/refresh_token',
        data: {
          'refresh_token': this.refresh_token
        }
      }).done(function(data) {
        this.access_token = data.access_token;
        callback(data);
      });
    },

    renderArtists: function(){
      var that = this;
      var templateSource = document.getElementById('artists-template').innerHTML,
          templateFn = Handlebars.compile(templateSource);
      document.getElementById('artists').innerHTML = templateFn({
        'artists': this.artists
      });
      $('#artists').show();
    },

    renderOfficialShows: function(day) {
      var that = this,
          timeLocationHelper = function(d){
            return [d.time, d.location].join(" at ");
          };
      $('#output').html('');
      $.each(this.filterOfficialShows(day), function(artist_name, artist_shows){
        var output_str = "<p><a href='" + that.sxswSearchUrl(artist_name) +
          "'>" + artist_name + "</a><br />" +
          artist_shows.map(timeLocationHelper).join("<br />") + "</p><br />";
        $('#output').append(output_str);
      });
    },

    renderPlaylists: function(){
      var templateSource = document.getElementById('user-playlists-template').innerHTML,
          templateFn = Handlebars.compile(templateSource),
          that = this,
          playlists = this.playlists.map(function(playlist){
            playlist.selected = that.selected_playlists.indexOf(playlist.id) > -1;
            return playlist;
          });
      document.getElementById('user-playlists').innerHTML = templateFn({
        'playlists': this.playlists
      });
      $('#user-playlists').show();
      $('#user-playlists li').click(function(ev){
        var url = $(this).data('url'),
            playlist_id = $(this).data('id');
        that.collectArtists(url, function(){
          that.renderArtists();
          that.selected_playlists.push(playlist_id);
        });
      });
    },

    renderShows: function() {
      var that = this,
          show_source = $('#show-source').val(),
          show_day = $('#show-day').val();
      $('#loading-img').show();
      $("#filter-shows").prop("disabled",true);
      if (show_source === 'official') {
        that.loadDayOfficial(show_day, function(){
          that.renderOfficialShows(show_day);
          $('#loading-img').hide();
          $("#filter-shows").prop("disabled",false);
        });
      } else {
        that.loadDayUnofficial(show_day, function(){
          that.renderUnofficialShows(show_day);
          $('#loading-img').hide();
          $("#filter-shows").prop("disabled",false);
        });
      }
    },

    renderUnofficialShows: function(day) {
      var artist_names = this.getArtistNames(),
          artist_pattern = this.getArtistRegexp(artist_names);
      $('#output').html('');
      if (artist_names.length === 0) {
        return;
      }
      $.each(this.shows[Showlists.UNOFFICIAL][day], function(i, show){
        if (show.slice(show.indexOf('<li>'),show.length-1).search(artist_pattern) > -1) {
          $('#output').append('<br />' + show);
        }
      });
      $('#output').highlight(artist_names, { wordsOnly: true });
    },

    run: function(){
      var userProfileSource = document.getElementById('user-profile-template').innerHTML,
          userProfileTemplate = Handlebars.compile(userProfileSource),
          userProfilePlaceholder = document.getElementById('user-profile'),
          params = this.getHashParams(),
          that = this;
      this.access_token = params.access_token,
      this.refresh_token = params.refresh_token,
      this.error_msg = params.error;
      if (this.error_msg) {
        alert('There was an error during the authentication');
      } else {
        if (this.access_token) {
          $.ajax({
              url: 'https://api.spotify.com/v1/me',
              headers: {
                'Authorization': 'Bearer ' + this.access_token
              },
              success: function(response) {
                that.spotify_id = response.id;
                userProfilePlaceholder.innerHTML = userProfileTemplate(response);
                that.bindEvents();
                $('#login').hide();
                $('#loggedin').show();
                that.loadPlaylists();
              }
          });
        } else {
            $('#login').show();
            $('#loggedin').hide();
        }
      }
    },

    sxswSearchUrl: function(artist_name) {
      return "http://schedule.sxsw.com/search?q=" + encodeURIComponent(artist_name) +
        "&conferences%5B%5D=film&conferences%5B%5D=interactive&conferences%5B%5D=music";
    }

  };

  new Showlist(2015, 17);

})(document, Handlebars, jQuery, _);
