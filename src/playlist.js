import nReadlines from 'n-readlines';
import signale from 'signale';
import ytdl from 'ytdl-core';
import path from 'path';
import fs from 'fs';

import Video from './video.js';
import { config } from '../config.js';
import { formatTimeSec } from './format.js';

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
        this.videoIDs = new Set();
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
        this.videoIDs = new Set();
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
                this.videoIDs.add(video.id);
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
        const file = path.join(config.dataDir, `${this.id}.data`);
        const data = this.dataToString() + '\n' + this.videos.map(video => video.toString()).join('\n');
        await fs.writeFile(file, data, err => {
            if (err)
                signale.fatal(err);
        });
    }

    /**
     * Update and save to file: Playlist data from youtube download
     * @param {*} data Data from y
     */
    async update(data) {
        this.videos = [];

        this.title = data.title;
        this.description = data.description;
        this.lastUpdated = data.lastUpdated;
        this.views = data.views;
        this.author = data.author.name;
        this.authorID = data.author.channelID;

        // Add playlist videos
        for (let vi of data.items) {
            let id = vi.id;

            let video = this.videoIDs.has(id) ? this.videoMap[id] : new Video(id);
            this.videos.push(video);
            video.removed = 0;

            // New video: sync data
            if (!this.videoIDs.has(id)) {
                video.update(vi);
                signale.debug({ prefix: '  ', message: `New video: id ${id}` });
                if (config.saveFancyMetadata)
                    video.update(await ytdl.getInfo(`https://www.youtube.com/watch?v=${id}`,
                        { requestOptions: { headers: { cookie: config.cookies } } }));
            } else
                signale.debug({ prefix: '  ', message: `Already have video id: ${id}, skipping...` });

            this.videoIDs.delete(id);
        }

        // Add removed videos
        this.deletedVideoCount = this.videoIDs.size;
        for (let id of this.videoIDs) {
            this.videoMap[id].removed = 1;
            this.videos.push(this.videoMap[id]);
        }

        this.videoCount = this.videos.length;
        this.duration = formatTimeSec(this.videos.reduce((a, b) => a.durationSec + b.durationSec));
        this.lastSync = Date.now();
        await this.save();
    }
}
