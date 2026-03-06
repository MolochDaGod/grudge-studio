/**
 * GitHub Routes - Grudge Studio API
 * Manages GrudgeDaDev repos via the gruda-projects GitHub App
 */

import { Router } from 'express';
import * as gh from '../lib/github-app.js';

const router = Router();

/**
 * GET /github/status - GitHub App connection status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await gh.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check GitHub status', message: err.message });
  }
});

/**
 * GET /github/repos - List GrudgeDaDev repositories
 */
router.get('/repos', async (req, res) => {
  try {
    const { page = 1, per_page = 30, sort = 'updated' } = req.query;
    const repos = await gh.listRepos({ page: +page, perPage: +per_page, sort });
    res.json({
      count: repos.length,
      repos: repos.map(r => ({
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        language: r.language,
        url: r.html_url,
        private: r.private,
        updatedAt: r.updated_at,
        stars: r.stargazers_count,
        defaultBranch: r.default_branch,
        topics: r.topics
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list repos', message: err.message });
  }
});

/**
 * GET /github/repos/:repo - Get repo details
 */
router.get('/repos/:repo', async (req, res) => {
  try {
    const repo = await gh.getRepo(req.params.repo);
    res.json({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      url: repo.html_url,
      private: repo.private,
      updatedAt: repo.updated_at,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      defaultBranch: repo.default_branch,
      topics: repo.topics,
      size: repo.size,
      createdAt: repo.created_at
    });
  } catch (err) {
    res.status(err.message.includes('404') ? 404 : 500).json({
      error: 'Failed to get repo', message: err.message
    });
  }
});

/**
 * GET /github/repos/:repo/contents - Browse repo files
 */
router.get('/repos/:repo/contents', async (req, res) => {
  try {
    const { path = '', ref = 'main' } = req.query;
    const contents = await gh.getRepoContents(req.params.repo, path, ref);
    res.json(Array.isArray(contents)
      ? contents.map(f => ({ name: f.name, type: f.type, path: f.path, size: f.size }))
      : { name: contents.name, type: contents.type, content: contents.content, encoding: contents.encoding }
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to get contents', message: err.message });
  }
});

/**
 * GET /github/repos/:repo/issues - List repo issues
 */
router.get('/repos/:repo/issues', async (req, res) => {
  try {
    const { state = 'open', page = 1, per_page = 20 } = req.query;
    const issues = await gh.listIssues(req.params.repo, { state, page: +page, perPage: +per_page });
    res.json({
      count: issues.length,
      issues: issues.map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        labels: i.labels.map(l => l.name),
        author: i.user?.login,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        url: i.html_url
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list issues', message: err.message });
  }
});

/**
 * POST /github/repos/:repo/issues - Create an issue
 */
router.post('/repos/:repo/issues', async (req, res) => {
  try {
    const { title, body, labels } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const issue = await gh.createIssue(req.params.repo, title, body, labels);
    res.status(201).json({
      number: issue.number,
      title: issue.title,
      url: issue.html_url
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create issue', message: err.message });
  }
});

/**
 * POST /github/repos/:repo/deploy - Trigger a workflow dispatch
 */
router.post('/repos/:repo/deploy', async (req, res) => {
  try {
    const { workflow = 'deploy.yml', ref = 'main', inputs = {} } = req.body;
    await gh.triggerWorkflow(req.params.repo, workflow, ref, inputs);
    res.json({ success: true, message: `Workflow ${workflow} triggered on ${ref}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger deploy', message: err.message });
  }
});

/**
 * GET /github/repos/:repo/runs - List recent workflow runs
 */
router.get('/repos/:repo/runs', async (req, res) => {
  try {
    const { page = 1, per_page = 10 } = req.query;
    const data = await gh.listWorkflowRuns(req.params.repo, { page: +page, perPage: +per_page });
    res.json({
      totalCount: data.total_count,
      runs: (data.workflow_runs || []).map(r => ({
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        branch: r.head_branch,
        createdAt: r.created_at,
        url: r.html_url
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list runs', message: err.message });
  }
});

export default router;
