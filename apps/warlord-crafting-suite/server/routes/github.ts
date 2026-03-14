/**
 * GitHub Routes - Grudge Studio
 * Manages MolochDaGod repos via the gruda-projects GitHub App
 * Ported from apps/api-server/routes/github.js
 */

import { Router } from 'express';
import * as gh from '../lib/githubApp';

const router = Router();

/** GET /api/github/status — GitHub App connection status */
router.get('/status', async (_req, res) => {
  try {
    const status = await gh.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check GitHub status', message: err.message });
  }
});

/** GET /api/github/repos — List repositories */
router.get('/repos', async (req, res) => {
  try {
    const { page = 1, per_page = 30, sort = 'updated' } = req.query;
    const repos = await gh.listRepos({ page: +(page as string), perPage: +(per_page as string), sort: sort as string });
    res.json({
      count: repos.length,
      repos: repos.map((r: any) => ({
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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list repos', message: err.message });
  }
});

/** GET /api/github/repos/:repo — Repo details */
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
  } catch (err: any) {
    res.status(err.message.includes('404') ? 404 : 500).json({
      error: 'Failed to get repo', message: err.message
    });
  }
});

/** GET /api/github/repos/:repo/contents — Browse repo files */
router.get('/repos/:repo/contents', async (req, res) => {
  try {
    const { path = '', ref = 'main' } = req.query;
    const contents = await gh.getRepoContents(req.params.repo, path as string, ref as string);
    res.json(Array.isArray(contents)
      ? contents.map((f: any) => ({ name: f.name, type: f.type, path: f.path, size: f.size }))
      : { name: contents.name, type: contents.type, content: contents.content, encoding: contents.encoding }
    );
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get contents', message: err.message });
  }
});

/** GET /api/github/repos/:repo/issues — List issues */
router.get('/repos/:repo/issues', async (req, res) => {
  try {
    const { state = 'open', page = 1, per_page = 20 } = req.query;
    const issues = await gh.listIssues(req.params.repo, { state: state as string, page: +(page as string), perPage: +(per_page as string) });
    res.json({
      count: issues.length,
      issues: issues.map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        labels: i.labels.map((l: any) => l.name),
        author: i.user?.login,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        url: i.html_url
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list issues', message: err.message });
  }
});

/** POST /api/github/repos/:repo/issues — Create issue */
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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create issue', message: err.message });
  }
});

/** POST /api/github/repos/:repo/deploy — Trigger workflow dispatch */
router.post('/repos/:repo/deploy', async (req, res) => {
  try {
    const { workflow = 'deploy.yml', ref = 'main', inputs = {} } = req.body;
    await gh.triggerWorkflow(req.params.repo, workflow, ref, inputs);
    res.json({ success: true, message: `Workflow ${workflow} triggered on ${ref}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to trigger deploy', message: err.message });
  }
});

/** GET /api/github/repos/:repo/runs — List workflow runs */
router.get('/repos/:repo/runs', async (req, res) => {
  try {
    const { page = 1, per_page = 10 } = req.query;
    const data = await gh.listWorkflowRuns(req.params.repo, { page: +(page as string), perPage: +(per_page as string) });
    res.json({
      totalCount: data.total_count,
      runs: (data.workflow_runs || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        branch: r.head_branch,
        createdAt: r.created_at,
        url: r.html_url
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list runs', message: err.message });
  }
});

export default router;
