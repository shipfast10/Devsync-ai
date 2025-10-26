const express = require('express');
const passport = require('passport');
const axios = require('axios');
const router = express.Router();
const { generateRepoSummary, callGemini } = require('../services/aiService');

// ---------------- GitHub OAuth Routes ----------------

// Step 1: Redirect to GitHub for authentication
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

// Step 2: GitHub redirects back to this URL after login
router.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.send(`Welcome, ${req.user.username}! GitHub login successful 🚀`);
  }
);

// Step 3: Fetch GitHub Repositories (requires authentication)
router.get('/auth/github/repos', async (req, res) => {
  try {
    const token = req.user?.accessToken;
    if (!token) return res.status(401).json({ message: 'User not authenticated' });

    const response = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${token}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching repos:', error.message);
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
});

// ---------------- AI Summary Route ----------------
router.get('/api/github/summary', async (req, res) => {
  try {
    if (!req.user || !req.user.accessToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = req.user.accessToken;

    // Step 1: Fetch user repositories
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${token}` },
    });
    const repos = reposResponse.data;

    // Step 2: For each repo, fetch last 5 commits & open issues count
    const repoDetails = await Promise.all(
      repos.map(async (repo) => {
        let commits = [];
        try {
          const commitsResponse = await axios.get(
            `https://api.github.com/repos/${repo.full_name}/commits?per_page=5`,
            { headers: { Authorization: `token ${token}` } }
          );
          commits = commitsResponse.data.map(c => ({
            message: c.commit.message,
            date: c.commit.author.date,
          }));
        } catch (err) {
          commits = [];
        }

        return {
          name: repo.name,
          full_name: repo.full_name,
          language: repo.language,
          commits,
          openIssues: repo.open_issues_count,
        };
      })
    );

    // Step 3: Send to AI summarizer
    const aiSummary = await generateRepoSummary(repoDetails);

    res.json({ summary: aiSummary, repoCount: repos.length, repoDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate AI summary' });
  }
});

// ---------------- Current User Info ----------------
router.get('/api/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

router.get('/test/gemini', async (req, res) => {
  try {
    const prompt = "Say hello to the DevSync AI developer!";
    const result = await callGemini(prompt);
    res.json({ message: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gemini test failed' });
  }
});

module.exports = router;
