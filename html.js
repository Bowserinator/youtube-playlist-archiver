import { createMainPlaylistPage } from './src/download_all.js';
import Playlist from './src/playlist.js';
import { config } from './config.js';
import signale from 'signale';

signale.pending('Manually generating HTML from data...');

let playlists = [];
for (let playlistId of config.playlistIds)
    try {
        const playlist = new Playlist(playlistId);
        playlist.writeHTML();
        playlists.push(playlist);
        signale.complete(`Finished writing HTML for playlist ${playlistId}`);
    } catch (e) {
        signale.fatal(e);
    }
createMainPlaylistPage(playlists);

