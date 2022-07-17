export const config = {
    // List of playlist ids to watch
    playlistIds: [
        'PLaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'PLbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
        // etc...
    ],

    // Save thumbnails of videos and pfps? Will be saved in the web dir
    // under a folder called /thumb, /thumb/videos and /thumb/users respectively
    saveThumbnails: true,

    // Video thumbnail settings
    thumbnails: {
        width: 100, // Width to resize (in px), preserves original aspect ratio
        quality: 90 // JPEG quality to save as (0 - 100)
    },

    // Channel pfp settings
    channelProfile: {
        width: 50, // Width to resize (in px), preserves original aspect ratio
        quality: 90 // JPEG quality to save as (0 - 100)
    },

    // Save additional metadata such as video description, views, duration, etc...
    // not accessible from the playlist. This will take a LOT longer as each video
    // needs to have its data requested individually
    saveFancyMetadata: true,

    // A cronstring indicating how often it should be run
    // Uses node-scheduler
    // https://crontab.cronhub.io/
    cronString: '0 4 * * *',

    // If using saveFancyMetadata, how many videos to attempt to request in "parallel"
    // (async). Youtube rate limits you harder anyways so this doesn't really have a big impact
    // (Recommended to keep small like <= 5)
    parallelVideos: 5,

    // Backup the data every N videos. Useful ONLY for very large unsynced playlists
    // on the first sync. If > 0, will overwrite the data folder. In the event of an error
    // getting data original data will be lost if this is > 0 and overwritten with partial data
    writeDataEveryNVideos: -1,

    // Your youtube cookies. Open a YT video -> Inspect element -> Network tab
    // Find a request that has the cookies header and copy paste the string here
    // It should start with VISITOR_INFO1_LIVE=...
    cookies: '<your cookie>',

    // Where to save raw metadata
    dataDir: './out/data',

    // Where to output HTML
    htmlDir: './out/',

    // Root path for your web directory
    // This is prepended to urls, ie "/mydir/playlists/" (should end with a /)
    // will make all hrefs be like href="/mydir/playlists/<other stuff>"
    webDir: ''
};
