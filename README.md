# Youtube Playlist Archiver

## About

You know how you have a playlist of your favorite videos, then one gets removed or deleted or privatized and you can never know what it was? This saves relevant metadata from your (public/unlisted) playlists periodically so you can always know what a video was!

*Note: if a video is not available in your geographic region, it may be marked as "deleted"*

## Install

### Prerequisites

- **Node v16**
- **yt-dlp** (Will be run with `execSync`)
- **A webserver** to host the static output
- **graphicsmagick** (See instructions at https://www.npmjs.com/package/gm
     For linux it's `sudo apt-get install -y graphicsmagick`

### Install Dependencies

```
git clone https://github.com/Bowserinator/youtube-playlist-archiver
cd youtube-playlist-archiver
npm install
npm run scss
```

~~*Note: this uses a custom fork of ytpl to fix a bug where playlist titles and descriptions were not resolved. Once the original maintainer fixes it the dependencies will be updated*~~

Uses `yt-dlp` now because `ytpl` is not maintained anymore.

Next, copy everything in `/html` to your html output folder.

### Make a Config

Put a `config.js` at the top level, see `config.example.js` for an example config. Also put a `cookies.txt`
at the top level or edit the config `YT_CMD`.

You can dump cookies with this command: `yt-dlp --cookies-from-browser firefox --cookies cookies`

## Usage

```
node index.js
```

**Manually start download:**

```
node download.js
```

**Manually generate HTML:**

```
node html.js
```
