# Spotify SXSW Showlist

Use your Spotify playlists to find official and unofficial shows at SXSW. This web app is adapted from the [desktop version](https://github.com/billboebel/spotify-showlist), the API for which has been deprecated by Spotify. Updated for 2015.

# Installation and Setup

1. [Register a new Spotify application](https://developer.spotify.com/my-applications/)
2. Using settings/credentials.example.json as a template, store your newly-created client ID, client secret, and redirect URI in settings/credentials.json.
3. Run `npm install` to install node dependencies
4. Start the node server via `node app.js`

# Yearly Maintenance

Every year, the SXSW_YEAR (current year) and SXSW_START_DAY (integer date in March of the first day, Tuesday, of SXSW) will need to be updated. Any changes to the designs of schedule.sxsw.com or showlistaustin.com would also necessitate changes to the scraper code that pulls show data from those sites.

# Todo

1. Cache results from scrapers
2. Layout/css
3. Credentials for production environment
