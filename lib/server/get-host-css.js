const glob = require('glob');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs-extra');
const postcss = require('../postcss');

function devGetCss(origin) {
    const hosts = glob.sync('hosts/*/HOSTS.yaml').map(file => {
        try {
            return {
                hosts: yaml.safeLoad(fs.readFileSync(file, 'utf8')),
                style: path.resolve(path.join(path.dirname(file), 'style.css'))
            };
        } catch(e) {}
    }).filter(meta => {
        if (!meta) {
            return false;
        }

        return fs.existsSync(meta.style);
    });

    const host = hosts.find(host => host.hosts.includes(origin));

    if (!host) {
        return Promise.resolve('');
    }

    return postcss(host.style);
}

async function readBuildJsonByPR(pullRequestDir) {
    const PRFullPath = path.join('checkout', pullRequestDir, 'build.json');
    const isExists = await fs.exists(PRFullPath);

    if (!isExists) {
        return null;
    }

    return JSON.parse(await fs.readFile(PRFullPath, 'utf8'));
}

/**
 *
 * @param {string} origin
 * @return {Promise}
 */
module.exports = function getHostCSS({ ctx: { pullRequest } }, origin) {
    if (process.env.NODE_ENV === 'development') {
        return devGetCss(origin);
    }

    return readBuildJsonByPR(pullRequest).then(build => {
        const key = build.hosts[origin];
        return build.css[key];
    });
};
