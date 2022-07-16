import downloadAll from './src/download_all.js';
import { config } from './config.js';
import schedule from 'node-schedule';
import signale from 'signale';

schedule.scheduleJob(config.cronString, downloadAll);
signale.success('Started playlist archiver...');
signale.debug(`Cron string: ${config.cronString}`);
