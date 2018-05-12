const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawnSync;
const chalk = require('chalk');

const [ checkoutDirectory = path.resolve('./checkout'), pullRequest = 'master' ] = process.argv.slice(2);
const cwd = process.cwd();

function exec(cmd, cwd = checkoutDirectory) {
    console.log(`${cwd} $ ${cmd}`);
    return spawn(cmd, { stdio: 'inherit', shell: true, cwd });
}

function updateRepository() {
    return exec('git fetch --all');
}

function cloneRepository() {
    const remotes = `
        [remote "origin"]
        fetch = +refs/heads/*:refs/remotes/origin/*
        fetch = +refs/pull/*/head:refs/remotes/origin/pr/*
    `.trim();

    exec(`git clone https://github.com/turboext/css.git ${checkoutDirectory}`, cwd);
    exec(`echo '${remotes}' >> .git/config`);
    exec(`git fetch --all`);
}

function checkoutPR(pullRequest) {
    if (pullRequest === 'master') {
        exec('git checkout master && git pull --rebase');
    } else {
        exec(`git checkout pr/${pullRequest}`)
    }
}

const exists = fs.existsSync(checkoutDirectory);
exists ? updateRepository() : cloneRepository();

checkoutPR(pullRequest);
