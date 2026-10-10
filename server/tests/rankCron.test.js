import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../app.js';
import { rankCheckErrorMessage } from '../controllers/rankController.js';

async function withServer(callback) {
    const app = createServer();
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));

    try {
        const address = server.address();
        await callback(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
}

test('scheduled rank checks require the configured cron bearer secret', async () => {
    const previousSecret = process.env.CRON_SECRET;

    try {
        delete process.env.CRON_SECRET;
        await withServer(async (baseUrl) => {
            const unconfigured = await fetch(`${baseUrl}/api/cron/rank-checks`);
            assert.equal(unconfigured.status, 503);

            process.env.CRON_SECRET = 'test-only-cron-secret';
            const unauthorized = await fetch(`${baseUrl}/api/cron/rank-checks`, {
                headers: { Authorization: 'Bearer invalid-test-secret' },
            });
            assert.equal(unauthorized.status, 401);
        });
    } finally {
        if (previousSecret === undefined) delete process.env.CRON_SECRET;
        else process.env.CRON_SECRET = previousSecret;
    }
});

test('rank-check errors explain common Browserbase failures without exposing provider details', () => {
    assert.match(rankCheckErrorMessage(new Error('401 Unauthorized')), /Browserbase authentication failed/);
    assert.match(rankCheckErrorMessage(new Error('429 rate limit')), /rate limited this check/);
    assert.match(rankCheckErrorMessage(new Error('Function timed out')), /timed out before it finished/);
    assert.match(rankCheckErrorMessage(new Error('Google search results could not be resolved')), /result links could not be resolved/);
    assert.equal(
        rankCheckErrorMessage(new Error('Google blocked this check, try again later')),
        'Google blocked this check, try again later',
    );
});
