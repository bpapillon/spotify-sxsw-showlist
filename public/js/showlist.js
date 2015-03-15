;(function(document, Handlebars, $){

  "use strict";

  var noop = function(){},
      Showlists = {
        OFFICIAL: 'OFFICIAL',
        UNOFFICIAL: 'UNOFFICIAL',
      },
      Showlist = function() {
        this.spotify_id = null;
        this.playlists = [];
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
        that.loadAndRenderShows();
      }, false);
      // document.getElementById('obtain-new-token').addEventListener('click', function(){
      //   that.refreshToken();
      // }, false);
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
          artist_names = this.getArtistNames(),
          shows = this.shows[Showlists.OFFICIAL][day];
      $.each(shows, function(i, show) {
        if (artist_names.indexOf(show.artist) > -1) {
          if (typeof filtered[show.artist] === 'undefined') {
            filtered[show.artist] = [];
          }
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

    loadAndRenderShows: function() {
      var that = this,
          show_day = $('#show-day').val().toLowerCase(),
          show_source = $('#show-source').val().toLowerCase();
      $('#loading-img').show();
      $("#filter-shows").prop("disabled", true);
      return this.loadShows(show_source, show_day, function(){
        that.renderShows(show_source, show_day);
        $('#loading-img').hide();
        $("#filter-shows").prop("disabled", false);
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
                    loadPlaylists(response.next, callback);
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

    loadShows: function(show_source, day, fn) {
      var that = this;
      typeof fn !== 'function' && (fn = noop);
      show_source = show_source.toUpperCase();
      if (!this.shows[Showlists[show_source]]) {
        this.shows[Showlists[show_source]] = {};
      }
      if (this.isLoaded(Showlists[show_source], day)) {
        return fn();
      }
      this.shows[Showlists[show_source]][day] = [];
      $.ajax({
          url: '/shows/' + show_source.toLowerCase() + '/' + day,
          success: function(response) {
            if (response.error) {
              alert(response.error);
            } else {
              that.shows[Showlists[show_source]][day] = response.shows;
            }
            fn();
          }
      });
    },

    // refreshToken: function(callback){
    //   typeof callback !== 'function' && (callback = noop);
    //   $.ajax({
    //     url: '/refresh_token',
    //     data: {
    //       'refresh_token': this.refresh_token
    //     }
    //   }).done(function(data) {
    //     this.access_token = data.access_token;
    //     callback(data);
    //   });
    // },

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
      $('#shows').html('');
      $.each(this.filterOfficialShows(day), function(artist_name, artist_shows){
        var output_str = "<p><a href='" + that.sxswSearchUrl(artist_name) +
          "' target='_blank'>" + artist_name + "</a><br />" +
          artist_shows.map(timeLocationHelper).join("<br />") + "</p><br />";
        $('#shows').append(output_str);
      });
    },

    renderPlaylists: function(){
      var templateSource = document.getElementById('user-playlists-template').innerHTML,
          templateFn = Handlebars.compile(templateSource),
          that = this,
          playlists = this.playlists.map(function(playlist){
            playlist.selected = that.selected_playlists.indexOf(playlist.id) > -1;
            playlist.selected_class = playlist.selected ? 'selected' : '';
            return playlist;
          });
      document.getElementById('user-playlists').innerHTML = templateFn({
        'playlists': this.playlists
      });
      $('#user-playlists').show();
      $('#user-playlists .playlist').click(function(ev){
        var url = $(this).data('url'),
            playlist_id = $(this).data('id');
        that.collectArtists(url, function(){
          that.renderArtists();
          that.selected_playlists.push(playlist_id);
          that.renderPlaylists();
        });
      });
    },

    renderShows: function(show_source, show_day){
      show_source = show_source.toUpperCase();
      if (show_source === Showlists.OFFICIAL) {
        return this.renderOfficialShows(show_day);
      } else {
        return this.renderUnofficialShows(show_day);
      }
    },

    renderUnofficialShows: function(day) {
      var artist_names = this.getArtistNames(),
          artist_pattern = this.getArtistRegexp(artist_names);
      $('#shows').html('');
      if (artist_names.length === 0) {
        return;
      }
      $.each(this.shows[Showlists.UNOFFICIAL][day], function(i, show){
        if (show.slice(show.indexOf('<li>'),show.length-1).search(artist_pattern) > -1) {
          $('#shows').append('<br />' + show);
        }
      });
      $('#shows').highlight(artist_names, { wordsOnly: true });
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

  new Showlist();

})(document, Handlebars, jQuery);
