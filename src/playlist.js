import nReadlines from 'n-readlines';
import signale from 'signale';
import ytdl from 'ytdl-core';
import path from 'path';
import fs from 'fs';

import Video from './video.js';
import { config } from '../config.js';
import { formatTimeSec } from './format.js';

const HTML_TEMPLATE = fs.readFileSync('./templates/template_playlist.html', { encoding: 'utf8', flag: 'r' });

// Array indices for data storage, must match array below
const ID = 0;
const TITLE = 1;
const DESC = 2;
const LAST_UPDATED = 3;
const VIEWS = 4;
const AUTHOR = 5;
const AUTHOR_ID = 6;
const VIDEO_COUNT = 7;
const DELETED_VIDEOS = 8;
const DURATION = 9;
const LAST_SYNC = 10;


/**
 * A playlist class where data can be read
 * and accessed
 * @author Bowserinator
 */
export default class Playlist {
    /**
     * Construct a new playlist
     * @param {string} id Playlist id
     */
    constructor(id) {
        this.id = id;
        this.title = '<Unknown title>';
        this.description = '<Unknown description>';
        this.lastUpdated = '';
        this.views = '<Unknown> views';
        this.author = '<Unknown>';
        this.authorID = '';
        this.videoCount = 0;

        this.videos = [];
        this.videoIDs = {};
        this.videoMap = {};
        this.deletedVideoCount = 0;
        this.duration = '0:00';
        this.lastSync = 0;
        this.load();
    }

    /**
     * Load contents from data file, or create if not already
     * Creates dataDir if it doesn't exist. Data file determined
     * from id
     */
    load() {
        this.videos = [];
        this.videoIDs = {};
        this.videoMap = {};

        if (!fs.existsSync(config.dataDir)) {
            signale.pending({ prefix: '  ', message: `${config.dataDir} doesn't exist, creating...` });
            fs.mkdirSync(config.dataDir, { recursive: true });
        }

        // File to load playlist data from
        const file = path.join(config.dataDir, `${this.id}.data`);
        if (!fs.existsSync(file))
            return;

        // Begin loading
        // eslint-disable-next-line new-cap
        const data = new nReadlines(file);
        let line;
        let lineNumber = 0;

        while (line = data.next()) {
            if (lineNumber === 0)
                this.dataFromString(line.toString());
            else {
                let video = new Video('');
                video.load(line.toString());

                if (!this.videoIDs[video.id])
                    this.videoIDs[video.id] = 0;
                this.videoIDs[video.id]++;

                this.videoMap[video.id] = video;
                this.videos.push(video);
            }
            lineNumber++;
        }
    }

    /**
     * Convert this metadata to a saveable string
     * @return {string} Playlist metadata to save
     */
    dataToString() {
        // Match ids above
        let r = JSON.stringify([
            this.id,
            this.title,
            this.description,
            this.lastUpdated,
            this.views,
            this.author,
            this.authorID,
            this.videoCount,
            this.deletedVideoCount,
            this.duration,
            this.lastSync
        ]);
        return r.substring(1, r.length - 1);
    }

    /**
     * Load playlist metadata from first line of save data
     * @param {string} str Metadata line
     */
    dataFromString(str) {
        let r = JSON.parse(`[${str}]`);
        this.id = r[ID];
        this.title = r[TITLE];
        this.description = r[DESC];
        this.lastUpdated = r[LAST_UPDATED];
        this.views = r[VIEWS];
        this.author = r[AUTHOR];
        this.authorID = r[AUTHOR_ID];
        this.videoCount = r[VIDEO_COUNT];
        this.deletedVideoCount = r[DELETED_VIDEOS];
        this.duration = r[DURATION];
        this.lastSync = r[LAST_SYNC];
    }

    /**
     * Dump all metadata and video metadata to the
     * save file for this playlist
     */
    async save() {
        this.videoCount = this.videos.length;
        this.duration = formatTimeSec(this.videos.map(v => v.durationSec).reduce((a, b) => a + b));
        this.lastSync = Date.now();

        const file = path.join(config.dataDir, `${this.id}.data`);
        const data = this.dataToString() + '\n' + this.videos.map(video => video.toString()).join('\n');
        fs.writeFileSync(file, data, err => {
            if (err)
                signale.fatal(err);
        });
    }

    /**
     * Update and save to file: Playlist data from youtube download
     * @param {*} data Data from ytpl
     */
    async update(data) {
        let originalVideos = [...this.videos];
        this.videos = [];

        this.title = data.title;
        this.description = data.description || 'No Description';
        this.lastUpdated = data.lastUpdated;
        this.views = data.views;
        this.author = data.author.name;
        this.authorID = data.author.channelID;

        signale.debug({ prefix: '  ', message: `Playlist name: ${this.title}` });

        // Add playlist videos
        let i = 1;
        let timeLast = Date.now();

        try {
            for (let vi of data.items) {
                let id = vi.id;

                let video = this.videoIDs[id] > 0 ? this.videoMap[id] : new Video(id);
                video.removed = 0;

                // New video: sync data
                if (!this.videoIDs[id] > 0) {
                    await video.update(vi);

                    try {
                        if (config.saveFancyMetadata)
                            await video.update(await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${id}`,
                                { requestOptions: { headers: { cookie: config.cookies } } }));

                        let timeElapsed = ((Date.now() - timeLast) / 1000).toFixed(3);
                        signale.debug({ prefix: '  ', message: `New video: id ${id} (${i} / ${data.items.length}, ${timeElapsed}s)` });
                    } catch (e) {
                        signale.fatal('Failed to download video ' + id);
                        signale.fatal(e);
                        video.removed = 1;
                        continue;
                    }
                }

                this.videos.push(video);

                // Write data periodically
                if (config.writeDataEveryNVideos > 0 && i % config.writeDataEveryNVideos === 0)
                    await this.save();
                i++;
                timeLast = Date.now();
                if (this.videoIDs[id] > 0)
                    this.videoIDs[id]--;
            }
        } catch (e) {
            signale.fatal(e);

            // Put back original video array
            // only if not saving backup
            if (config.writeDataEveryNVideos <= 0) {
                this.videos = originalVideos;
                await this.save();
                this.load();
            }
            return;
        }

        // Add removed videos
        this.deletedVideoCount = Object.keys(this.videoIDs).filter(k => this.videoIDs[k] > 0).length;
        for (let id of Object.keys(this.videoIDs)) {
            if (this.videoIDs[id] <= 0)
                continue;
            this.videoMap[id].removed = 1;
            this.videos.unshift(this.videoMap[id]);
        }

        await this.save();
    }

    /**
     * Write the HTML file for this playlists contents
     */
    writeHTML() {
        /*
        Variables:
        %PLAYLIST_NAME%        - string
        %PLAYLIST_DESCRIPTION% - string
        %VIDEO_COUNT%          - number
        %VIEW_COUNT            - number
        %LAST_UPDATED%         - string
        %DURATION%             - formatted string
        %SYNC_DATE%            - formatted string
        %PLAYLIST_CREATOR%     - string
        %PLAYLIST_ITEMS%       - HTML string
        %JS_STUFF%             - JS string for video data + config
        */
        let html = HTML_TEMPLATE;
        html = html
            .replaceAll('%PLAYLIST_NAME%', this.title)
            .replaceAll('%BASE%', config.webDir)
            .replaceAll('%PLAYLIST_DESCRIPTION%', this.description)
            .replaceAll('%VIDEO_COUNT%', this.videoCount.toLocaleString('en-US'))
            .replaceAll('%VIEW_COUNT%', (+this.views).toLocaleString('en-US'))
            .replaceAll('%LAST_UPDATED%', this.lastUpdated)
            .replaceAll('%DURATION%', this.duration)
            .replaceAll('%SYNC_DATE%', new Date(this.lastSync).toLocaleString())
            .replaceAll('%PLAYLIST_CREATOR%', this.author)
            .replaceAll('%JS_STUFF%', `const VIDEOS = [${this.videos.map(v => `[${v.toString()}]`).join(',')}];`)
            .replaceAll('%PLAYLIST_ITEMS%', this.videos.map((v, i) => v.toHTML(i)).join('\n'));

        fs.writeFile(path.join(config.htmlDir, this.id + '.html'), html, err => {
            if (err) signale.fatal(err);
        });
    }

    /**
     * Convert to an HTML string for the main playlists page
     * @return {string} HTML
     */
    toHTML() {
        return `
        <a class="playlist-a" href="${path.join(config.webDir, this.id + '.html')}">
            <div class="playlist-item">
                <div class="duration-wrapper">
                    <img src="${path.join(config.webDir, 'thumb', 'videos', this.videos[0].id + '.jpg') }" class="thumbnail">
                    <span class="duration">${this.duration}</span>
                </div>
                <div class="text">
                    <h3>${this.title}</h3>
                    <small class="muted">${this.author} • ${this.lastUpdated} • ${this.deletedVideoCount} deleted videos</small>
                </div>
            </div>
        </a>`;
    }
}
