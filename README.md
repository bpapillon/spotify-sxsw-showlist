# Spotify SXSW Showlist

Use your Spotify playlists to find official and unofficial shows at SXSW. Updated for 2015.

# Installation and Setup

1. [Register a new Spotify application](https://developer.spotify.com/my-applications/)
2. Create a credentials.json file in settings/, using settings/credentials.example.json as a template, containing the client ID and secret from your new Spotify app.
3. Run `npm install` to install node dependencies
4. Start the node server via `node app.js`

# Yearly Maintenance

Every year, the SXSW_YEAR (current year) and SXSW_START_DAY (integer date in March of the first day, Tuesday, of SXSW) will need to be updated. Changes in the designs of schedule.sxsw.com or showlistaustin.com will also likely result a need to update the scraper code that pulls show data from those sites.

# Todo

1. Cache results from scrapers

