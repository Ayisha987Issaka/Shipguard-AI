 🛡️ ShipGuard AI

 Intelligent Software Release Readiness Agent

ShipGuard AI is an AI-powered software audit agent designed to help developers identify release-blocking issues before deploying an application.

Instead of only checking whether an application runs, ShipGuard evaluates the **entire release package** — including source code, configuration, tests, documentation, deployment files, and project requirements.

It maps requirements to evidence, identifies blockers and warnings, proposes targeted fixes, and supports verification after changes are applied.

---

 🚀 The Problem

Software can appear to work correctly while still containing issues that can cause problems during release.

Examples include:

* Incorrect API documentation
* Missing environment configuration
* Inconsistent runtime versions
* Failing or incomplete tests
* Missing deployment requirements
* Incomplete database migration documentation
* Configuration inconsistencies between development and production

These issues can easily be overlooked during manual reviews.

---

## 💡 Our Solution

ShipGuard AI provides a structured release-readiness workflow:

```text
Requirements
     ↓
AI Audit
     ↓
Evidence Collection
     ↓
Findings
     ↓
Fix Plan
     ↓
Human Review
     ↓
Applied Fixes
     ↓
Verification
     ↓
Release Decision
```

The goal is to turn a potentially time-consuming release review into a systematic, evidence-based process.

---

## ✨ Key Features

### 🔍 Requirement-Based Auditing

ShipGuard compares a project against its defined release requirements and determines whether each requirement is:

* ✅ PASS
* ⚠️ WARNING
* 🚫 BLOCKER

### 📂 Whole-Project Inspection

The audit considers more than source code. It can inspect:

* Source files
* Tests
* `package.json`
* Environment configuration
* Docker configuration
* Documentation
* Database migration documentation
* Release requirements

### 🧾 Evidence-Based Findings

Each finding is connected to specific project evidence so developers can understand:

* What is wrong
* Where the issue was found
* Which requirement is affected
* Why it matters for release

### 🛠️ Targeted Fix Plans

ShipGuard can generate structured fix proposals showing:

* The affected file
* The required change
* The reason for the change
* The expected result

Fixes remain subject to **human review and approval**.

### 🧪 Verification

After fixes are applied, the project can be tested again to verify whether the identified problems have been resolved.

---

## 🧪 FoodNest Demo

ShipGuard was demonstrated using a sample food-delivery application called **FoodNest v2.0**.

The project was audited against six release requirements.

### Findings

| Requirement | Area                             | Result     |
| ----------- | -------------------------------- | ---------- |
| REQ-01      | Payment success behavior         | ✅ PASS     |
| REQ-02      | Paystack secret configuration    | ✅ PASS     |
| REQ-03      | Node.js version consistency      | ✅ PASS     |
| REQ-04      | API documentation consistency    | ✅ PASS     |
| REQ-05      | Database migration documentation | ⚠️ WARNING |
| REQ-06      | Release report structure         | ✅ PASS     |

The remaining warning exists because the FoodNest demonstration project does not contain an actual database implementation. ShipGuard therefore documents the required migration and rollback strategy without pretending that a database exists.

This demonstrates an important principle of the project:

> **An audit should report limitations honestly instead of hiding them.**

---

## 🔧 Example Issues Identified

During the audit, ShipGuard identified several release-readiness issues, including:

### Payment behavior

The simulated payment function originally returned an unsuccessful result when the release requirement expected a successful payment response.

### Environment configuration

`PAYSTACK_SECRET_KEY` was not properly validated at runtime.

### Runtime inconsistency

The project contained inconsistent Node.js version requirements between the package configuration, Dockerfile, and documentation.

### API documentation mismatch

The application implemented:

```text
POST /api/payments
```

while the README documented:

```text
POST /api/payment
```

### Database documentation

The project had no actual database implementation, but the release requirements expected migration and rollback documentation.

ShipGuard converted this into a structured migration/rollback plan while keeping the requirement marked as a warning.

---

## 🧪 Verification Results

The FoodNest project was locally verified after the fixes.

```text
✔ health check contract
✔ successful payment returns success

ℹ tests 2
ℹ pass 2
ℹ fail 0
```

The project therefore had:

A) 2/2 automated tests passing**
b) 0 test failures**
c) 1 documented release warning**

---

 🤖 AI-Assisted Development

ShipGuard was developed with the assistance of **IBM Bob 2.0** and **ChatGPT**.

 IBM Bob

IBM Bob was used for:

* Repository inspection
* Requirement mapping
* Source-code analysis
* Identifying inconsistencies
* Generating structured fix plans
* Applying approved changes
* Test and release-readiness verification

### ChatGPT

ChatGPT supported:

* Workflow and architecture design
* Reviewing proposed fixes
* Debugging and reasoning
* Local verification
* Requirements and scope decisions
* Documentation
* Presentation and demonstration preparation

Human review remained an important part of the workflow. AI tools proposed and assisted with changes, while the developer reviewed and validated the results.

---

## 🏗️ Project Structure

```text
ShipGuard_PreHackathon/
│
├── foodnest-demo/
│   ├── src/
│   ├── tests/
│   ├── docs/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── shipguard-ui/
│   ├── src/
│   ├── public/
│   └── ...
│
├── release-requirements.pdf
├── SHIPGUARD_PREP.md
└── .gitignore
```

---

## 🛠️ Technologies

### AI & Development

* IBM Bob 2.0
* ChatGPT

### Backend

* JavaScript
* Node.js 20+
* Express.js
* ES Modules

### Frontend

* HTML
* CSS
* JavaScript
* Vite

### Testing

* Node.js Test Runner

### DevOps & Version Control

* Docker
* Git
* GitHub

---

## 🔐 Security & Configuration

Sensitive environment variables are intentionally excluded from version control.

The project uses `.gitignore` rules for:

```text
.env
.env.*
node_modules/
dist/
build/
```

A safe `.env.example` file can be committed to document required configuration without exposing real credentials.

**Never commit real API keys, passwords, tokens, or other secrets to the repository.**

---

## 🎯 Project Goals

ShipGuard AI aims to make software release reviews:

* More systematic
* More transparent
* More evidence-driven
* Easier to understand
* Easier to verify
* Safer before deployment

The broader vision is to help developers catch problems **before those problems become production incidents**.

---

## 🔮 Future Vision

Future versions of ShipGuard could support:

* GitHub repository integration
* Automated CI/CD release gates
* Pull-request auditing
* More programming languages
* Cloud deployment checks
* Dependency vulnerability analysis
* Database schema validation
* Automated regression testing
* AI-generated remediation patches
* Historical release-readiness tracking
* Team collaboration and approval workflows

---

## 🏆 Hackathon Project

**Project:** ShipGuard AI
**Category:** AI Agents / Developer Tools
**Focus:** Software Quality, Release Readiness & Developer Productivity

### Core Concept

> **Don't just ask whether the software works. Ask whether it is ready to release.**

---

 📄 License

This project is provided for hackathon and demonstration purposes.
