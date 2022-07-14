import ytpl from 'ytpl';
import Playlist from './playlist.js';
import { config } from '../config.js';

async function downloadAll() {
    for (let playlistId of config.playlistIds) {
        const playlist = new Playlist(playlistId);
        let plData = await ytpl(playlistId, { limit: 1 });
    
        if (playlist.lastUpdated !== plData.lastUpdated) { // Changed
            plData = await ytpl(playlistId, { pages: 999999999999 });
            playlist.update(plData);
        } else console.log('Ignore playlist')
    }
}

downloadAll();
