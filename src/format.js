/**
 * Format a time in seconds to HH:MM:SS
 * @param {number} sec Time in seconds
 * @return {string} HH:MM:SS or MM:SS (if hour is 0)
 */
export function formatTimeSec(sec) {
    sec = sec || 0;
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor((sec - (hours * 3600)) / 60);
    let seconds = sec - (hours * 3600) - (minutes * 60);

    if (hours < 10) hours = '0' + hours;
    if (minutes < 10) minutes = '0' + minutes;
    if (seconds < 10) seconds = '0' + seconds;
    let r = minutes + ':' + seconds;
    if (hours > 0)
        r = hours + ':' + r;
    return r;
}

/**
 * Inverse function of formatTimeSec
 * @param {string} formattedTime Output of formatTimeSec
 * @return {number} Time in seconds
 */
export function undoFormatTime(formattedTime) {
    let segments = formattedTime.split(':').map(x => +x).reverse();
    return segments.map((x, i) => x * Math.pow(60, i)).reduce((a, b) => a + b);
}
