const yaml = require('js-yaml');
const fs = require('fs-extra');
const { basename, join } = require('path');
const postcss = require('../lib/postcss');
const hostFiles = require('../lib/host-files.js');

const sourceDirectory = process.env.SOURCE_DIRECTORY || './';
const buildDirectory = process.env.BUILD_DIRECTORY || './';
const buildName = process.env.BUILD_NAME || 'master';

(async () => {
    const css = {};
    const hosts = {};

    for (const { host: dir } of hostFiles(`${sourceDirectory}/hosts/*/`)) {
        console.log(`Processing ${dir}`);
        try {
            const key = basename(dir);

            css[key] = await postcss(join(dir, 'style.css'));

            yaml.safeLoad(await fs.readFile(join(dir, 'HOSTS.yaml'), 'utf8')).forEach(host => hosts[host] = key);
        } catch(e) {
            console.error(e);
        }
    }

    await fs.writeFile(`${buildDirectory}/${buildName}.json`, JSON.stringify({ css, hosts }, null, 4));
})();