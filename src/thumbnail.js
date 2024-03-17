import gm from 'gm';
import fetch from 'node-fetch';

/**
 * Download an image and resize it to a JPG before saving
 * @param {string} url URL to download
 * @param {number} width Width to resize image to
 * @param {number} quality Quality of JPEG (0 - 100)
 * @param {string} dest Path to save to
 */
export default async function downloadAndResize(url, width, quality, dest) {
    if (width < 0)
        throw new Error(`Width must be > 0 (got ${width}px)`);
    quality = Math.max(0, Math.min(100, quality));

    let stream = await fetch(url);
    if (!stream.ok)
        throw new Error(`Error: ${stream.statusText}, url = ${url}`);
    gm(stream.body)
        .resize(width)
        .quality(quality)
        .write(dest, err => {
            if (err) console.error(err);
        });
}
