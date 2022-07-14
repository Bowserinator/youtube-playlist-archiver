
// https://stackoverflow.com/a/29747837
const URL_REGEX = /(?![^<]*>|[^<>]*<\/)((https?:)\/\/[a-z0-9&#=.\/\-?_]+)/gi;
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




function setLeftFromData(json) {
    // Auto-link urls and hashtags in description
    let desc = json[DESC];
    desc = desc.replace(URL_REGEX, '<a href="$1">$1</a>');
    desc = desc.replace(HASH_REGEX, '<a href="https://www.youtube.com/hashtag/$1">#$1</a>');

    // TODO: thumbnail + channel img

    document.getElementById('video-duration').innerText = json[DURATION];
    document.getElementById('video-thumbnail').src = `thumb/videos/${json[ID]}.jpg`; // TODO
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
