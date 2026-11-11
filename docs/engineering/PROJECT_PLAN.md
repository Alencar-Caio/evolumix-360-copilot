# Svolta pilot — engineering plan

**Status:** Proposed execution baseline  
**Scope:** Document-grounded answers for technical sheets and FDS/SDS, with an independently evaluated review stage  
**Canonical language:** English. See [Português brasileiro](./PROJECT_PLAN.pt-BR.md).

## Product outcome

Svolta will answer questions about approved product documents using retrievable, versioned evidence. Each factual claim must be traceable to a source location. The system must identify missing or conflicting evidence and abstain when the available sources do not support a safe answer. A separate review stage will evaluate the candidate answer and its evidence before the response is eligible for release under the pilot's policy.

This plan is for the Sevengel document pilot. It is not a claim that the current product meets these requirements.

## Repository baseline informing this plan

This plan is grounded in the following inspected files on the repository's `main` baseline (`be6536d6a18b3c40cfaf080dfdb089c1fcb6915b`):

- `server/routers/copilot.ts`: `copilot.query` loads approved document rows, places their title/type/supplier metadata in the prompt, asks the model to produce an answer, parses citation-like strings from model output, and assigns parsed citations to the first used document. Its faithfulness and citation-coverage values are computed from citation count/response length; risk is assigned by keyword matching. This path does not retrieve source passages in the inspected implementation.
- `server/db.ts`: `getApprovedDocuments` selects approved document records; `createQuery` persists the response, document IDs, citation objects and heuristic metrics. This helper does not establish passage-level provenance.
- `package.json`: declares Vitest, TypeScript checks, build scripts and dependencies including Pinecone/OpenAI packages and a Manus runtime plugin. Dependency presence is not proof that a package is active in the copilot path.
- `.github/workflows/deploy.yml`: runs `pnpm run lint || true`, tests and build; its deploy job prints placeholder messages and refers to Manus secrets. The inspected `package.json` has no `lint` script.
- Existing root documents make conflicting implementation/status claims. For example, `RAG_ARCHITECTURE_DECISION.md` labels RAG Core complete, while the inspected route does not retrieve passages; `todo.md`, `HANDOFF_STATUS_REAL.md`, `IMPLEMENTATION_ROADMAP_PHASE1.md`, `V3_IMPLEMENTATION_MASTER_PLAN.md` and `RAG_GOLD_STANDARD_SPECIFICATION.md` also contain status or architecture assertions that must be checked against code before being relied upon.

This is a scoped baseline, not a complete audit of every route, migration, test or provider integration. Phase 0 resolves that scope before implementation decisions are finalized.

## Work plan

### 0. Establish the implementation baseline and authoritative project record

**Work**

1. Trace the active copilot path from UI call through tRPC router, document lookup, persistence and response rendering.
2. Trace document lifecycle and schema: upload/source storage, approval state, version records, text extraction/indexing if present, and deletion/retention behavior.
3. Run the existing check, test and build commands in a repository-capable environment; record command output and failures. Inspect test coverage relevant to the copilot rather than relying on counts in old handoff documents.
4. Inventory provider integrations from imports, runtime calls and environment-variable reads. Classify each as active in the product path, available but unused, documentation-only, or unverified.
5. Reconcile existing project documentation. Keep one current product/architecture plan; mark superseded material as historical or update it rather than adding another competing status document.

**Deliverables**

- Verified component/data-flow map for the copilot and document lifecycle.
- Baseline verification record: commands, outcomes and known blockers.
- Documentation reconciliation decision identifying the canonical project documents.
- Provider and brand reference inventory.

**Exit criteria**

The team can point to the exact active code path and distinguish implemented behavior from documented intention. No implementation status is inferred from checkboxes or aspirational architecture documents.

### 1. Define the pilot's source contract and evaluation set

**Work**

1. Define a document identity/version/location model sufficient to trace every retrieved passage to product, source document, revision, section and page or offset when available.
2. Record source provenance and publication rights separately from technical content. The repository is public; publish only authorized material. Use synthetic or minimal licensed fixtures where full source documents cannot be committed.
3. Build an evaluation set for answerable, unanswerable, ambiguous, conflicting and safety-sensitive questions. For each case, specify expected evidence, required caveats, forbidden unsupported claims, and expected outcome (`answer`, `clarify`, or `abstain`).
4. Include prompt-injection content in test fixtures and verify document text is treated as untrusted evidence, not system instruction.
5. Obtain and verify source documents before asserting product-specific technical facts. Until then, product facts supplied in conversation remain user-provided and independently unverified.

**Initial evaluation risks to verify against source files**

- SEVEN ÁLCOOL 70°: reported ambiguity between `70° INPM` and `70° GL`.
- PEROXY GUARD: reported inconsistency between oral toxicity classification and DL50 values; antimicrobial efficacy claim without supplied test reports/conditions; `10% active` statement versus ingredient ranges reported as 4–6%.
- LIM+ LAVA LOUÇAS: document revision/date alignment and whether the sources support the proposed use and safety statements.

These are investigation/test prompts, not confirmed product conclusions. Do not resolve them by model inference.

**Deliverables**

- Provenance/data contract and source-access decision.
- Versioned evaluation cases with expected evidence and outcomes.
- Evaluation rubric for retrieval, claim support, citation validity, conflict detection and abstention.

**Exit criteria**

Evaluation cases are reproducible, source references are traceable, and publication permissions are known for each committed fixture.

### 2. Replace metadata-only context with passage retrieval

**Work**

1. Define a provider-neutral retrieval contract returning passage text plus document/version/location identifiers and retrieval metadata.
2. Select the smallest ingestion/retrieval design that fits the verified document lifecycle. Evaluate existing dependencies before adding another vector store or embedding provider.
3. Implement source ingestion, structural chunking and retrieval behind tested interfaces. Preserve page/section boundaries where the source provides them.
4. Pass retrieved passages—not only document titles and metadata—to the answer stage. Enforce document approval/version filters in retrieval.
5. Derive citations from retrieved passage identifiers. Validate that cited locations and excerpts exist in the retrieved source; do not map model-invented citations to an arbitrary document.
6. On empty, weak, stale or conflicting retrieval, follow the evaluation-defined clarify/abstain behavior.

**Deliverables**

- Ingestion and retrieval modules integrated with the verified document lifecycle.
- Passage-level citation contract.
- Unit and integration tests using authorized/synthetic fixtures.

**Exit criteria**

For every answerable evaluation case, expected evidence is retrievable and citations resolve to the exact source version/location. Unsupported cases do not receive fabricated source support.

### 3. Produce structured answers and independently evaluate them

**Work**

1. Define a typed answer result that separates supported claims, citations, uncertainty/conflicts, missing information and disposition.
2. Generate answers only from the retrieved evidence for product-specific claims. Keep general explanations explicitly distinct from source-derived statements.
3. Implement a separate reviewer input/output contract: question, candidate answer, retrieved passages and source metadata in; `approve`, `revise` or `abstain` plus claim-level findings out.
4. Make release eligibility depend on deterministic policy checks and reviewer outcome. A second model call alone is not a safety guarantee; evaluate it against the fixed cases and human-adjudicated examples.
5. Keep existing heuristic faithfulness/citation values out of user-facing claims until they are calibrated and validated against the evaluation set. Do not treat keyword risk classification as evidence validation.

**Deliverables**

- Structured answer and review contracts.
- Claim-to-evidence validation and policy enforcement.
- Evaluation report comparing answerer/reviewer outcomes to expected labels.

**Exit criteria**

No critical evaluation case with unsupported safety guidance, invalid source attribution or missed known conflict can pass the release gate. All remaining failures are documented and dispositioned.

### 4. Integrate the pilot behind controlled access

**Work**

1. Integrate the validated pipeline with the existing copilot router through a narrow service boundary.
2. Persist the exact source versions/passages or stable references, answer disposition, reviewer decision and policy version needed for reproducibility, subject to data minimization and retention policy.
3. Ensure high-risk or unresolved outputs cannot be presented as approved. Connect any human approval requirement to a real workflow before describing it as operational.
4. Add privacy-aware operational logging; avoid storing credentials and unnecessary document/user content.
5. Keep the pilot restricted until domain review and release criteria are met.

**Deliverables**

- Tested end-to-end pilot flow in a non-production environment.
- Reproducible records for evaluation and review.
- Domain-review sign-off and documented limitations before user exposure.

**Exit criteria**

End-to-end tests prove source traceability, policy enforcement, reviewer outcomes and safe abstention. A successful build alone is insufficient for release.

### 5. Make repository checks meaningful

**Work**

1. Replace the ignored lint command with a real configured lint script and blocking CI check, or remove the lint step until it exists.
2. Run type-check, tests and build as explicit required checks; use supported, pinned action versions and deterministic dependency installation.
3. Separate validation from deployment. Replace the current placeholder only when a target environment and deployment procedure are selected and authorized.
4. Add a PR checklist for tests, evaluation changes, data rights, safety impact, bilingual docs and provider coupling.

**Deliverables**

- CI whose green status means each declared check actually ran successfully.
- Deployment documentation that distinguishes a placeholder from an operational deployment.

**Exit criteria**

A failing required check blocks merge; no workflow reports a successful deployment when it has only printed placeholder text.

### 6. Migrate brand and provider dependencies incrementally

**Brand work**

- Inventory `Evolumix` references and classify brand copy, package/repository identifiers, database values, historical records, legal/licensing attribution and external links.
- Change product-facing brand references to Svolta in reviewed changes; preserve compatibility-sensitive identifiers until a migration is planned.
- Evaluate repository rename separately, including links, actions, secrets, deployment integrations, clones and redirects. Perform it only after impact review and explicit approval.

**Provider portability work**

- Confirm active dependencies from code, runtime and configuration—not dependency lists or documentation alone.
- Define provider-neutral interfaces only at boundaries needed by product code; avoid speculative abstraction for unused services.
- Plan and execute one replacement at a time for model/embeddings, storage, runtime/deploy and authentication as applicable. Authentication is inventoried but is not changed in the initial pilot work.
- For each migration, record provider choice, data/security/cost/availability implications, parity tests, cutover, rollback and removal of old credentials/configuration.

**Exit criteria**

Svolta can build, test and run the supported product path without the provider services and credentials targeted for removal. Portability is not complete while runtime or production paths still depend on them.

## Delivery sequence and review gates

| Increment | Scope | Merge gate |
|---|---|---|
| A | Baseline, canonical documentation, provider/brand inventory | Findings cite repository evidence; no code behavior change |
| B | Source provenance contract and evaluation set | Source access/rights recorded; cases reproducible |
| C | Retrieval and source-backed citations | Citation resolution and retrieval tests pass |
| D | Structured answer, reviewer and policy gate | Fixed safety/conflict/abstention evaluation passes agreed thresholds |
| E | Controlled end-to-end integration | Domain review, operational checks and release decision recorded |
| F | Brand and provider migrations | Separate impact review, tests and rollback for each migration |

Each increment should be an independently reviewable GitHub change with its own tests/evaluation evidence and updated English/Portuguese documentation. Do not combine repository rename, auth migration and pilot behavior changes in one change set.

## Decisions still required

- Which original product documents are available, current, and authorized for the intended storage and test use?
- What is the approved data-retention and access model for source files, passages, questions and answers?
- Which retrieval/embedding providers satisfy deployment, privacy, cost and portability requirements after the baseline inventory?
- What domain reviewer and release owner will adjudicate safety-sensitive evaluation cases?
- Which deployment target will replace the current placeholder, and when is external pilot exposure authorized?

## Change record

This plan is a repository-grounded work plan. It does not assert that the phases are implemented. Update status only when the corresponding code, tests and review evidence are present in GitHub.
