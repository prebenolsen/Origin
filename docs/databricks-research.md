# Azure Databricks — Documentation Research Notes

> Research compiled from the official Azure Databricks documentation
> (https://learn.microsoft.com/en-us/azure/databricks/) as reference material for
> building the **Technology → Data Engineering** content modules in Origin.
>
> Method: wide sweep across the documentation's top-level domains, collecting the
> main points of each subject. Each top-domain section is written before moving on.

## Domains covered (map of the documentation)

1. Foundations — What is Azure Databricks, the Lakehouse, Architecture, Components
2. Data Engineering — ingestion, pipelines, jobs, orchestration, streaming
3. Delta Lake & Tables — the storage layer, ACID, table formats
4. Apache Spark — the distributed processing engine
5. Compute — clusters, serverless, SQL warehouses, Photon
6. Data Warehousing — Databricks SQL
7. Unity Catalog & Data Governance
8. AI & Machine Learning — MLflow, Mosaic AI, Generative AI
9. Business Intelligence — AI/BI dashboards, Genie
10. Notebooks & developer experience
11. Lakebase (OLTP databases)
12. Developer tools — APIs, CLI, SDKs, Asset Bundles
13. Administration
14. Security & compliance

---

## 1. Foundations

### What is Azure Databricks?

- A **unified, open analytics platform** for building, deploying, sharing, and maintaining
  enterprise-grade **data, analytics, and AI** solutions at scale. Branded the
  **Databricks Data Intelligence Platform**.
- It integrates with the cloud storage and security in *your* cloud account, and **manages
  and deploys the cloud infrastructure for you** (you don't hand-provision servers).
- Uses **generative AI over the data lakehouse** to understand the *semantics* of your data,
  then automatically optimizes performance and manages infrastructure. Natural-language
  search/discovery and an AI assistant (write code, fix errors, search docs).
- **Personas served:** data engineers, data scientists, ML engineers, data analysts, and
  business/BI users — all working off one platform and one copy of the data.

### Managed open source (projects Databricks originally created)

- **Apache Spark** + **Structured Streaming** — the distributed processing engine.
- **Delta Lake** — ACID storage layer over cloud object storage.
- **MLflow** — ML/AI lifecycle management.
- **Unity Catalog** — governance for data + AI.
- **Redash** — visualizations/dashboards; **OpenSharing** (Delta Sharing) — open data sharing.
- Databricks ships and updates these as part of the **Databricks Runtime**.

### Common use cases (the platform's "pillars")

1. **Enterprise data lakehouse** — one single source of truth for all personas.
2. **ETL & data engineering** — Spark + Delta + Lakeflow Declarative Pipelines + Auto Loader.
3. **ML, AI & data science** — MLflow, Databricks Runtime for ML, Mosaic AI.
4. **LLMs & generative AI** — fine-tune foundation models; AI Functions in SQL.
5. **Data warehousing, analytics & BI** — Databricks SQL, SQL warehouses, AI/BI dashboards, Genie.
6. **Data governance & secure sharing** — Unity Catalog + Delta/Open Sharing.
7. **DevOps, CI/CD & orchestration** — Jobs, Asset/Automation Bundles, Git folders.
8. **Real-time & streaming analytics** — Structured Streaming + Delta.
9. **OLTP** — Lakebase (managed Postgres).

### What is a data lakehouse?

- A **data management system that combines the benefits of data lakes and data warehouses.**
- Goal: a **single source of truth**, eliminate redundant/duplicated systems & costs, ensure
  **data freshness**, and serve ML *and* BI from the same data without separate silos.
- **The evolution / why it exists:**
  - **Data warehouse** (~30 yrs old): great clean structured data for BI, but queries can be
    slow (minutes–hours), designed for slowly-changing data, often **proprietary formats**
    that limit ML.
  - **Data lake** (last ~decade): stores any data, any format, **cheaply**; good for data
    science/ML, but data is **unvalidated** and usually unfit for reliable BI reporting.
  - **Lakehouse**: combines both → open direct access to data in **standard/open formats**,
    indexing optimized for ML/DS, **low query latency + high reliability** for BI.
- **How it works on Databricks:** built on **Apache Spark** (compute decoupled from storage) +
  two key technologies — **Delta Lake** (optimized storage, ACID, schema enforcement) and
  **Unity Catalog** (unified, fine-grained governance + lineage).
- **Logical layers:** ingestion (raw data lands) → processing/curation/integration (clean,
  enrich, build features) → serving (clean data for ML, DE, BI). Often organized as the
  **medallion architecture** (bronze → silver → gold).
- **Lakehouse capabilities:** real-time processing, data integration, schema evolution,
  transformations, analysis/reporting, ML/AI, versioning & lineage, governance, sharing,
  operational analytics / data-quality monitoring.

### Platform architecture

- Split into **control plane**, **compute plane**, and **storage**:
  - **Control plane** — Databricks-managed backend services (workspace UI, notebooks config,
    job orchestration, cluster manager). Lives in the Databricks cloud account.
  - **Compute plane (data plane)** — where data is actually processed. **Classic** compute
    runs in *your* cloud subscription; **serverless** compute runs in Databricks' account.
  - **Storage** — your data sits in **cloud object storage** in standard open formats; compute
    is separated from storage so each scales independently.
- **ACID guarantees** (Atomicity, Consistency, Isolation, Durability) make lakehouse data
  reliable even with concurrent reads/writes.

### Core components & terminology

- **Account** — top-level entity; can contain multiple **workspaces**. Unity-Catalog-enabled
  accounts manage users & data access centrally across all workspaces.
- **Workspace** — a Databricks deployment/environment where a team accesses assets; organizes
  notebooks, libraries, dashboards, experiments into folders.
- **DBU (Databricks Unit)** — the billing unit: processing capability per hour, priced by VM
  instance type.
- **Identities & access:** *User* (an individual, by email), *Service principal* (identity for
  jobs/automation/CI-CD, by app ID), *Group* (collection of identities), *ACL* (permissions on
  an object), *PAT* (personal access token) / Microsoft Entra ID tokens for API auth.
- **Interfaces:** UI, **Genie One** (simplified UI for business users), REST API, SQL REST API,
  **Databricks CLI** (built on the REST API).
- **Data objects (Unity Catalog hierarchy):** Metastore → **Catalog** (top container) →
  **Schema/database** → **Table** / **View** / **Volume** (non-tabular data) / functions / models.
  - **Delta tables** are the default table type — ACID storage as a directory of files in cloud
    object storage + metadata registered to the metastore.
  - **Catalog Explorer** — UI to browse/manage all data + AI assets.
  - **DBFS root** — legacy storage location; now **deprecated** in favor of Unity Catalog.
- **Compute objects:** **Cluster** (all-purpose = interactive/shared vs job = created per job,
  not restartable), **Pool** (idle ready instances to cut startup time), **Databricks Runtime**
  (core components incl. Spark; + **Runtime for ML** with TensorFlow/PyTorch/XGBoost/GPU).
- **Workloads:** *data engineering* (automated, runs on a job cluster) vs *data analytics*
  (interactive, runs on an all-purpose cluster).
- **Orchestration:** **Jobs** (schedule notebooks/queries/code), **Pipelines** (Lakeflow Spark
  Declarative Pipelines), surfaced in the **Jobs & Pipelines** UI.
- **Dev objects:** Notebook, Library, **Git folder** (formerly Repos — Git source control).

---

## 2. Data Engineering — Lakeflow

**Lakeflow** is Databricks' end-to-end data engineering solution: a unified platform for
**ingestion, transformation, and orchestration**. Four parts: **Lakeflow Connect** (ingest),
**Lakeflow Spark Declarative Pipelines** (transform), **Lakeflow Designer** (visual/no-code),
and **Lakeflow Jobs** (orchestrate).

### Lakeflow Connect — ingestion

- Connectors to enterprise apps, databases, cloud storage, message buses, and local files.
- **Three layers of the ETL/ingestion stack** (most customizable → most managed; "start with
  the most managed layer, drop down only if it can't meet your needs"):
  1. **Structured Streaming** — full control; streaming engine with exactly-once guarantees.
  2. **Lakeflow Spark Declarative Pipelines** — declarative framework on top of Structured
     Streaming; manages orchestration, monitoring, data quality, errors → less overhead.
  3. **Managed connectors** — most automation for popular sources; add source-specific auth,
     **CDC** (change data capture), schema evolution, retries, edge-case handling.
- **Auto Loader** — incrementally and *idempotently* loads new files from cloud object storage
  as they arrive. The `CREATE STREAMING TABLE` SQL syntax is the recommended modern alternative
  to the older `COPY INTO`.
- **Sources** include: cloud object storage (S3, ADLS Gen2, GCS), SFTP, Apache Kafka, Azure
  Event Hubs, Amazon Kinesis, Google Pub/Sub, Apache Pulsar, Salesforce, SQL Server.
- **Ingestion schedules:** *Batch* = **Triggered** mode (runs on a schedule / manually);
  *Streaming* = **Continuous** mode (processes data as it arrives).

### Lakeflow Spark Declarative Pipelines (SDP) — transformation

> Formerly **Delta Live Tables (DLT)**. A **declarative** framework: you describe *what* the
> data should look like and SDP figures out *how* to build, order, run, and scale it.

- Builds batch **and** streaming pipelines in **SQL or Python**; runs on the optimized
  Databricks Runtime. Requires the Premium plan.
- Automatically manages **dependencies between datasets**, orchestration, monitoring, error
  handling, retries, and production infrastructure (deploy + scale).
- **Core concepts:**
  - **Flow** — the processing unit; uses the same DataFrame API as Spark/Structured Streaming.
    Writes to streaming tables/sinks (streaming semantics) or materialized views (batch).
  - **Streaming table** — a Delta table with added support for streaming/incremental processing;
    the target for one or more flows.
  - **Materialized view** — a view with **cached, precomputed results** for fast access; the
    target for batch flows. Refreshed incrementally when possible.
  - **Sink** — external target: Kafka, Azure Event Hubs, Unity-Catalog external tables, or a
    custom Python sink.
- **Data quality = "expectations"** — declarative rules that validate data; you can warn, drop,
  or fail on bad records. (Key for the "Delta Lake solves reliability" story.)

### Lakeflow Designer — visual / no-code

- Drag-and-drop canvas **or natural-language prompts** to build transformation workflows.
- Built-in operators: filter, aggregate, join, reshape. All workflows are backed by
  **production-ready code governed by Unity Catalog** (not a throwaway GUI).

### Lakeflow Jobs — orchestration

> Formerly **Databricks Workflows / Jobs**. The scheduler that ties everything together.

- **Three orchestration concepts:**
  - **Job** — primary resource for coordinating/scheduling/running work; tasks are arranged as a
    **DAG** (directed acyclic graph). Job-level properties: trigger, parameters, notifications, Git.
  - **Task** — a unit of work. Task types include: notebook, pipeline (SDP), Python script, SQL
    query, dbt, ML training, model deployment/inference, and more. Tasks can depend on and
    conditionally trigger other tasks.
  - **Trigger** — *time-based* (e.g. daily at 2 AM) or *event-based* (e.g. new files arrive).
- **Control flow:** branching (`if/else`) and looping (`for each`) in a visual authoring UI.
- **Monitoring & observability:** run status + metrics, UI run history, notifications/alerts
  (email, Slack, webhooks), and **system tables** that log every run/task for cost & performance
  analysis.
- **External orchestration & integration:** dbt, **Azure Data Factory (ADF)**, **Apache Airflow**.
- **Programmatic management:** Databricks CLI, **Declarative Automation Bundles**, VS Code
  extension, SDKs, Jobs REST API.
- **Scale limits (rough):** 2000 concurrent task runs / workspace, 10k job creations per hour,
  12k saved jobs, 1000 tasks per job.

### Databricks Runtime for Apache Spark (the engine underneath)

- Reliable, performance-optimized compute for Spark **batch and streaming** workloads.
- Ships **Photon** (Databricks-native vectorized query engine) and infrastructure optimizations
  like **autoscaling**. You package Spark work as notebooks, JARs, or Python wheels.

### Structured Streaming (real-time backbone)

- Apache Spark's **near-real-time** engine: end-to-end fault tolerance + **exactly-once**
  guarantees using the same Spark APIs as batch.
- **Key idea:** express a streaming computation *the same way as a batch computation on static
  data*; the engine runs it **incrementally** and continuously updates results as data arrives.
  (This is the "streams as unbounded tables" mental model — the unifying point between batch and
  streaming.)
- **Sources:** Auto Loader, Delta Lake tables (streaming reads/writes), message-bus connectors.
- **Delivery controls:** **checkpoints** (persist processing state → fault tolerance &
  exactly-once), **output mode** (append / update / complete), **trigger intervals** (latency vs
  cost), and a **real-time mode** with end-to-end latency as low as ~5 ms.
- **Stateless vs stateful:** stateless processes rows independently; stateful maintains
  intermediate state for aggregations, stream-stream joins, and deduplication. **Watermarks**
  bound how long to wait for late-arriving data.

---

## 3. Delta Lake & Tables — the storage layer

### What is Delta Lake?

- The **optimized storage layer** that is the foundation for all tables in the lakehouse.
- **Open source.** It **extends ordinary Parquet data files with a file-based transaction log**
  → that combination is what delivers **ACID transactions** and scalable metadata handling.
- The **default format for every table on Databricks** — unless you say otherwise, a table *is*
  a Delta table. Fully compatible with Spark APIs.
- Built for **tight Structured Streaming integration**, so a **single copy of data serves both
  batch and streaming** (the unification that makes the lakehouse work).
- The transaction log is an **open protocol** any system can read.

### Key Delta Lake features (the "reliability" toolbox)

- **ACID transactions** — reliable concurrent reads/writes (details below).
- **Time travel / versioning** — *every write creates a new table version*; you can query or
  roll back to previous versions via the transaction log (`table history`).
- **Schema enforcement** — validates data **on write**; rejects data that doesn't match the
  schema. Plus **schema evolution** — change schema over time without rewriting data.
- **MERGE (upsert)**, selective overwrite, row-level `UPDATE`/`DELETE`.
- **Constraints** — enforced `CHECK` / `NOT NULL`; informational primary-key / foreign-key /
  unique constraints (PK/FK are *not* enforced, only declared).
- **Generated columns**, custom table/column metadata, column mapping (rename/drop w/o rewrite).
- **Change Data Feed (CDF)** — track row-level changes between table versions.
- **Performance & file management:** **liquid clustering** (adaptive layout, no manual
  partitioning), **data skipping** (column stats + **Z-order**), **OPTIMIZE** (compact small
  files), **VACUUM** (delete stale/untracked files), auto-TTL row deletion, file-size tuning.
- **Migration:** `CONVERT TO DELTA` and incremental **CLONE** from Parquet / Apache Iceberg.

### ACID guarantees in detail (great for the "reliability problems" story)

- **A**tomicity — a transaction wholly succeeds or wholly fails.
- **C**onsistency — how a data state is seen by simultaneous operations.
- **I**solation — how simultaneous operations are kept from interfering.
- **D**urability — once committed, changes are permanent.
- **How atomicity works:** data files are written first; only when a **commit entry is added to
  the transaction log** (listing the file paths) does the table version increment and the new
  data become visible. A **failed transaction leaves orphan files that are simply never part of
  the table** — no corruption; `VACUUM` later removes them. *This is the heart of why the
  lakehouse is reliable where a plain data lake is not.*
- **Durability:** the log and data both live in **cloud object storage**, which is highly
  available and durable.
- **Concurrency:** **optimistic concurrency control** — no locks, no deadlocks. Writes go
  read → write → **validate & commit**; if another write conflicted since the snapshot, the
  commit **fails with an exception instead of corrupting data**.
- **Isolation levels:** **write-serializable** for writes, **snapshot isolation** for reads.
- **Multi-table / multi-statement** transactions via `BEGIN ATOMIC … END` (needs catalog
  commits); supports **multi-cluster and cross-workspace** concurrent writes safely.

### Medallion architecture (Bronze → Silver → Gold)

- A **data design pattern** ("multi-hop") that organizes tables by **data quality**, refining
  data progressively toward a single source of truth. Recommended, not required.
- **🥉 Bronze (raw):** ingests raw, unvalidated data exactly as it arrives (cloud storage,
  message buses, federated systems). Append-only, grows over time, preserves full fidelity for
  reprocessing/auditing. Minimal validation — store fields as string/VARIANT/binary to survive
  schema changes. Users: data engineers, audit/compliance.
- **🥈 Silver (validated):** cleansed, deduplicated, normalized, schema-enforced; handles
  nulls, late/out-of-order data, type casting, joins. Keeps at least one validated,
  non-aggregated record per entity; data modeling often starts here. Users: data engineers,
  analysts, data scientists.
- **🥇 Gold (enriched):** highly refined, **aggregated**, business-aligned (dimensional models,
  measures, KPIs), optimized for dashboards/queries. Often materialized views (e.g.
  `weekly_sales`). Multiple gold layers per business domain (HR, finance, IT). Users: BI/business
  analysts, executives, ML engineers.
- **Cost vs latency knob:** continuous incremental ingestion (higher cost, lower latency) →
  triggered incremental → batch (lowest cost, highest latency).

### Tables — types & formats

- **Table types:**
  - **Managed** — Databricks/Unity Catalog manages *both* metadata and data files; best
    performance, recommended default.
  - **External** — data lives in an external system; Unity Catalog manages **metadata only**.
  - **Temporary** — session-scoped, SQL warehouses only, for intermediate data.
  - **Foreign** — read-only access to external systems via **Lakehouse Federation**.
- **Storage formats:** **Delta Lake** (default — ACID, time travel, schema enforcement) and
  **Apache Iceberg** (open table format for the Iceberg ecosystem).
- **Naming:** the three-level Unity Catalog namespace **`catalog.schema.table`**.
- **Management features:** constraints, schema enforcement, partitioning, size monitoring,
  convert-external-to-managed, partition discovery.

---

## 4. Apache Spark — the processing engine

- **Apache Spark is the technology powering compute clusters and SQL warehouses** in Azure
  Databricks — "at the heart of the Databricks Data Intelligence Platform."
- **Open source**, originally created by the people who founded Databricks. It is a **massively
  scalable engine that runs on compute resources decoupled from storage** → you can scale
  processing independently of how much data you store.
- **Distributed processing model:** a Spark application splits work across a **cluster** — a
  **driver** node coordinates and **worker/executor** nodes do the parallel work. This is how
  Spark crunches data sets far larger than a single machine could handle (the core answer to
  "why big data needs something new").
- **Language APIs:** **PySpark** (Python), **Spark SQL**, **Scala**, and **R**. The main
  high-level abstraction is the **DataFrame** (a distributed, table-like collection).
- **Lazy evaluation:** *transformations* (e.g. filter, join, select) build up a plan but don't
  run; an *action* (e.g. count, write, collect) triggers actual execution, letting Spark
  optimize the whole plan first.
- **Unifies workloads:** the same engine handles batch ETL, SQL analytics, streaming
  (Structured Streaming), and ML — one engine instead of separate systems.
- **Databricks' optimizations on top of Spark:**
  - **Databricks Runtime** bundles Spark plus performance, usability, and security improvements.
  - **Photon** — a Databricks-native **vectorized query engine** that accelerates SQL and
    DataFrame calls and lowers cost per workload.
  - Tight **Delta Lake + Structured Streaming** integration for one-copy batch + streaming.

> Narrative note: Spark (2014-era) solved *distributed processing* of big data, but raw Spark
> was hard to operate (clusters, tuning, infrastructure). That operational gap is exactly what
> Databricks was created to close — see §5 and §1.

---

## 5. Compute — clusters, serverless, SQL warehouses

**Compute** = the computing resources that run data engineering, data science, and analytics
workloads. Three families: **serverless**, **classic**, and **SQL warehouses**. Billed in
**DBUs** (Databricks Units).

### Serverless compute

- An **Azure Databricks-managed** service: you run workloads **without provisioning any compute
  in your own cloud account** — Databricks allocates, scales, and manages it for you.
- Benefits: **fast startup**, minimal idle time, automatic **autoscaling**, no infra management.
- **Versionless** — Databricks auto-upgrades the runtime; everyone runs the latest version.
- Requirements: **Unity Catalog enabled** + a supported region (available by default in most
  workspaces).
- Supports **notebooks, jobs, and Lakeflow Declarative Pipelines**. Related serverless features
  (configured separately): serverless SQL warehouses, model serving, AI features, data-quality
  monitoring, predictive optimization.
- **Databricks Connect** lets you run serverless workloads from a local machine.

### Classic compute

- **Provisioned compute you create, configure, and manage** — the compute layer runs in **your
  own Azure subscription**.
- **Standard** (multi-user, shared, cost-effective; **Lakeguard** provides secure user
  isolation) vs **Dedicated** (assigned to a single user or group).
- **Instance pools** — pre-warmed idle instances that cut cluster startup time and save cost.
- A **cluster** = a **driver node** + **worker nodes** with **autoscaling**. All-purpose
  (interactive/shared) vs job (created per job, then terminated, not restartable).

### SQL warehouses (compute optimized for SQL/BI)

Three types, differing by performance features (all support **Photon**):

| Type | Photon | Predictive IO | Intelligent Workload Mgmt | Startup | Compute runs in |
| --- | --- | --- | --- | --- | --- |
| **Serverless** | ✓ | ✓ | ✓ | ~2–6 sec | Databricks account |
| **Pro** | ✓ | ✓ | — | ~4 min | Your Azure subscription |
| **Classic** | ✓ | — | — | ~4 min | Your Azure subscription |

- **Photon** — built-in vectorized query engine; faster SQL/DataFrame, lower cost.
- **Predictive IO** — speeds up selective scan operations in SQL queries.
- **Intelligent Workload Management (IWM)** — AI-powered dynamic scaling for serverless SQL;
  responds to demand instead of static thresholds. Serverless is recommended (best startup +
  autoscaling) for ETL, BI, and exploratory analysis.
- **Lakeguard** — security framework providing governance/access control on shared compute.

---

## 6. Data Warehousing — Databricks SQL

- **Data warehousing** = collecting/storing data from many sources so it can be quickly queried
  for **business insights and reporting**.
- **Databricks SQL** is a **cloud data warehouse built on lakehouse architecture** — it runs
  *directly on your data lake*, speaks **ANSI SQL** (+ Delta Lake extensions), and lets you
  build performant, cost-effective warehouses **without moving/copying your data**.
- **vs a traditional data warehouse:** same idea (model data → serve to users for analytics &
  reports) but **no data silos and no redundant copies that go stale** — one system, plus
  Unity Catalog (governance/lineage) and Delta Lake (ACID, schema evolution).
- Powered by **SQL warehouses** (formerly "SQL endpoints") — scalable SQL compute **decoupled
  from storage** (see §5 for Classic/Pro/Serverless types).
- **Interfaces & tools:** SQL editor (AI-assisted, version history), notebooks attached to a SQL
  warehouse, scheduled SQL jobs, **AI/BI dashboards**, **metric views** (semantic layer for
  consistent business KPIs), **alerts**, and in-warehouse ETL via streaming tables/materialized
  views.
- **Monitor/optimize:** query history, **query profile** (execution plan → find bottlenecks),
  query performance insights (automatic recommendations).
- **Data modeling in the lakehouse (warehouse-style):**
  - The **data warehouse is modeled in the Silver layer** — often **3NF** (third normal form) or
    **Data Vault**; schema-on-write, atomic, optimized for change. PK/FK constraints express
    table relationships.
  - **Data marts live in the Gold layer** — usually **dimensional models / star schemas**
    capturing a specific business perspective; also hosts self-service/data-science sandboxes.
- **OLAP vs OLTP:** warehousing is analytical (**OLAP** — read-heavy aggregations for reporting),
  in contrast to transactional **OLTP** systems (see §11 Lakebase).

---

## 7. Unity Catalog & Data Governance

- **Unity Catalog (UC)** is the **unified governance layer built into Databricks** for **data
  *and* AI** assets. Once enabled, it sits beneath every interaction: enforcing **access
  control**, tracking **lineage**, logging activity for **auditing**, and enabling **discovery**.
- Auto-enabled for workspaces created after **Nov 9, 2023**; also available as **open source**.
- Worked with via Catalog Explorer, SQL, the CLI, and REST APIs.

### Object model & the three-level namespace

- Everything governed is a **securable object** — something you can grant permissions on to a
  **principal** (user, service principal, or group).
- **Hierarchy:** **Metastore** (top) → **Catalog** → **Schema** → data/AI assets. Data assets use
  the **three-level namespace `catalog.schema.object`**.
  - **Metastore** — top-level container, **scoped to a single cloud region** (one per region),
    can attach to many workspaces; a grant in one workspace applies to all workspaces on that
    metastore. Optional **metastore admin** role.
  - **Catalog** — top organizing layer (by org unit or dev/stage/prod). `USE CATALOG` required to
    touch anything inside; `BROWSE` lets users discover metadata without data access.
  - **Schema** (a.k.a. database) — groups tables/views/volumes/functions; needs `USE SCHEMA`.
- **Securable data/AI objects (under a schema):**
  - **Table** — structured data. *Managed* (UC controls storage lifecycle + governance),
    *external* (UC governs metadata only), *foreign* (read-only, via Lakehouse Federation).
  - **View** — stored read-only query; **materialized view** (precomputed/stored results) and
    **metric view** (reusable KPI definitions / semantic layer).
  - **Volume** — governs **unstructured/non-tabular** files in cloud storage (managed/external);
    file-level `READ VOLUME` / `WRITE VOLUME`, not SQL.
  - **Function** — reusable logic: SQL/Python UDFs, stored procedures, and **registered models**.
  - **Model** — a versioned **MLflow** model stored as a function object (model versions inside).
- **Metastore-level objects** (not under a schema): storage credentials, external locations,
  service credentials, connections (query/catalog federation, JDBC, HTTP), external metadata, and
  the **sharing** objects — **shares / providers / recipients** (Open/Delta Sharing) and **clean
  rooms** (secure cross-org collaboration without exposing raw data).

### Access control & privileges

- **Usage privileges** (`USE CATALOG`, `USE SCHEMA`) gate *entering* a container; object
  privileges (`SELECT` read, `MODIFY` write, `EXECUTE`, `READ/WRITE VOLUME`, `REFRESH`, …) gate
  the asset itself.
- **Privilege inheritance:** grants on a catalog or schema flow down to all current *and future*
  children (so catalog-level grants are powerful — use carefully). Metastore-level grants do
  **not** inherit.
- **Finer-grained controls:** attribute-based policies (ABAC), row filters, column masks, and
  **workspace bindings** (restrict a catalog to specific workspaces; supersedes individual grants).
- Views are a classic way to expose only certain rows/columns — the **view owner's** privileges
  resolve the underlying tables, so consumers need no access to the base tables.

### Governance capabilities

Access control · **Data lineage** (automatic source→dashboard tracking) · **Auditing** (audit-log
system tables) · **Data discovery** (Catalog Explorer) · **Data classification** (auto-tag
sensitive data) · **Data quality monitoring** (profiling + anomaly alerts) · **Data sharing**
(OpenSharing across orgs/clouds) · **AI governance** (UC + AI Gateway).

---

## 8. AI & Machine Learning (Mosaic AI)

The platform unifies the **entire ML lifecycle**: data prep → training → experiment tracking →
model registry → serving → monitoring — all on the same governed data.

### Classic ML

- **Databricks Runtime for ML** — pre-configured clusters with scikit-learn, XGBoost, **MLflow**,
  deep-learning frameworks, and built-in GPU support.
- **MLflow** — open-source ML lifecycle tool (created by Databricks). **Tracking** records
  experiments/runs to compare performance; an **experiment** is a collection of runs.
- **AutoML** — automatically builds quality models with automated feature engineering and
  hyperparameter tuning (low-code).
- **Feature Store / feature engineering** — create, manage, serve features; ensures the *same*
  feature computation is used for training and inference; enables sharing/discovery.
- **Deep learning** — distributed training (Ray, TorchDistributor, DeepSpeed), PyTorch, and
  **AI Runtime** (serverless GPU compute).
- **Model Serving** — deploy custom models and LLMs as scalable **REST endpoints** with
  autoscaling + GPU.
- **Models in Unity Catalog** — the model registry lives in UC → centralized governance,
  lineage, cross-workspace discovery, lifecycle/deployment management.
- **Monitoring** — data profiling, prediction **drift** detection, anomaly detection.
- **MLOps** — automated training/testing/deployment, CI/CD, orchestrated with Lakeflow Jobs.

### Generative AI (Mosaic AI)

- **Foundation Models / Foundation Model APIs** — serve open-source and third-party LLMs
  (**Meta Llama, Anthropic Claude, OpenAI GPT**, …) behind secure, scalable APIs; pay-per-token
  or provisioned throughput.
- **External models** — integrate third-party LLMs hosted outside Databricks under one governance
  layer. **AI Gateway** governs/monitors all model traffic (usage tracking, payload logging,
  rate limits, security).
- **AI Playground** — no-code environment to test, prompt, and compare LLMs, add tools, and
  prototype agents before exporting to code.
- **AI agents / Agent Framework** — build tool-calling agents, **RAG** apps, and multi-agent
  systems; author with LangChain/LangGraph/OpenAI/LlamaIndex; **MCP (Model Context Protocol)**
  standardizes how agents connect to data/tools. **Knowledge Assistant** builds domain chatbots.
- **Agent evaluation & observability** — **MLflow Tracing** logs every agent step;
  **Agent Evaluation** measures quality/cost/latency using **LLM judges** + human review apps.
- **AI Functions in SQL** — call LLMs (e.g. `ai_query`) directly inside SQL pipelines/queries.
- **Fine-tuning** — customize a foundation model on your own data for your domain.

### Databricks AI Search / Vector Search (powers RAG)

- **Embeddings** = numeric/mathematical representations of the *semantic meaning* of text or
  images, produced by a model. **Vector search** finds the embeddings most *similar* to a query.
- **AI Search** is the built-in **vector search engine**; powers **RAG**, recommender, and
  semantic-search apps. Indexes are governed by **Unity Catalog**.
- **Index from a Delta table** that can **auto-sync** when the source table changes (via Change
  Data Feed). Embedding options: Databricks-computed (Delta Sync), self-managed embeddings, or
  Direct Vector Access.
- **Algorithm:** HNSW for **approximate nearest neighbor (ANN)**, L2 distance; supports **hybrid
  keyword + similarity search** (BM25 + vectors, fused via Reciprocal Rank Fusion), filtering,
  and reranking. (How "AI understands your data" stories connect ingestion → embeddings →
  retrieval.)

---

## 9. Business Intelligence (AI/BI)

- **Databricks AI/BI** — a business-intelligence solution using "**compound AI**" for
  **self-service** insights with built-in governance and performance, directly on lakehouse data.
- **AI/BI Dashboards** — AI-powered, **low-code** dashboards: AI-assisted authoring, rich
  visualizations, cross-filtering; shareable across the org.
- **AI/BI Genie (Genie Spaces)** — domain-specific **natural-language chat** over your data: ask
  a question in plain English → get back SQL, a results table, and a visualization. Analysts
  curate a space with **Unity-Catalog datasets, example SQL queries, business-semantic
  expressions, and instructions in the org's own terminology**.
- **Genie family:** **Genie One** (business users — one chat across data, dashboards, apps),
  **Genie Code** (developers — generate code/pipelines/dashboards), **Genie Spaces**
  (domain-specific Q&A). Plus **agent mode** and a **Conversation API** to embed Genie in apps.
- **Unity Catalog business semantics / metric views** — define business **KPIs once** as a
  governed **semantic layer**; both dashboards and Genie use it as a single source for metrics,
  so people and AI tools get consistent numbers.

---

## 10. Notebooks & developer experience

- **Notebooks** are the primary tool for data science/ML/analytics workflows: collaborative,
  **multi-language documents** with **real-time co-authoring**, automatic versioning, and
  built-in **visualizations**.
- **Languages in cells:** Python, SQL, Scala, R — switch per cell with **magic commands**
  (`%python`, `%sql`, `%scala`, `%r`, `%md`, `%sh`, …). Syntax highlighting + IntelliSense.
- **Attach to compute** — a cluster or a SQL warehouse — to execute cells.
- **Collaboration & sharing:** comments, real-time co-editing, import/export, dashboards built
  straight from notebook results, **widgets** (interactive input parameters).
- **AI assistance:** **Genie Code** (AI code assistant — write/debug/explain code) and the
  **Data Science Agent** (agent mode that can build an entire notebook — EDA, forecasting, ML —
  from a single prompt).
- **Engineering practices:** interactive debugger, unit testing, modularization, **notebook
  workflows** for orchestration, and **Git folders** for version control.

---

## 11. Lakebase — OLTP (managed Postgres)

- **Lakebase** is a **fully managed PostgreSQL database integrated into Databricks** for
  **real-time transactional applications** sitting next to lakehouse data.
- **OLTP vs OLAP:** Lakebase handles **OLTP** — many small, fast reads/writes that power live
  apps — complementing the lakehouse/warehouse's **OLAP** (analytical) workloads. (This is the
  "transactional vs analytical" distinction in the data-platform story.)
- **Use cases:**
  - **Low-latency app backend** — connect Databricks Apps or any app for transactional workloads.
  - **Serve lakehouse data** — sync Unity Catalog tables into Lakebase for fast app reads.
  - **Store Postgres changes as Delta** — feed downstream pipelines / audit (CDC).
  - **AI/ML** — online **feature store** for served models; **state/memory store** for AI agents
    (LangGraph, OpenAI Agents SDK).
- **Features:** **autoscaling**, **scale-to-zero** (suspend idle compute to save cost),
  **branches** (isolated dev/test copies), **read replicas**, **instant restore** (point-in-time
  branch from history), **high availability** (automatic failover).
- **Access:** built-in SQL Editor, visual table editor, `psql`, and any standard Postgres driver;
  registered in **Unity Catalog** for unified governance.

---

## 12. Developer tools — APIs, CLI, SDKs, IaC

An ecosystem for building integrations and **programmatically managing** Databricks resources.

- **Databricks CLI** — command-line control, shell scripting, direct REST API calls, auth
  profile management, syncing code from an IDE to the workspace.
- **Declarative Automation Bundles** (a CLI feature; formerly **Databricks Asset Bundles**) —
  define Databricks resources (jobs, pipelines, etc.) **as code in YAML** and **co-version,
  co-author, co-deploy them as one unit**. The standard way to apply **CI/CD** to data projects.
  *(This is where YAML + jobs-as-code live in the Databricks story.)*
- **Databricks Terraform provider** — **infrastructure as code**: create/administer workspaces &
  metastores, enforce permissions, ensure environment portability and disaster recovery.
- **SDKs** — Python, Java, Go, R for app development and custom workflows/web services.
- **IDE integration** — VS Code extension, PyCharm plugin, and **Databricks Connect** (run
  Databricks/serverless workloads from a local IDE).
- **SQL drivers** (ODBC/JDBC, connectors) — run SQL from external client apps.
- **REST API** — programmatic access to almost all Databricks resources (account + workspace).

---

## 13. Administration

- **Two admin levels:** **account admin** (whole account) vs **workspace admin** (one workspace).
- **Account console** — manage subscription, **billing**, serverless quotas, account-level
  settings; deploy and configure **workspaces** (serverless or traditional) and previews.
- **Identity & access management** — users, groups, and service principals managed at account &
  workspace level via **SCIM provisioning** and identity federation (Microsoft Entra ID).
- **Compute policies** — constrain compute configuration, cap resource usage, and standardize
  environments across teams.
- **Monitoring & governance:**
  - **System tables** (the `system` catalog) — queryable audit logs, **billable usage**, lineage,
    and operational data.
  - **Audit logs** — record of auditable account events.
  - **Cost management** — usage dashboards, **usage/budget policies**, billing analysis (DBUs).

---

## 14. Security & compliance

- **Authentication & access control** — multiple auth methods, SSO with **just-in-time (JIT)**
  user provisioning, **personal access token** management, and fine-grained **ACLs** on workspace
  objects (layered with Unity Catalog for data).
- **Networking** — private connectivity (**Azure Private Link**) for front-end access,
  **serverless egress control** / network policies, storage firewalls for serverless, and
  **VNet injection** (deploy classic compute in your own virtual network).
- **Data security & encryption** — encryption **at rest** and **in transit**, **customer-managed
  keys (CMK)**, encryption between cluster worker nodes, and credential redaction from logs.
- **Secret management** — store credentials securely as **secrets** and reference them in Spark
  config / environment variables (never hard-code).
- **Compliance** — a **compliance security profile** for regulatory frameworks, **enhanced
  security monitoring** (anomaly/threat detection), and specific guidance for standards such as
  **HIPAA**.

---

## Appendix — Mapping research → the 8 Databricks story modules

A suggested mapping from this research to the planned content modules (see
[`content.md`](content.md)). Each module pulls its main points from the sections above.

| # | Module | Pull mainly from | Key terms to surface |
| --- | --- | --- | --- |
| 1 | The Data Problem | §1 (use cases), §6 (warehousing intro) | data, scale, "drowning in data", insight |
| 2 | Why Traditional Databases Struggled | §1 (lakehouse history), §3 (ACID), §6 (OLAP/OLTP) | data warehouse, proprietary formats, rigid schema, slow at scale |
| 3 | The Rise of Big Data | §1 (lakehouse evolution), §4 (Spark), §5 (cloud) | data lake, volume/velocity/variety, cheap cloud storage, unvalidated |
| 4 | Apache Spark Appears | §4 (Apache Spark) | distributed processing, cluster, driver/executors, DataFrame, in-memory |
| 5 | Databricks Makes Spark Easier | §1, §2 (Lakeflow), §5 (compute), §10 (notebooks) | clusters, serverless, notebooks, managed platform, Databricks Runtime, jobs, YAML bundles |
| 6 | The Lakehouse Idea | §1 (lakehouse), §3 (medallion), §7 (Unity Catalog) | lakehouse = lake + warehouse, single source of truth, medallion, governance |
| 7 | Delta Lake Solves Reliability | §3 (Delta Lake + ACID) | Delta Lake, transaction log, ACID, time travel, schema enforcement, reliable tables |
| 8 | How Companies Use Databricks Today | §2 (ingestion/pipelines/jobs/streaming), §8 (AI), §9 (BI), §11 (apps) | ingestion, pipelines, jobs, batch vs streaming, AI, dashboards, real-time apps |

> Source: Azure Databricks documentation, https://learn.microsoft.com/en-us/azure/databricks/
> (pages dated 2026; captured during this research pass).
