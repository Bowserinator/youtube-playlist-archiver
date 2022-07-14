import ytpl from 'ytpl';
import signale from 'signale';
import Playlist from './playlist.js';
import { config } from '../config.js';


/**
 * Begin downloading all playlists in the config
 * Call this periodically
 */
async function downloadAll() {
    for (let playlistId of config.playlistIds) {
        const playlist = new Playlist(playlistId);
        let plData = await ytpl(playlistId, {
            limit: 1,
            requestOptions: { headers: { cookie: config.cookies } }
        });

        if (playlist.lastUpdated !== plData.lastUpdated) { // Changed
            signale.debug(`Downloading playlist ${playlistId} (${playlist.lastUpdated || '<None>'} -> ${plData.lastUpdated})`);
            plData = await ytpl(playlistId, {
                pages: 999999999999,
                requestOptions: { headers: { cookie: config.cookies } }
            });
            await playlist.update(plData);
            signale.complete(`Finished updating playlist ${playlistId}`);
        } else
            signale.debug(`Skipping playlist ${playlistId}, no update (${plData.lastUpdated})`);
    }
}

downloadAll();
