'use strict';

const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const { mountSiwcConnectionApi } = require('@librechat/vx/dist/src/llm/siwcConnectionApi.js');

const router = express.Router();

function requireSameOrigin(req, res, next) {
  try {
    const origin = req.get('origin');
    if (!origin || new URL(origin).origin !== `${req.protocol}://${req.get('host')}`) {
      return res.status(403).json({ error: 'SIWC_CSRF_ORIGIN_REJECTED' });
    }
    return next();
  } catch {
    return res.status(403).json({ error: 'SIWC_CSRF_ORIGIN_REJECTED' });
  }
}

mountSiwcConnectionApi({
  router,
  service: (req) => req.app?.locals?.nostromoSiwcConnectionService ?? null,
  requireAuthenticatedUser: requireJwtAuth,
  verifyCsrf: requireSameOrigin,
});

module.exports = router;
