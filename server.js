const express = require('express');
const app = module.exports = express();
const rp = require('request-promise');
const cheerio = require('cheerio');
const { URL } = require('url');
const chalk = require('chalk');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const getHostCSS = require('./lib/server/get-host-css');

app.get('/', (req, res) => {
    require('fs').createReadStream('public/index.html').pipe(res);
});

/**
 *
 * @param url
 * @returns {string}
 */
function getHostname(url) {
    try {
        return new URL(url).origin;
    } catch(e) {
        return '';
    }
}

function normalize(str) {
    try {
        const url = new URL(str);
        if (url.hostname === 'yandex.ru') {
            return url.searchParams.get('text') || '';
        } else {
            return url;
        }
    } catch(e) {
        return '';
    }
}

function getTurbo(req, query) {
    const headers = { ...req.headers };
    delete headers.host;

    return rp({
        uri: query ? `https://yandex.ru/turbo?text=${query}` : 'https://yandex.ru/turbo',
        headers,
        gzip: true
    });
}

app.use((req, res, next) => {
    const query = req.query.text;

    req.ctx = {
        pullRequest: 'pull-8',
        query: normalize(req.query.text),
        hostname: getHostname(query)
    };

    next();
});

app.get('/turbo', (req, res, next) => {
    const {
        query,
        hostname
    } = req.ctx;

    if (!hostname) {
        return getTurbo(req, query).then(html => res.send(html)).catch(e => next(e));
    }

    Promise.all([getTurbo(req, query), getHostCSS(req, hostname)]).then(([html, style]) => {
        res.status(200);

        const $ = cheerio.load(html);

        $('meta[http-equiv=Content-Security-Policy]').remove();
        $(`<style>${style}</style>`).insertAfter($('style').last());

        res.send($.html());
    }).catch(e => next(e));
});

app.use((err, req, res) => {
    res.status(500);
    res.end(err);
});

app.listen(3000, () => {
    console.log(`DevServer started at ${chalk.blue.underline('http://localhost:3000')}`);
});
