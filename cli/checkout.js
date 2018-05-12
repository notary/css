const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawn;

const [ checkoutDirectory = path.resolve('./checkout'), pullRequest = 'master' ] = process.argv.slice(2);
const cwd = process.cwd();

 function wrapTryCatch(fn) {
    try {
        return await fn();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

function exec(cmd, opts = { cwd: checkoutDirectory }) {
    const { cwd } = opts;

    console.log(`${cwd} $ ${cmd}`);

    const ps = spawn(cmd, { stdio: 'inherit', shell: true, cwd });

    return new Promise((resolve, reject) => {
        ps.on('close', code => code === 0 ? resolve() : reject(code));
    });
}

async function updateRepository() {
    await exec('git fetch --all');
}

async function cloneRepository() {
    const remotes = `
        [remote "origin"]
        fetch = +refs/heads/*:refs/remotes/origin/*
        fetch = +refs/pull/*/head:refs/remotes/origin/pr/*
    `.trim();

    await wrapTryCatch(async () => {
        await exec(`git clone https://github.com/turboext/css.git ${checkoutDirectory}`, { cwd });
        await exec(`echo '${remotes}' >> .git/config`);
        await exec(`git fetch --all`);
    });
}

async function checkoutPR(pullRequest) {
    if (pullRequest === 'master') {
        exec('git checkout master && git pull --rebase');
    } else {
        exec(`git checkout pr/${pullRequest}`)
    }
}

(async () => {
    try {
        const exists = await fs.exists(checkoutDirectory);
        exists ? await updateRepository() : await cloneRepository();

        await checkoutPR(pullRequest);
    } catch(e) {
        console.log(e)
    }
})();
