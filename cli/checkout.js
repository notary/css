const util = require('util');
const fs = require('fs-extra');
const spawn = util.promisify(require('child_process').spawn);

const [ checkoutDirectory = './checkout', pullRequest = 'master' ] = process.argv.slice(2);

async function wrapTryCatch(fn) {
    try {
        await fn();
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

async function exec(cmd, forceOutput) {
    process.stdout.write(`Executing ${cmd}...`);

    const { stdout, stderr, err } = await spawn(cmd, { stdio: 'inherit', shell: true });

    if (err) {
        process.stdout.write('failed\n');
        console.error(stderr);
        process.exit(1);
    } else {

        process.stdout.write('ok\n');
    }

    if (forceOutput) {
        console.log(stdout);
    }
}

async function updateRepository() {
    await exec(`cd ${checkoutDirectory} && git fetch --all`);
}

async function cloneRepository() {
    const remotes = `
        [remote "origin"]
        fetch = +refs/heads/*:refs/remotes/origin/*
        fetch = +refs/pull/*/head:refs/remotes/origin/pr/*
    `.trim();

    wrapTryCatch(async () => {
        await exec(`git clone https://github.com/turboext/css.git ${checkoutDirectory}`);
        await exec(`echo '${remotes}' >> ${checkoutDirectory}/.git/config`);
        await exec(`cd ${checkoutDirectory} && git fetch --all`);
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
    const exists = await fs.exists(checkoutDirectory);
    exists ? await updateRepository() : await cloneRepository();

    await checkoutPR(pullRequest);
})();
