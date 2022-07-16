import ytpl from 'ytpl';
import signale from 'signale';
import fs from 'fs';
import path from 'path';

import Playlist from './playlist.js';
import { config } from '../config.js';


/**
 * Generate the index page of all playlists
 * @param {Array<Playlist>} playlists Array of playlists
 */
export function createMainPlaylistPage(playlists) {
    const HTML_TEMPLATE = fs.readFileSync('./templates/template_all_playlists.html', { encoding: 'utf8', flag: 'r' });
    fs.writeFile(path.join(config.htmlDir, 'index.html'),
        HTML_TEMPLATE
            .replace('%PLAYLIST_ITEMS%', playlists.map(p => p.toHTML()).join('\n'))
            .replace('%JS_DATA%', `const PLAYLISTS = [${
                playlists.map(p => `[${p.dataToString()}]`).join(',')
            }]`)
            .replace('%BASE%', config.webDir),
        err => {
            if (err) signale.fatal(err);
        });
}


/**
 * Begin downloading all playlists in the config
 * Call this periodically
 */
export async function downloadAll() {
    let playlists = [];
    for (let playlistId of config.playlistIds)
        try {
            const playlist = new Playlist(playlistId);
            playlists.push(playlist);
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
                playlist.writeHTML();
                signale.complete(`Finished updating playlist ${playlistId}`);
                createMainPlaylistPage(playlists);
            } else
                signale.debug(`Skipping playlist ${playlistId}, no update (${plData.lastUpdated})`);
        } catch (e) {
            signale.fatal(e);
        }
    createMainPlaylistPage(playlists);
}
