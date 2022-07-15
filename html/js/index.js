// VIDEOS array set by template

// https://stackoverflow.com/a/29747837
const URL_REGEX = /(?![^<]*>|[^<>]*<\/)((https?:)\/\/[a-z0-9&#=./\-?_]+)/gi;
const HASH_REGEX = /#([A-Za-z0-9_-]*)/gi;

// Array indices to store each of these properties
// Should match that of video.js in src/
const ID = 1;
const DURATION = 2;
const AUTHOR = 3;
const TITLE = 4;
const DESC = 5;
const LIKES = 6;
const VIEWS = 7;
const UPLOAD_DATE = 8;
const CHANNEL_ID = 9;


/**
 * Set the left side to display data about the current video
 * @param {*} json Array data of the current video
 */
function setLeftFromData(json) {
    // Auto-link urls and hashtags in description
    let desc = json[DESC] || '<i>No description provided</i>';
    desc = desc.replace(URL_REGEX, '<a href="$1">$1</a>');
    desc = desc.replace(HASH_REGEX, '<a href="https://www.youtube.com/hashtag/$1">#$1</a>');
    desc = desc.replaceAll('\n', '<br><br>');

    document.getElementById('video-duration').innerText = json[DURATION];
    document.getElementById('video-thumbnail').src = `thumb/videos/${json[ID]}.jpg`;
    document.getElementById('channel-img').src = `thumb/users/${json[CHANNEL_ID]}.jpg`;

    document.getElementById('video-title').innerText = json[TITLE];
    document.getElementById('video-link').href = `https://www.youtube.com/watch?v=${json[ID]}`;
    document.getElementById('channel-name').innerText = json[AUTHOR];
    document.getElementById('channel-name').href = json[CHANNEL_ID] ?
        `https://www.youtube.com/channel/${json[CHANNEL_ID]}` : '';
    document.getElementById('video-data').innerText =
        [
            `${json[VIEWS]} views`,
            json[UPLOAD_DATE],
            `${json[LIKES]} likes`
        ].join(' • ');
    document.getElementById('video-desc').innerHTML = desc;
}

// eslint-disable-next-line no-undef
setLeftFromData(VIDEOS[0]);


// Search:

/**
 * Get id from youtube url, https://stackoverflow.com/a/8260383
 * @param {string} url Youtube url
 * @return {string | boolean} ID
 */
function youtubeParser(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
}

const search = document.getElementById('search');
const MIN_SEARCH_DELAY = 200;
const playlistItems = [...document.getElementsByClassName('playlist-item')];

let lastInput = 0;
let callTimeout = null;

/**
 * Hide elements based on search query
 * If search query is blank then all elements are shown again
 */
function updateSearch() {
    let query = search.value.trim().toLowerCase();
    let id = youtubeParser(query);
    if (id) query = id;

    for (let i = 0; i < playlistItems.length; i++) {
        // eslint-disable-next-line no-undef
        const video = VIDEOS[i];
        if (query.length === 0 || video[ID].toLowerCase().includes(query) ||
            video[TITLE].toLowerCase().includes(query) ||
            video[AUTHOR].toLowerCase().includes(query))
            playlistItems[i].style.display = 'flex';
        else
            playlistItems[i].style.display = 'none';
    }
}

search.onkeyup =
search.onchange =
search.onblur = () => {
    if (Date.now() - lastInput < MIN_SEARCH_DELAY) {
        if (!callTimeout) {
            callTimeout = setTimeout(updateSearch, MIN_SEARCH_DELAY);
            lastInput = Date.now();
        }
    } else {
        if (callTimeout) clearTimeout(callTimeout);
        updateSearch();
        lastInput = Date.now();
    }
};
