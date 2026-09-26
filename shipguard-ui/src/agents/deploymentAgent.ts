/**
 * Deployment Agent
 *
 * Responsibility: Inspect Dockerfile, .dockerignore, CMD/start alignment,
 * and Node version consistency from the deployment side.
 * Maps to: REQ-03 (deployment environment Node version).
 */

import type { Finding, Fix } from '../types';
import { makeEmitter, makeFinding, nextId, sleep } from './agentRunner';
import { foodnestSnapshot, getFile } from '../data/foodnestSnapshot';

export interface DeploymentAgentResult {
  findings: Finding[];
  fixes: Fix[];
}

export async function runDeploymentAgent(): Promise<DeploymentAgentResult> {
  const emit = makeEmitter('DeploymentAgent');
  const findings: Finding[] = [];
  const fixes: Fix[] = [];

  emit('DeploymentAgent starting — scanning Dockerfile and deployment configuration');
  await sleep(250);

  const dockerfile = getFile('Dockerfile');
  const packageJson = getFile('package.json');

  if (!dockerfile) {
    emit('WARNING — Dockerfile not found in project root', 'warn');
    findings.push(
      makeFinding({
        id: nextId('DEPLOY'),
        reqIds: ['REQ-03'],
        agents: ['DeploymentAgent'],
        severity: 'WARNING',
        title: 'No Dockerfile found',
        explanation: 'No Dockerfile was found. The deployment environment cannot be verified.',
        affectedFile: 'Dockerfile',
        evidence: 'File not present.',
        recommendedFix: 'Add a Dockerfile that specifies the correct Node.js version.',
      })
    );
    return { findings, fixes };
  }

  // ── Node version in Dockerfile vs package.json ───────────────────────────
  const fromMatch = dockerfile.content.match(/^FROM node:([0-9]+)/m);
  const dockerNode = fromMatch ? fromMatch[1] : null;
  emit(`Dockerfile base image: node:${dockerNode ?? 'unknown'}`);
  await sleep(150);

  let packageNode: string | null = null;
  if (packageJson) {
    const m = packageJson.content.match(/"node":\s*">=(\d+)"/);
    packageNode = m ? m[1] : null;
  }
  emit(`package.json engines.node requirement: >=${packageNode ?? 'unknown'}`);
  await sleep(150);

  if (dockerNode && packageNode && dockerNode !== packageNode) {
    const findingId = nextId('DEPLOY');
    // Note: DependencyAgent also flags this. We record it — Main Release Agent deduplicates.
    emit(
      `BLOCKER — Dockerfile uses Node ${dockerNode} but package.json requires >=${packageNode}`,
      'error'
    );

    findings.push(
      makeFinding({
        id: findingId,
        reqIds: ['REQ-03'],
        agents: ['DeploymentAgent'],
        severity: 'BLOCKER',
        title: `Dockerfile Node version (${dockerNode}) does not satisfy package.json engines.node (>=${packageNode})`,
        explanation:
          `FROM node:${dockerNode}-alpine specifies Node ${dockerNode}. ` +
          `package.json engines.node is ">=20". ` +
          `The container runtime will not satisfy the declared engine requirement, ` +
          `which may cause startup warnings or runtime incompatibilities with ESM features.`,
        affectedFile: 'Dockerfile',
        evidence: `Dockerfile: FROM node:${dockerNode}-alpine\npackage.json: "node": ">=${packageNode}"`,
        recommendedFix: `Update Dockerfile to "FROM node:${packageNode}-alpine".`,
      })
    );
  }
  await sleep(150);

  // ── COPY . . without .dockerignore check ────────────────────────────────
  emit('Checking for .dockerignore');
  await sleep(150);

  const hasCopyAll = dockerfile.content.includes('COPY . .');
  const hasDockerignore = foodnestSnapshot.files.some((f) => f.path === '.dockerignore');

  if (hasCopyAll && !hasDockerignore) {
    const findingId = nextId('DEPLOY');
    emit('WARNING — COPY . . used without a .dockerignore file', 'warn');

    findings.push(
      makeFinding({
        id: findingId,
        reqIds: [],
        agents: ['DeploymentAgent'],
        severity: 'WARNING',
        title: 'COPY . . in Dockerfile without .dockerignore',
        explanation:
          'The Dockerfile uses "COPY . ." without a .dockerignore file. ' +
          'This may copy node_modules (bloating the image), .env files (leaking secrets), ' +
          'or development artifacts into the production container.',
        affectedFile: 'Dockerfile',
        evidence: 'COPY . .\n(no .dockerignore present in project root)',
        recommendedFix:
          'Add a .dockerignore file excluding node_modules, .env, .env.*, dist, and coverage directories.',
      })
    );
  }
  await sleep(150);

  // ── CMD vs package.json scripts.start alignment ─────────────────────────
  emit('Verifying CMD matches package.json scripts.start');
  await sleep(100);

  const cmdMatch = dockerfile.content.match(/^CMD\s+\[([^\]]+)\]/m);
  const cmdValue = cmdMatch ? cmdMatch[1].replace(/["'\s]/g, '') : null;
  // CMD ["npm", "start"] → "npm,start"
  const cmdNormalized = cmdValue?.replace(',', ' ');

  let startScript: string | null = null;
  if (packageJson) {
    const m = packageJson.content.match(/"start":\s*"([^"]+)"/);
    startScript = m ? m[1] : null;
  }

  emit(`Dockerfile CMD: ${cmdNormalized ?? 'not found'}`);
  emit(`package.json start: ${startScript ?? 'not found'}`);

  if (cmdNormalized && cmdNormalized !== 'npm start') {
    emit('INFO — CMD does not use npm start; verify it matches the intended start command', 'warn');
  } else {
    emit('CMD matches npm start convention — OK', 'success');
  }

  // ── EXPOSE port vs PORT default ──────────────────────────────────────────
  await sleep(100);
  const exposeMatch = dockerfile.content.match(/^EXPOSE\s+(\d+)/m);
  const exposedPort = exposeMatch ? exposeMatch[1] : null;

  const serverFile = getFile('src/server.js');
  let defaultPort: string | null = null;
  if (serverFile) {
    const m = serverFile.content.match(/process\.env\.PORT\s*\|\|\s*(\d+)/);
    defaultPort = m ? m[1] : null;
  }

  emit(`Dockerfile EXPOSE: ${exposedPort ?? 'not found'}, server.js default PORT: ${defaultPort ?? 'not found'}`);

  if (exposedPort && defaultPort && exposedPort !== defaultPort) {
    emit(`WARNING — EXPOSE ${exposedPort} does not match server default port ${defaultPort}`, 'warn');
  } else if (exposedPort === defaultPort) {
    emit('EXPOSE port matches server default — OK', 'success');
  }

  emit(`DeploymentAgent done — ${findings.length} finding(s)`, 'success');
  return { findings, fixes };
}
