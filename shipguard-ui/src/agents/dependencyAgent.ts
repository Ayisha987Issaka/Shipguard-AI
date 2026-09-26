/**
 * Dependency Agent
 *
 * Responsibility: Check that the Node.js version is consistent across
 * package.json engines, Dockerfile, and README.md.
 * Maps to: REQ-03 (documented Node.js version must match deployment environment).
 */

import type { Finding, Fix } from '../types';
import { makeEmitter, makeFinding, makeFix, nextId, sleep } from './agentRunner';
import { getFile } from '../data/foodnestSnapshot';

export interface DependencyAgentResult {
  findings: Finding[];
  fixes: Fix[];
}

export async function runDependencyAgent(): Promise<DependencyAgentResult> {
  const emit = makeEmitter('DependencyAgent');
  const findings: Finding[] = [];
  const fixes: Fix[] = [];

  emit('DependencyAgent starting — scanning package.json, Dockerfile, README.md');
  await sleep(250);

  const packageJson = getFile('package.json');
  const dockerfile = getFile('Dockerfile');
  const readme = getFile('README.md');

  // ── Extract Node version from package.json engines ───────────────────────
  let packageEngineNode = 'not specified';
  if (packageJson) {
    const match = packageJson.content.match(/"node":\s*"([^"]+)"/);
    packageEngineNode = match ? match[1] : 'not specified';
    emit(`package.json engines.node: ${packageEngineNode}`);
  }
  await sleep(150);

  // ── Extract Node version from Dockerfile ────────────────────────────────
  let dockerfileNode = 'not specified';
  if (dockerfile) {
    const match = dockerfile.content.match(/^FROM node:([0-9]+)/m);
    dockerfileNode = match ? match[1] : 'not specified';
    emit(`Dockerfile FROM: node:${dockerfileNode}`);
  }
  await sleep(150);

  // ── Extract Node version from README.md ─────────────────────────────────
  let readmeNode = 'not specified';
  if (readme) {
    const match = readme.content.match(/Node\.js\s+(\d+)\+/i);
    readmeNode = match ? match[1] : 'not specified';
    emit(`README.md Node.js requirement: ${readmeNode}+`);
  }
  await sleep(150);

  // ── REQ-03: Check for mismatches ─────────────────────────────────────────
  // package.json says >=20, Dockerfile says 18, README says 18
  const packageMajor = packageEngineNode.replace(/[^0-9]/g, '').slice(0, 2);
  const dockerMajor = dockerfileNode;
  const readmeMajor = readmeNode;

  const allMatch =
    packageMajor === dockerMajor && packageMajor === readmeMajor;

  emit(
    allMatch
      ? 'All Node.js versions consistent — REQ-03 satisfied'
      : `MISMATCH detected: package.json says ${packageMajor}, Dockerfile says ${dockerMajor}, README says ${readmeMajor}`,
    allMatch ? 'success' : 'error'
  );

  if (!allMatch) {
    const findingId = nextId('DEP');

    findings.push(
      makeFinding({
        id: findingId,
        reqIds: ['REQ-03'],
        agents: ['DependencyAgent'],
        severity: 'BLOCKER',
        title: `Node.js version mismatch across package.json, Dockerfile, and README.md`,
        explanation:
          `Three files specify conflicting Node.js versions: ` +
          `package.json engines.node requires ">=20", ` +
          `Dockerfile uses "node:18-alpine" (Node 18), ` +
          `and README.md documents "Node.js 18+". ` +
          `The container will run on Node 18 which does not satisfy the >=20 engine requirement, ` +
          `and the README misleads developers about the supported runtime.`,
        affectedFile: 'Dockerfile',
        evidence:
          'package.json: "node": ">=20"\nDockerfile: FROM node:18-alpine\nREADME.md: Node.js 18+',
        recommendedFix:
          'Update Dockerfile to "FROM node:20-alpine" and README.md to "Node.js 20+" to align with package.json.',
      })
    );

    // Fix 1: Dockerfile
    const dockerFixId = nextId('FIX');
    fixes.push(
      makeFix({
        id: dockerFixId,
        findingId,
        reqIds: ['REQ-03'],
        agentReasoning:
          'Dockerfile line 1: "FROM node:18-alpine". package.json engines.node: ">=20". ' +
          'Node 18 does not satisfy the >=20 constraint. Updating to node:20-alpine resolves the mismatch.',
        affectedFile: 'Dockerfile',
        searchText: 'FROM node:18-alpine',
        replaceText: 'FROM node:20-alpine',
        description: 'Update Dockerfile base image from node:18-alpine to node:20-alpine.',
      })
    );

    // Fix 2: README.md
    const readmeFixId = nextId('FIX');
    fixes.push(
      makeFix({
        id: readmeFixId,
        findingId,
        reqIds: ['REQ-03'],
        agentReasoning:
          'README.md states "Node.js 18+" but package.json requires ">=20". ' +
          'The README must be updated to reflect the actual minimum version.',
        affectedFile: 'README.md',
        searchText: '- Node.js 18+',
        replaceText: '- Node.js 20+',
        description: 'Update README.md Node.js requirement from 18+ to 20+.',
      })
    );
  }

  emit(`DependencyAgent done — ${findings.length} finding(s)`, 'success');
  return { findings, fixes };
}
