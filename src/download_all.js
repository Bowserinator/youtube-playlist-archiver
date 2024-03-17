import signale from 'signale';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import Playlist from './playlist.js';
import { config } from '../config.js';
import { formatDate } from './format.js';


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

            signale.debug(`Downloading playlist ${playlistId}`);

            const file = path.join(config.dataDir, 'json', `${playlistId}.json`);
            const dir = path.resolve(path.join(config.dataDir, 'json'));
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir);

            execSync(config.YT_CMD + `-J --flat-playlist --skip-download --no-warnings https://www.youtube.com/playlist\?list\=${playlistId} > ${file}`);
            let plData = JSON.parse(await fs.readFileSync(file, 'utf8'));
            plData = {
                title: plData.title,
                description: plData.description,
                lastUpdated: formatDate(plData.modified_date),
                views: plData.view_count,
                author: {
                    name: plData.uploader,
                    channelID: plData.uploader_id
                },
                items: plData.entries
                    .filter(d => d.title !== '[Deleted video]')
                    .map(d => ({
                        id: d.id,
                        title: d.title,
                        durationSec: d.duration,
                        author: {
                            name: d.channel,
                            channelId: d.channel_id,
                            id: d.author_id
                        },
                        thumbnails: d.thumbnails,
                        duration: d.duration
                    }))
            };

            await playlist.update(plData);

            await playlist.writeHTML();
            signale.complete(`Finished updating playlist ${playlistId}`);
            createMainPlaylistPage(playlists);
        } catch (e) {
            signale.fatal(e);
        }
    createMainPlaylistPage(playlists);
}
