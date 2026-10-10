import test from 'node:test';
import assert from 'node:assert/strict';
import { addAiRecommendations, auditDocument, auditWebsite, fetchPublicPage } from '../services/websiteAuditService.js';

test('auditDocument reports page facts and evidence-based technical issues', () => {
    const result = auditDocument({
        finalUrl: new URL('https://example.test/path'),
        html: `
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Useful SEO title with a suitable length</title>
                <meta name="description" content="A useful page description that clearly explains the content of this page for visitors and search engines.">
              </head>
              <body>
                <h1>Page heading</h1><h2>Section</h2>
                <p>${'Useful page content for search visitors. '.repeat(50)}</p>
                <a href="/about">About</a><a href="https://outside.test/">Outside</a>
                <img src="/image.png" alt="A sample image"><img src="/blank.png">
              </body>
            </html>`,
        pageSize: 2400,
        loadTime: 125,
        contentTypeCharset: 'utf-8',
    });

    assert.equal(result.url, 'https://example.test/path');
    assert.equal(result.metaData.title, 'Useful SEO title with a suitable length');
    assert.equal(result.headings.h1, 1);
    assert.equal(result.links.internal, 1);
    assert.equal(result.links.external, 1);
    assert.deepEqual(result.images, { total: 2, missingAlt: 1, withAlt: 1 });
    assert.equal(result.loadTime, 125);
    assert.equal(result.pageSize, 2400);
    assert.ok(result.wordCount > 300);
    for (const score of Object.values(result.categories)) {
        assert.ok(score >= 0 && score <= 100);
    }
    assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
    assert.ok(result.issues.some((issue) => issue.category === 'Accessibility'));
});

test('auditWebsite rejects private-network targets before making a request', async () => {
    await assert.rejects(auditWebsite('http://127.0.0.1:5000/api/health'), /public website hostname/);
});

test('website fetch config allows oversized headers from public sites', async () => {
    const priorFetch = globalThis.fetch;
    let requestOptions;
    globalThis.fetch = async (_url, options) => {
        requestOptions = options;
        return new Response('<html><head><title>Header size test</title></head><body>Content</body></html>', {
            status: 200,
            headers: {
                'content-type': 'text/html; charset=utf-8',
                'x-large-response-header': 'x'.repeat(26 * 1024),
            },
        });
    };

    try {
        const page = await fetchPublicPage(new URL('https://example.com/'));
        assert.ok(requestOptions.dispatcher);
        assert.match(page.html, /Header size test/);
        assert.ok(page.pageSize > 0);
    } finally {
        globalThis.fetch = priorFetch;
    }
});

test('AI recommendations use configured Gemini model and retain only valid issue shapes', async () => {
    const priorApiKey = process.env.AI_API_KEY;
    const priorBaseUrl = process.env.AI_BASE_URL;
    const priorModel = process.env.AI_MODEL;
    const priorFetch = globalThis.fetch;
    process.env.AI_API_KEY = 'test-only-key';
    process.env.AI_BASE_URL = 'https://ai.example.test/proxy/v1';
    process.env.AI_MODEL = 'google/gemini-test-model';
    let requestBody;
    globalThis.fetch = async (_url, options) => {
        requestBody = JSON.parse(options.body);
        return new Response(JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        summary: 'The scan found opportunities to improve image accessibility.',
                        issues: [
                            { severity: 'warning', category: 'Accessibility', message: 'One image is missing alt text.', recommendation: 'Add descriptive alt text.' },
                            { severity: 'info', category: 'Content', message: 'The page has no descriptive image captions.', recommendation: 'Add captions where they help explain visual content.' },
                            { severity: 'info', category: 'Content', message: 'The page has no descriptive image captions.', recommendation: 'Add captions where they help explain visual content.' },
                            { severity: 'invalid', category: 'Other', message: 'Ignore this one.', recommendation: 'Not an allowed severity.' },
                        ],
                    }),
                },
            }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    try {
        const audit = {
            url: 'https://example.test',
            categories: { seo: 80, performance: 70, accessibility: 60, bestPractices: 90 },
            loadTime: 300,
            pageSize: 1000,
            wordCount: 400,
            metaData: {},
            headings: {},
            links: {},
            images: {},
            issues: [{
                severity: 'warning',
                category: 'Accessibility',
                message: 'One image is missing alt text.',
                recommendation: 'Provide alternative text.',
            }],
        };
        const result = await addAiRecommendations(audit);
        assert.equal(requestBody.model, 'google/gemini-test-model');
        assert.equal(result.aiStatus, 'completed');
        assert.equal(result.aiSummary, 'The scan found opportunities to improve image accessibility.');
        assert.equal(result.measuredIssues.length, 1);
        assert.equal(result.aiIssues.length, 1);
        assert.equal(result.issues.length, 2);

        const repeated = await addAiRecommendations(result);
        assert.equal(repeated.aiStatus, 'completed');
        assert.equal(repeated.measuredIssues.length, 1);
        assert.equal(repeated.aiIssues.length, 1);
        assert.equal(repeated.issues.length, 2);
    } finally {
        globalThis.fetch = priorFetch;
        if (priorApiKey === undefined) delete process.env.AI_API_KEY;
        else process.env.AI_API_KEY = priorApiKey;
        if (priorBaseUrl === undefined) delete process.env.AI_BASE_URL;
        else process.env.AI_BASE_URL = priorBaseUrl;
        if (priorModel === undefined) delete process.env.AI_MODEL;
        else process.env.AI_MODEL = priorModel;
    }
});

test('failed AI retries preserve the last successful recommendations', async () => {
    const priorApiKey = process.env.AI_API_KEY;
    const priorFetch = globalThis.fetch;
    process.env.AI_API_KEY = 'test-only-key';
    globalThis.fetch = async () => new Response('provider unavailable', { status: 503 });

    try {
        const measuredIssues = [{
            severity: 'warning',
            category: 'Performance',
            message: 'The page is slow.',
            recommendation: 'Optimize page resources.',
        }];
        const aiIssues = [{
            severity: 'info',
            category: 'Content',
            message: 'The page has no descriptive image captions.',
            recommendation: 'Add captions where they help explain visual content.',
        }];
        const result = await addAiRecommendations({
            url: 'https://example.test',
            categories: {},
            measuredIssues,
            aiIssues,
            issues: [...measuredIssues, ...aiIssues],
        });

        assert.equal(result.aiStatus, 'failed');
        assert.deepEqual(result.measuredIssues, measuredIssues);
        assert.deepEqual(result.aiIssues, aiIssues);
        assert.deepEqual(result.issues, [...measuredIssues, ...aiIssues]);
    } finally {
        globalThis.fetch = priorFetch;
        if (priorApiKey === undefined) delete process.env.AI_API_KEY;
        else process.env.AI_API_KEY = priorApiKey;
    }
});
