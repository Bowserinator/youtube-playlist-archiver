import { downloadAll } from './src/download_all.js';
import signale from 'signale';

signale.pending('Manually running a download...');
downloadAll();
