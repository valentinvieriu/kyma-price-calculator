# Pricing and storage discrepancy tracker

Last validated: **2026-10-21** (Europe/Berlin).

Purpose: consolidate the six reported pricing discrepancies and the additional storage questions found during review. This is an investigation record, not an approved billing specification or an instruction to change prices.

**Application behavior has not been changed.** The calculations below were reproduced by executing the existing calculation functions in memory. No tests, configuration, or application source files were edited.

## Validation baseline

- Calculator commit inspected: `89343a44bdfd9eeb88d771d482500e698d231c81`.
- SAP documentation repository: `SAP-docs/btp-cloud-platform`.
- Documentation revision inspected: `920e76fb4c59fd82c0e6757040c38f89a02f0374`.
- Unless stated otherwise, examples cover **720 hours**, a constant configuration, and **CU**, before conversion into euros. A per-node example uses one node; the extra-disk example explicitly uses four.
- Decimal points are used consistently in this document. Monthly values are rounded to two decimals; calculations use the underlying precision.
- Production metering code, invoices, contractual prices, and provider-specific billing records have **not** been verified. A confirmed disagreement with documentation does not establish which side must change.

### Evidence labels

- **Confirmed mismatch:** the inspected code and the cited documentation disagree.
- **Evidence gap:** the implementation makes an assumption that the reviewed sources do not establish.
- **Needs clarification:** input meaning, units, or aggregation scope must be settled before declaring the calculation wrong.
- **Explanation issue:** wording can mislead even without a proven billing error.

All entries are **open**. Owner and resolution fields are deliberately unassigned.

## Investigation index

| ID  | Topic                                                          | Validation result                                                    | Suggested investigation priority |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| D01 | Extra node disk rounding                                       | Confirmed mismatch                                                   | High                             |
| D02 | Snapshot billing and block rounding                            | Confirmed mismatch; precise replacement formula still open           | High                             |
| D03 | Extra node disk request limit                                  | Confirmed mismatch                                                   | High                             |
| D04 | Compute Optimized 2-vCPU pricing                               | Confirmed mismatch with the published calculation                    | High                             |
| D05 | Memory Intensive pricing and availability                      | Evidence gap                                                         | High                             |
| D06 | Redis rates and the meaning of tier size                       | Confirmed numeric mismatch; likely unit/meaning issue to investigate | High                             |
| D07 | Included operational storage versus application-storage credit | Needs clarification                                                  | High                             |
| D08 | Rounding across multiple persistent volumes or NFS resources   | Needs clarification                                                  | High                             |
| D09 | GB versus GiB                                                  | Needs clarification                                                  | Medium                           |
| D10 | Storage access, classification, and provider scope             | Explanation issues / scope questions                                 | Medium                           |

## Sources

The GitHub links below are pinned so the evidence remains reproducible if the Help Portal changes.

| Reference | Source                                                                                                                                                                                                                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M         | [Service Plans and Metering for Kyma Runtime — source](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/10-concepts/service-plans-and-metering-for-kyma-runtime-c33bb11.md) · [Help Portal](https://help.sap.com/docs/btp/sap-business-technology-platform/service-plans-and-metering-for-kyma-runtime)                                    |
| P         | [Provisioning and Updating Parameters — source](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/50-administration-and-ops/provisioning-and-updating-parameters-in-the-kyma-environment-e2e13bf.md) · [Help Portal](https://help.sap.com/docs/btp/sap-business-technology-platform/provisioning-and-update-parameters-in-kyma-environment) |
| N         | [NFS — source](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/30-development/nfs-4783e94.md) · [Help Portal](https://help.sap.com/docs/btp/sap-business-technology-platform/nfs)                                                                                                                                                         |
| K         | [Kubernetes Persistent Volumes — access modes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes), checked on the validation date                                                                                                                                                                                                                                |

## D01 — Extra node disk rounding

**Status:** Open · **Evidence:** Confirmed mismatch.

**Calculator:** [calculateAdditionalNodeVolumeCosts.ts](../src/calculatorFunctions/storageCosts/calculateAdditionalNodeVolumeCosts.ts) rounds the extra disk **per node**, then multiplies by node count. [costState.ts](../src/state/costState.ts) calculates each pool separately and sums the results.

```text
calculator billed size = nodes × ceil(extraGiBPerNode / 32) × 32
```

**Documentation:** [M, storage example](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/10-concepts/service-plans-and-metering-for-kyma-runtime-c33bb11.md#L273-L283) aggregates the extra disk on four nodes before rounding.

| Reproduction: four nodes, 10 extra units of disk per node | Calculator | Documentation example |
| --------------------------------------------------------- | ---------: | --------------------: |
| Requested aggregate                                       |         40 |                    40 |
| Billed size                                               |        128 |                    64 |
| CU for 720 hours                                          |      57.60 |                 28.80 |

For a single pool with identical disk additions, the difference in billed blocks is `n × ceil(x / 32) − ceil(n × x / 32)`, bounded above by `n − 1` blocks. The example above is twice the documented charge. This is a rounding-order disagreement, separate from D09's unit question.

**Investigate:** Is the rounding boundary a node, pool, cluster, or reporting interval? The example establishes a conflict with per-node rounding but does not settle how multiple pools are combined. Obtain an authoritative meter example before changing the formula.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D02 — Snapshot billing and block rounding

**Status:** Open · **Evidence:** Confirmed mismatch; replacement rate/unit requires confirmation.

**Calculator:** [calculateStorageCosts.ts](../src/calculatorFunctions/storageCosts/calculateStorageCosts.ts) passes snapshot size through `toBillableBlocks`. [StorageSection.tsx](../src/components/Configurator/StorageSection.tsx) also gives snapshots the shared block-rounding note and block formula.

**Documentation:** [M, snapshot entry](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/10-concepts/service-plans-and-metering-for-kyma-runtime-c33bb11.md#L279-L281) specifies charging actual snapshot storage, distinct from the persistent-volume block rule.

| Snapshot input | Current billed size | Current CU for 720 hours | Proportional hypothesis, CU for 720 hours |
| -------------- | ------------------: | -----------------------: | ----------------------------------------: |
| 1 GiB          |              32 GiB |                    14.40 |                                      0.45 |
| 33 GiB         |              64 GiB |                    28.80 |                                     14.85 |

The final column is **illustrative, not a verified production price**: it assumes the current `0.02 / 32` rate applies proportionally to the entered snapshot quantity. The documentation establishes the rounding conflict; confirm the exact snapshot rate, GB/GiB mapping, reported size field, and time treatment separately.

Accepting arbitrary whole-GiB input exposed this difference; it did not introduce the underlying assumption. The existing snapshot tests explicitly encode block rounding, so passing them is not evidence that the billing policy is correct.

**Investigate:** Which retained snapshot size is metered? Is it logical size, provider-reported usage, or another metric? Confirm treatment of incremental snapshots and retention. Keep source-volume size, snapshot count, and retained snapshot storage distinct in future copy.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D03 — Extra node disk request limit

**Status:** Open · **Evidence:** Confirmed mismatch.

**Calculator:** [config.json](../src/config.json), `nodeConfig.AdditionalNodeVolume.Max`, is `128`. [PoolPanel.tsx](../src/components/Configurator/PoolPanel.tsx) applies that maximum to the requested extra disk. Typed input supports whole GiB, with buttons incrementing by 32.

**Documentation:** [P, Additional Volume Size](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/50-administration-and-ops/provisioning-and-updating-parameters-in-the-kyma-environment-e2e13bf.md#L155-L209) allows integer requests from 0 to 100. The additional-pool parameter repeats this limit at lines 532–553.

**Impact:** Requests from 101 through 128 are accepted by the calculator but exceed the published provisioning range. A **100-unit request rounding to 128 billed units** is a different matter and must not be confused with permission to request 128.

**Investigate:** Verify the live provisioning schema, any plan/provider exceptions, and whether the documented limit is current. Reconcile UI bounds, imported configurations, and billing-size labels together if a change is later approved.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D04 — Compute Optimized 2-vCPU pricing

**Status:** Open · **Evidence:** Confirmed mismatch with the published calculation; actual billed rate not independently established.

**Calculator:** [config.json](../src/config.json) assigns the 2-vCPU Compute Optimized size `computeUnits: 2` and a machine factor of 1. [calculateNodeConfigCosts.ts](../src/calculatorFunctions/nodeConfigCosts/calculateNodeConfigCosts.ts) multiplies that by `0.12`, producing `0.24 CU/h`.

**Documentation:** [M, node calculation](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/10-concepts/service-plans-and-metering-for-kyma-runtime-c33bb11.md#L173-L253) applies its general-purpose calculation to compute-intensive types; the 2-vCPU row evaluates to `0.36 CU/h`.

| One 2-vCPU Compute Optimized node | Calculator | Published calculation |
| --------------------------------- | ---------: | --------------------: |
| CU/h                              |       0.24 |                  0.36 |
| CU for 720 hours                  |     172.80 |                259.20 |

The calculator is 86.40 CU lower per node for 720 hours, or **33.33% below** the published value. Conversely, the published value is 50% above the calculator.

**Correction to the initial report:** the explicitly tabulated 4-, 8-, 16-, and 32-vCPU rates match. The page ends that table with an ellipsis; 48 and 64 vCPU follow the calculator's same linear pattern but are not individually verified by explicit rows in this source.

**Investigate:** Does the 2-vCPU premium apply to every machine family, or is the documentation's compute-intensive statement too broad? Obtain a meter sample or approved tariff for an actual 2-vCPU compute-intensive instance.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D05 — Memory Intensive pricing and availability

**Status:** Open · **Evidence:** Evidence gap, not a proven pricing error.

**Calculator:** [config.json](../src/config.json) exposes seven Memory Intensive sizes, 2–64 vCPU and 16–512 GiB RAM. Prices are `vCPU × 0.12 CU/h`, with no separate memory multiplier; for example, 2 vCPU / 16 GiB is `0.24 CU/h`.

**Documentation coverage:** neither reviewed source M nor P defines a Memory Intensive tariff or a corresponding machine-family category. Limited repository searches for memory-intensive and memory-optimized Kyma documentation returned no supporting results. This does **not** establish that the machines are unsupported or that their prices are wrong.

**Investigate:** Obtain the approved rate and provisioning support matrix by provider, region, plan, and size. Establish whether compute-intensive wording also covers memory-intensive families and whether a 2-vCPU premium applies. Record evidence for both price and availability.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D06 — Redis rates and tier-size meaning

**Status:** Open · **Evidence:** Confirmed numeric mismatch across all 14 nonzero tiers; likely quantity/meaning issue remains a hypothesis.

**Calculator:** [calculateAdditionalCosts.ts](../src/calculatorFunctions/additionalConfig/calculateAdditionalCosts.ts) calculates `tier.storageGib / 32 × 0.02 × hours`. The units are a storage-equivalent block count times a CU-per-block-hour rate times hours, **not** `CU/CU/month`. [config.json](../src/config.json) supplies values such as 182 for Standard1.

**Documentation:** [M, Redis table](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/10-concepts/service-plans-and-metering-for-kyma-runtime-c33bb11.md#L377-L716) separately lists available capacity, a storage-equivalent cost quantity, and CU/h. Comparison below assumes `Standard1…8` correspond to `S1…8` and `Premium1…6` to `P1…6`; confirm that mapping with the owner.

| Calculator / documentation tier | Calculator CU/h | Documented CU/h | Calculator CU / 720 h | Documented CU / 720 h | Calculator excess |
| ------------------------------- | --------------: | --------------: | --------------------: | --------------------: | ----------------: |
| Standard1 / S1                  |        0.113750 |    0.1027777778 |                 81.90 |                 74.00 |           +10.68% |
| Standard2 / S2                  |        0.227500 |    0.2055555556 |                163.80 |                148.00 |           +10.68% |
| Standard3 / S3                  |        0.595625 |    0.5375000000 |                428.85 |                387.00 |           +10.81% |
| Standard4 / S4                  |        1.196875 |    1.0805555556 |                861.75 |                778.00 |           +10.76% |
| Standard5 / S5                  |        2.370625 |    2.1402777778 |               1706.85 |               1541.00 |           +10.76% |
| Standard6 / S6                  |        4.744375 |    4.2833333333 |               3415.95 |               3084.00 |           +10.76% |
| Standard7 / S7                  |        9.487500 |    8.5652777778 |               6831.00 |               6167.00 |           +10.77% |
| Standard8 / S8                  |       18.970625 |   17.1263888889 |              13658.85 |              12331.00 |           +10.77% |
| Premium1 / P1                   |        1.189375 |    1.0736111111 |                856.35 |                773.00 |           +10.78% |
| Premium2 / P2                   |        2.392500 |    2.1597222222 |               1722.60 |               1555.00 |           +10.78% |
| Premium3 / P3                   |        4.741250 |    4.2805555556 |               3413.70 |               3082.00 |           +10.76% |
| Premium4 / P4                   |        9.487500 |    8.5652777778 |               6831.00 |               6167.00 |           +10.77% |
| Premium5 / P5                   |       18.976875 |   17.1319444444 |              13663.35 |              12335.00 |           +10.77% |
| Premium6 / P6                   |       37.940000 |   34.2513888889 |              27316.80 |              24661.00 |           +10.77% |

**Validated correction:** the difference is systematic but not exactly 10.8% for every tier. It ranges from **10.6757% to 10.8140%** using the published decimal CU/h values. The tiny rounding of those published decimals does not explain the discrepancy.

**Additional finding:** across all 14 tiers, `storageGib` numerically equals the documentation's storage-equivalent-cost-per-hour column multiplied by 720, within less than 0.000004. For S1, `0.25277778 × 720 ≈ 182`. This suggests the stored number is a monthly billing equivalent rather than usable cache GiB; that interpretation needs confirmation. The documentation's approximate available capacity for S1 is 1 GiB, not 182 GiB.

**Impact beyond pricing:** [ServicesSection.tsx](../src/components/Configurator/ServicesSection.tsx) labels the stored quantity as GiB in tier choices; exports and breakdowns also use it as storage size. If the hypothesis is correct, these labels misrepresent usable cache capacity even after a rate-only fix.

**Investigate:** Confirm tariff currency/units, tier mapping, the historical origin of the stored values, and which CU/h column is authoritative. Separate usable capacity from any billing equivalent. Do not apply a blanket percentage adjustment without establishing the underlying rule.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D07 — Included operational storage versus application-storage credit

**Status:** Open · **Evidence:** Needs clarification; existence of an included allocation is confirmed.

**Calculator:** [StorageSection.tsx](../src/components/Configurator/StorageSection.tsx) describes the standard input as application data, starting at zero. [calculateStorageCosts.ts](../src/calculatorFunctions/storageCosts/calculateStorageCosts.ts) deducts one block from that entered quantity. A standard-storage input of 32 GiB therefore costs zero.

**Documentation:** [M, operational storage](https://github.com/SAP-docs/btp-cloud-platform/blob/920e76fb4c59fd82c0e6757040c38f89a02f0374/docs/10-concepts/service-plans-and-metering-for-kyma-runtime-c33bb11.md#L273-L275) confirms an included allocation dedicated to operations. Its existence alone does not resolve whether the entered application quantity should receive that deduction.

**Investigate:** Does the input include operational volumes, only customer/application volumes, or all metered PVs? Does the real meter subtract one allowance from a total that already contains operational resources? If the input excludes the operational allocation, deducting it again could understate cost by one block, 14.40 CU over 720 hours.

**Decision needed:** Define the input before changing the subtraction. Show operational storage separately if the input is intended to mean additional application capacity. Do not mark this accounting treatment as fully matching the docs merely because both mention 32.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

**Explanation update (2026-10-21, no logic change):** The standard-storage input is now labelled "Total volume capacity, including the cluster's 32 GiB", and its description says the first 32 GiB are free and used by the cluster for operational data. This interpretation gives the documented charge under both plausible meter models: if customer volumes are billed in full, `ceil((32 + app) / 32) − 1 = ceil(app / 32)` blocks; if one allowance is subtracted from all volumes, the result is the same. Entering application volumes only would understate by one block under both models. The underlying question remains open until the meter behaviour is confirmed.

## D08 — Rounding across multiple volumes or NFS resources

**Status:** Open · **Evidence:** Aggregation gap; not yet a confirmed meter mismatch.

**Calculator:** Each storage category is a single total. [calculateStorageCosts.ts](../src/calculatorFunctions/storageCosts/calculateStorageCosts.ts) rounds that total once. No list of PV/PVC or NFS resource sizes is available to the calculation.

**Question:** The resource-level block rules in M do not establish every aggregation boundary. Rounding individual resources and rounding their sum are not equivalent.

```text
two 16-unit volumes, rounded individually: 32 + 32 = 64
their combined 32-unit input, rounded once: 32
```

These amounts are before any included operational allowance, which is tracked separately in D07. Apply the same investigation to multiple NFS resources; do not assume they necessarily share the PV aggregation rule.

**Investigate:** Obtain meter examples for two small volumes versus one larger volume, across namespaces and pools where relevant. Confirm whether an input means raw requested total or already-rounded billable total. Only then decide whether a volume-size/count model is required.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D09 — GB versus GiB

**Status:** Open · **Evidence:** Confirmed terminology difference; actual conversion requirement unverified.

**Calculator:** Storage fields and configuration names use GiB. M uses GB for storage block quantities, while P uses a `Gi` provisioning parameter and Redis available-capacity data uses GiB.

**Investigate:** Is GB in the metering text shorthand for GiB, or does the meter use decimal bytes? Confirm byte-to-unit conversion, rounding thresholds, snapshot precision, and the unit shown in consumption reports. Do not silently introduce a conversion factor based only on labels. A binary/decimal unit difference alone does not establish the cause of D06.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

## D10 — Storage access, classification, and provider scope

**Status:** Open · **Evidence:** Explanation issues / scope questions, not verified price errors.

- **Access wording:** [StorageSection.tsx](../src/components/Configurator/StorageSection.tsx) says one workload per standard volume. SAP source N uses a similar simplification. Source K distinguishes single-node read/write access (`ReadWriteOnce`) from single-Pod access (`ReadWriteOncePod`); multiple Pods on one node can share an RWO volume. Avoid presenting the simplified wording as a universal Kubernetes restriction.
- **Classification:** NFS creates PVs and PVCs too, as source N explains. Saying standard storage is storage requested through PVCs does not fully distinguish the categories. Explicitly define which resources belong in each input and avoid counting the same NFS capacity again as standard storage.
- **Provider scope:** Source N lists AWS and Google Cloud NFS implementations. The calculator has no provider selector or eligibility check. Verify the current support matrix before implying universal availability or a uniform provisioning model.
- **Snapshot scope:** Explain retained snapshot storage separately from live-volume capacity and snapshot count. Do not imply that entering a snapshot estimate creates backups or that every storage backend has the same snapshot mechanism.

**Owner:** Unassigned · **Resolution / evidence:** Pending.

**Explanation update (2026-10-21, no logic change):** The storage section now groups inputs as application data (persistent volumes, shared file storage), backups (volume snapshots) and node disks (read-only, set in worker node pools), with these statements:

- Persistent volumes: "Attached to one node at a time"; pods on the same node can share one (source K).
- NFS: shared across nodes, count each shared volume once, needs the Cloud Manager module, available on AWS and Google Cloud (source N).
- Snapshots: "Copies, not live capacity"; Kyma doesn't back up volume data automatically and recommends VolumeSnapshots, supported on AWS, Azure and Google Cloud ([Kyma Environment Backup](https://github.com/SAP-docs/btp-cloud-platform/blob/main/docs/50-administration-and-ops/kyma-environment-backup-ab959cf.md)); NFS isn't covered. Cloud Manager's NFS backup resources are a beta "available only per request for SAP-internal teams" ([AWS](https://github.com/kyma-project/cloud-manager/blob/main/docs/user/resources/04-20-11-aws-nfs-volume-backup.md), [GCP](https://github.com/kyma-project/cloud-manager/blob/main/docs/user/resources/04-20-21-gcp-nfs-volume-backup.md)).
- A hint stating that several volumes are rounded separately was deliberately left out while D08 is open.

The calculator still has no provider selector, so provider scope is stated in text only.

## What currently agrees with the reviewed documentation

These matches are limited to the stated scope; they are not a blanket validation of production billing.

| Item                                | Result / qualification                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| General Purpose node rates          | 2, 4, 8, 16, and 32 vCPU match explicit rows in M. The 48-/64-vCPU values extend the same pattern but are not explicitly tabulated there. |
| Included operational storage        | Its existence and stated size agree. Whether the calculator subtracts it from the right input is D07.                                     |
| Standard block rate                 | The nominal 0.02 CU per 32-unit block per hour agrees, subject to D09.                                                                    |
| Standard/NFS partial-block rounding | Single-resource rounding agrees with the published examples. Multi-resource aggregation remains D08.                                      |
| NFS rate                            | The calculator's 3× multiplier gives 0.06 CU per block per hour, or 43.20 CU for one block over 720 hours.                                |
| Monthly duration assumption         | 720 hours corresponds to the 30-day examples. Actual consumption can differ over time.                                                    |

## Investigation completion checklist

- [ ] Assign an owner and authority for each entry: meter, provisioning service, documentation, or commercial pricing.
- [ ] Obtain production-meter examples for D01, D02, D07, and D08, including resource identifiers, time interval, size units, and rounding stage.
- [ ] Verify the live extra-disk provisioning schema for D03.
- [ ] Obtain family-specific approved node tariffs and availability evidence for D04 and D05.
- [ ] Reconcile all 14 Redis tiers, quantity meanings, and usable-capacity labels for D06.
- [ ] Resolve byte units and precision for D09.
- [ ] Define non-overlapping storage inputs and scope statements for D10.
- [ ] Record for each item whether the resolution belongs in code, config, documentation, explanatory copy, or more than one place.
- [ ] After a resolution is approved, update examples, exports, labels, and the tests that currently encode the disputed assumptions together.

For each resolved item, append the decision date, owner, authoritative evidence, affected provider/plan/version, and any follow-up issue or pull request. Keep the original discrepancy and reproduction so the decision remains auditable.
