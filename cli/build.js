const yaml = require('js-yaml');
const fs = require('fs-extra');
const { basename, join, resolve } = require('path');
const postcss = require('../lib/postcss');
const hostFiles = require('../lib/host-files.js');

const [ sources = resolve('./'), pullRequest = 'master' ] = process.argv.slice(2);

(async () => {
    const css = {};
    const hosts = {};
    console.log(`${resolve(sources)}/hosts/*/`);

    try {
        for (const { host: dir } of hostFiles(`${resolve(sources)}/hosts/*/`)) {
            console.log(`Processing ${dir}`);
            const key = basename(dir);

            css[key] = await postcss(join(dir, 'style.css'));

            yaml.safeLoad(await fs.readFile(join(dir, 'HOSTS.yaml'), 'utf8'))
                .forEach(host => hosts[host] = key);
        }

        const output = join(sources, `${pullRequest}.json`);
        fs.writeFileSync(output, JSON.stringify({ css, hosts }, null, 4));
        console.log(`Build was saved to ${output}`);
    } catch(e) {
        console.error(e)
    }
})();