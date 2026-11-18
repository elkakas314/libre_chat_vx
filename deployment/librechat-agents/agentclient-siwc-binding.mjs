#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { copyFileSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

export const PINNED_UPSTREAM = 'f10b1d91f1eee3a2c82d5247bf620351486b7c1b';
export const TARGET = 'api/server/services/Endpoints/agents/initialize.js';
export const BASE_SHA256 = '104e4c945a5e008e5ca476c033ed3115260c3c1e15aafa86eb04a9bcc2387522';
const MARKER = 'NOSTROMO_SIWC_AGENTCLIENT_INITIALIZATION_V1';

export function patchAgentClientSource(source) {
  if (source.includes(MARKER)) {
    if (!source.includes('createSiwcAgentClientRunAgent') ||
        !source.includes('resolveAgentClientRunBinding')) {
      throw new Error('SIWC_AGENTCLIENT_PATCH_PARTIAL');
    }
    return source;
  }
  const sourceHash = createHash('sha256').update(source).digest('hex');
  if (sourceHash !== BASE_SHA256) throw new Error('SIWC_AGENTCLIENT_SOURCE_MISMATCH');

  const importAnchor = "const { logger } = require('@librechat/data-schemas');";
  const primaryAgentAnchor = `    toolRoleGrantsPromise,
  ]);
  /** Preserve the owner-scoped fallback for loaders that share this request. */`;
  const initializedAgentAnchor = `  );

  /** Price emitted usage with the primary agent's resolved endpoint config`;
  if (source.split(importAnchor).length !== 2 || source.split(primaryAgentAnchor).length !== 2 ||
      source.split(initializedAgentAnchor).length !== 2) {
    throw new Error('SIWC_AGENTCLIENT_CONTEXT_MISMATCH');
  }
  const withImport = source.replace(importAnchor,
    `${importAnchor}\nconst { createSiwcAgentClientRunAgent } = require('@librechat/vx/dist/src/llm/siwcOpenAiFetch.js');`);
  const withPrimaryBinding = withImport.replace(primaryAgentAnchor, `    toolRoleGrantsPromise,
  ]);
  // ${MARKER}: choose a consented per-user SIWC provider before initializeAgent fixes the LLM.
  let siwcRunBinding;
  const siwcResolver = req.app?.locals?.nostromoSiwc?.resolveAgentClientRunBinding;
  if (typeof siwcResolver === 'function') {
    const authenticatedUserId = req.user?.id?.toString?.();
    if (!authenticatedUserId) throw new Error('SIWC_AUTHENTICATED_USER_REQUIRED');
    const resolved = await siwcResolver({
      authenticatedUserId,
      agentId: primaryAgent?.id?.toString?.(),
      agent: primaryAgent,
      conversationId,
      messages: runtimeRequestBody,
    });
    if (resolved != null) {
      if (!resolved.route || typeof resolved.fetch !== 'function') {
        throw new Error('SIWC_AGENTCLIENT_BINDING_INVALID');
      }
      Object.assign(primaryAgent, createSiwcAgentClientRunAgent(primaryAgent, resolved.route, resolved.fetch));
      endpointOption.model_parameters = {
        ...endpointOption.model_parameters,
        ...primaryAgent.model_parameters,
      };
      siwcRunBinding = resolved;
    }
  }
  /** Preserve the owner-scoped fallback for loaders that share this request. */`);
  return withPrimaryBinding.replace(initializedAgentAnchor, `  );

  if (siwcRunBinding) {
    const route = siwcRunBinding.route;
    primaryConfig.model_parameters = {
      ...primaryConfig.model_parameters,
      model: route.nativeModel,
      useResponsesApi: true,
      configuration: {
        ...(primaryConfig.model_parameters?.configuration ?? {}),
        fetch: siwcRunBinding.fetch,
      },
    };
  }

  /** Price emitted usage with the primary agent's resolved endpoint config`);
}

export function rollbackAgentClientSource(current, preimage) {
  if (createHash('sha256').update(preimage).digest('hex') !== BASE_SHA256 ||
      current !== patchAgentClientSource(preimage)) {
    throw new Error('SIWC_AGENTCLIENT_ROLLBACK_READBACK_MISMATCH');
  }
  return preimage;
}

function stage(upstreamRoot) {
  if (process.env.NOSTROMO_CI_EPHEMERAL_STAGE !== '1') {
    throw new Error('SIWC_AGENTCLIENT_STAGE_CI_ONLY');
  }
  const root = resolve(upstreamRoot);
  const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (head !== PINNED_UPSTREAM) throw new Error('SIWC_AGENTCLIENT_UPSTREAM_MISMATCH');
  const file = resolve(root, TARGET);
  const source = readFileSync(file, 'utf8');
  const updated = patchAgentClientSource(source);
  if (updated === source) {
    process.stdout.write('SIWC_AGENTCLIENT_ALREADY_STAGED\n');
    return;
  }
  const backup = `${file}.nostromo-siwc-preimage-${BASE_SHA256.slice(0, 12)}.bak`;
  copyFileSync(file, backup, { flag: 'wx' });
  const temporary = `${file}.nostromo-siwc-stage.tmp`;
  writeFileSync(temporary, updated, { mode: 0o644, flag: 'wx' });
  renameSync(temporary, file);
  if (createHash('sha256').update(readFileSync(backup)).digest('hex') !== BASE_SHA256 ||
      readFileSync(file, 'utf8') !== updated) {
    throw new Error('SIWC_AGENTCLIENT_READBACK_FAILED');
  }
  process.stdout.write('SIWC_AGENTCLIENT_CI_STAGE_PASS\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    if (process.argv[2] !== '--apply' || !process.argv[3]) {
      throw new Error('USAGE: agentclient-siwc-binding.mjs --apply <upstream-root>');
    }
    stage(process.argv[3]);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'SIWC_AGENTCLIENT_STAGE_FAILED'}\n`);
    process.exitCode = 2;
  }
}
