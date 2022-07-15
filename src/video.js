import signale from 'signale';
import path from 'path';
import fs from 'fs';

import { formatTimeSec, undoFormatTime } from './format.js';
import { config } from '../config.js';
import downloadAndResize from './thumbnail.js';

// Array indices to store each of these properties
const REMOVED = 0;
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
 * A youtube video metadata storage
 * @author Bowserinator
 */
export default class Video {
    /**
     * Construct a new video
     * @param {string} id Video id
     */
    constructor(id) {
        this.id = id;
        this.duration = '0:00';
        this.author = '<Unknown Author>';
        this.title = '<Unknown title>';
        this.description = '';
        this.likes = 0;
        this.views = 0;
        this.uploadDate = '<Unknown>';
        this.channelID = '';
        this.removed = 0;
        this.durationSec = 0; // Not saved but recomputed
    }

    /**
     * Load properties from a metadata string
     * @param {string} str Line containing video metadata
     */
    load(str) {
        let obj = JSON.parse(`[${str}]`);
        this.removed = obj[REMOVED];
        this.id = obj[ID];
        this.duration = obj[DURATION];
        this.author = obj[AUTHOR];
        this.title = obj[TITLE];
        this.description = obj[DESC] || this.description;
        this.likes = obj[LIKES] || this.likes;
        this.views = obj[VIEWS] || this.views;
        this.uploadDate = obj[UPLOAD_DATE] || this.uploadDate;
        this.channelID = obj[CHANNEL_ID] || this.channelID;
        this.durationSec = undoFormatTime(this.duration);
    }

    /**
     * Update metadata from ytdl.getInfo or playlist data
     * Also downloads thumbnails + channel thumbnails if enabled
     * @param {*} data Data from ytdl.getInfo or playlist items
     */
    async update(data) {
        const isFullData = data.videoDetails;
        if (isFullData)
            data = data.videoDetails;

        this.title = data.title;
        this.author = data.author.name;
        this.channelID = data.author.channelId || data.author.id;
        this.durationSec = isFullData ? +data.lengthSeconds : +data.durationSec;
        this.duration = formatTimeSec(this.durationSec);

        if (isFullData) {
            this.description = data.description;
            this.likes = data.likes;
            this.views = data.viewCount;
            this.uploadDate = data.uploadDate;

            if (Number.isNaN(this.likes))
                this.likes = 0;
            if (Number.isNaN(this.views))
                this.views = 0;
        }

        if (config.saveThumbnails) {
            // Download video thumbnail
            const thumb = data.thumbnails[0].url;

            if (!fs.existsSync(config.thumbDir)) {
                signale.pending({ prefix: '  ', message: `${config.thumbDir} doesn't exist, creating...` });
                fs.mkdirSync(path.join(config.thumbDir, 'videos'), { recursive: true });
                fs.mkdirSync(path.join(config.thumbDir, 'users'), { recursive: true });
            }

            if (thumb)
                downloadAndResize(thumb, config.thumbnails.width, config.thumbnails.quality,
                    path.join(config.thumbDir, 'videos', this.id + '.jpg'));

            // Download channel thumbnail
            if (isFullData) {
                const channelThumb = data.author.thumbnails[0].url;
                if (channelThumb)
                    downloadAndResize(channelThumb, config.channelProfile.width, config.channelProfile.quality,
                        path.join(config.thumbDir, 'users', this.channelID + '.jpg'));
            }
        }
    }

    /**
     * Convert metadata to a string to save
     * @return {string} Metadata str to save
     */
    toString() {
        let obj = [
            this.removed ? 1 : 0,
            this.id,
            this.duration,
            this.author,
            this.title,
            this.description,
            this.likes,
            this.views,
            this.uploadDate,
            this.channelID
        ].filter(x => x !== undefined);
        let r = JSON.stringify(obj);
        return r.substring(1, r.length - 1);
    }
}
