# ShipGuard AI — Pre-Hackathon Preparation

## Core workflow

Developer -> Select project -> Upload release requirements -> Run Release Audit
-> Parallel specialist analysis -> Consolidated findings -> Fix plan
-> Developer approval -> Apply changes -> Re-run checks -> Release Gate
-> READY / BLOCKED -> Export report

## Planned specialist agents

1. Test Agent — inspect and run tests; summarize failures.
2. Configuration Agent — inspect environment/config requirements.
3. Dependency Agent — inspect package manifests and runtime compatibility.
4. Documentation Agent — compare docs with implementation.
5. Deployment Agent — inspect Docker/runtime/deployment configuration.
6. Main Release Agent — coordinate the workflow and consolidate findings.

## Demonstration requirements

The final demo should visibly demonstrate:
- Specialized subagents
- Parallel independent checks
- Document understanding using release-requirements.pdf
- Approved fixes rather than uncontrolled edits
- Re-running affected checks
- Final release gate
- Rollback/safety where supported

## Baseline measurement

Before ShipGuard:
- Record the time required for a manual release review.
- Record each manual check separately.
- Record number of issues discovered.
- Record number of rework cycles.

After ShipGuard:
- Record audit duration.
- Record fix/verification duration.
- Record issues discovered.
- Record rework cycles.

Do not claim percentage improvements until they have been measured on the same demo project.
