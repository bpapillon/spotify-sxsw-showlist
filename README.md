# Spotify SXSW Showlist

Use your Spotify playlists to find official and unofficial shows at SXSW. Updated for 2015.

# Installation and Setup

1. [Register a new Spotify application](https://developer.spotify.com/my-applications/)
2. Create a credentials.json file in settings/, using settings/credentials.example.json as a template, containing the client ID and secret from your new Spotify app.
3. Run `npm install` to install node dependencies
4. Start the node server via `node app.js`

# Yearly Maintenance

Every year, the SXSW_YEAR (current year) and SXSW_START_DAY (integer date in March of the first day, Tuesday, of SXSW) will need to be updated. Any changes to the designs of schedule.sxsw.com or showlistaustin.com would also necessitate changes to the scraper code that pulls show data from those sites.

# Todo

1. Cache results from scrapers
2. Implement the unofficial scraper (it's already written for the front-end, but needs to be ported over to the node side)
3. Layout/css
