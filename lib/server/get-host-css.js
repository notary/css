const glob = require('glob');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

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

/**
 *
 * @param {string} origin
 * @return {Promise}
 */
module.exports = function getHostCSS(origin) {
    if (process.env.NODE_ENV === 'development') {
        return devGetCss(origin);
    } else {
        const preloadedCSS = {
            pr6: {},
            master: {
                "css": {
                    "rozhdestvenskiy.ru": ".cover__title{font-weight:400}.page__cover+.page__markup{margin-top:10px}.page__unit+.page__footer{margin-top:20px}.page__source{display:none}.footer{background:#fafafa}.footer__about{padding-top:16px;padding-bottom:16px}.footer_theme_dark .footer__link.link{color:#777}.footer_view_default{padding-bottom:0}",
                    "test.skolznev.ru": ".page{background:#fff6f1}"
                },
                "hosts": {
                    "https://www.rozhdestvenskiy.ru": "rozhdestvenskiy.ru",
                    "https://rozhdestvenskiy.ru": "rozhdestvenskiy.ru",
                    "http://test.skolznev.ru": "test.skolznev.ru"
                }
            }
        };
        const current = preloadedCSS.pr6;
        const key = current.hosts[origin];

        return current.css[key];
    }
}
