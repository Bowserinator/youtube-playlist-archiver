// Array indices for data storage, must match playlist.js
const ID = 0;
const TITLE = 1;
const AUTHOR = 5;

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

    for (let i = 0; i < playlistItems.length; i++) {
        // eslint-disable-next-line no-undef
        const playlist = PLAYLISTS[i];
        if (query.length === 0 || playlist[ID].toLowerCase().includes(query) ||
            playlist[TITLE].toLowerCase().includes(query) ||
            playlist[AUTHOR].toLowerCase().includes(query))
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
