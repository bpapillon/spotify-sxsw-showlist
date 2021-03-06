# Spotify SXSW Showlist

Use your Spotify playlists to find official and unofficial shows at SXSW. This web app is adapted from the [desktop version](https://github.com/billboebel/spotify-showlist), the API for which was deprecated by Spotify. Updated for 2016.

# Installation and Setup

1. [Register a new Spotify application](https://developer.spotify.com/my-applications/)
2. Using .env.example as a template, store your newly-created client ID, client secret, and redirect URI in /.env.
3. Run `npm install` to install node dependencies
4. Install Foreman, if you don't have it already; there's a Gemfile containing that single requirement, so you can do this using `bundle install` if you are using bundler.
5. If you are using the redis cache, start `redis-server`; you can disable caching by setting `USE_CACHE` to false in config.json, in which case you do not need to run a redis server.
6. Start up your local build environment via `gulp`.
7. Start the node server via `foreman start`

# Yearly Maintenance

Every year, the SXSW\_START\_DAY (integer date in March of the first day, Tuesday, of SXSW) will need to be updated. Any changes to the designs of schedule.sxsw.com or showlistaustin.com would also necessitate changes to the scraper code that pulls show data from those sites.
