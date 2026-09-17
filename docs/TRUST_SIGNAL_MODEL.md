# Trust Signal Decomposition & Free-Rider Elimination Model

## 1. Executive Summary & Problem Statement

In Byzantine-resilient federated learning, traditional defenses rely heavily on **gradient direction and magnitude anomalies** (e.g., Cosine Divergence, Mahalanobis Distance, Median Absolute Deviation). Under such regimes:
1. **Malicious Poisoners and Backdoors** generate divergent, high-norm, or targeted weight updates ($\Delta W_{target}$) that are readily captured by spectral clustering and Layer 2 anomaly detection.
2. **Free-Rider Nodes**, however, participate without performing computational work or utilizing private clinical data. A free-rider submits near-zero updates ($\Delta W \approx \mathbf{0}$, e.g. $\Delta W \times 10^{-3}$) or replays stale historical weights.

### The Correctness Flaw in Prior Architectures
Because the free-rider's gradient magnitude is minimal and its direction exhibits low deviation from the origin, standard spatial anomaly engines assign it an anomaly score near $0.0$. If a composite trust model simply equates low anomaly with high trustworthiness:
$$\text{Penalty} = w_A \cdot A_i \approx 0.0 \implies T_i \approx 100\%$$

The free-rider is mistakenly awarded a **98%+ Trust Score**, receives full model updates, consumes consortium intelligence, and dilutes aggregation weights without contributing any clinical utility.

FedSentinel-Health resolves this fundamental vulnerability by **disentangling Security Cleanliness from Contribution Integrity, Participation Reliability, and Model Performance Gain**.

---

## 2. Multi-Dimensional Signal Architecture

FedSentinel-Health decomposes node evaluation into **four orthogonal sub-signals**:

```
+-------------------------------------------------------------------------------------------------+
|                                 FEDERATION NODE EVALUATION ENGINE                               |
+-------------------------------+---------------------------------+-------------------------------+
|     Security Cleanliness      |      Contribution Integrity     |   Participation Reliability   |
|         S_sec in [0, 100]     |       S_contrib in [0, 100]     |       S_rel in [0, 100]       |
+-------------------------------+---------------------------------+-------------------------------+
| - Layer 0 IEEE-754 validation | - Gradient Norm Ratio (rho)     | - Round completion SLA        |
| - Layer 1 SHA-256 fingerprint | - Expected cohort median norm   | - Hardware TEE attestation    |
| - Layer 2 Spectral anomaly    | - Empirical loss reduction (dL) | - Network latency & jitter    |
| - Layer 3 LOO influence       | - Leave-One-Out Shapley gain    | - Heartbeat & dropout history |
| - Layer 4 Robustness test     | - Free-rider detection gate     | - Historical anomaly EMA      |
+-------------------------------+---------------------------------+-------------------------------+
                                                |
                                                v
                     +-----------------------------------------------------+
                     |             COMPOSITE TRUST ENGINE                  |
                     |  T_i = f(S_sec, S_contrib, S_rel, S_perf, Policy)   |
                     +-----------------------------------------------------+
                                                |
                                                v
                     +-----------------------------------------------------+
                     |             OPERATIONAL WEIGHT ALLOCATOR            |
                     |  q_hat_i = 0.0 if Quarantined OR Free-Rider         |
                     |  q_hat_i = (T_i / 100)^2 / Sum(...) if Trusted      |
                     +-----------------------------------------------------+
```

---

## 3. Mathematical Formalization

### 3.1 Sub-Signal 1: Security Cleanliness ($S_{sec} \in [0, 100]$)
Quantifies whether the node's update is free from adversarial tampering, backdoors, and gradient corruption:
$$S_{sec}^{(i)} = 100 \cdot \left(1 - \min\left(1.0, \, \alpha \cdot A_i + \beta \cdot I_i + \gamma \cdot (1 - R_i)\right)\right)$$

Where:
- $A_i$: Spectral anomaly score from Layer 2 (direction & magnitude outlier score).
- $I_i$: Counterfactual influence penalty from Layer 3 (degradation of holdout validation set).
- $R_i$: Prediction stability score under adversarial perturbation from Layer 4.
- $\alpha = 0.50, \beta = 0.30, \gamma = 0.20$.

### 3.2 Sub-Signal 2: Contribution Integrity ($S_{contrib} \in [0, 100]$)
Quantifies whether the node executed genuine local clinical training and provided non-trivial gradient signal:

#### Step 1: Compute Update Norm and Cohort Median
Let $\Delta W_i \in \mathbb{R}^d$ be the gradient update from client $i$.
$$\|\Delta W_i\|_2 = \sqrt{\sum_{k=1}^d (\Delta W_{i, k})^2}$$
$$\mu_{norm} = \text{median}\left(\{\|\Delta W_j\|_2 : j \in \mathcal{K}_{participating}\}\right)$$

#### Step 2: Calculate Norm Ratio $\rho_i$
$$\rho_i = \frac{\|\Delta W_i\|_2}{\max(\mu_{norm}, 10^{-6})}$$

#### Step 3: Free-Rider Detection & Penalty Threshold
A node is classified as a **Free-Rider** if its update magnitude is negligible compared to active training peers:
$$\text{IsFreeRider}(i) = \begin{cases} 
\text{True} & \text{if } \rho_i < \theta_{fr} \quad (\theta_{fr} = 0.05) \\ 
\text{False} & \text{otherwise} 
\end{cases}$$

#### Step 4: Contribution Score Computation
$$Q_i = \begin{cases}
0.02 \cdot (\rho_i / \theta_{fr}) & \text{if } \text{IsFreeRider}(i) = \text{True} \\
\min\left(1.0, \, 0.5 + 0.5 \cdot \min(1.0, \rho_i) \cdot \max(0.0, 1.0 + \Delta L_i)\right) & \text{otherwise}
\end{cases}$$
$$S_{contrib}^{(i)} = 100 \cdot Q_i$$

When $\text{IsFreeRider}(i) = \text{True}$:
- $S_{contrib}^{(i)} \le 2.0 / 100$.
- Contribution Penalty $P_{contrib} = 1.0 - Q_i \approx 0.98$.

### 3.3 Sub-Signal 3: Participation Reliability ($S_{rel} \in [0, 100]$)
Quantifies temporal consistency, hardware enclave health, and dropout compliance:
$$S_{rel}^{(i)} = 100 \cdot \left(1 - \left[w_{hist} \cdot \text{EMA}(A_i) + w_{tee} \cdot (1 - \text{TEE}_i) + w_{lat} \cdot \min(1.0, \text{Lat}_i / 2000)\right]\right)$$

### 3.4 Composite Trust Score ($T_i \in [0, 100]$)
The overall operational trust score integrates all signals under the active versioned `TrustPolicy`:
$$\text{Penalty}_i = w_A \cdot A_i^{amp} + w_I \cdot I_i + w_C \cdot (1.0 - Q_i) + w_R \cdot (1.0 - R_i) + w_H \cdot H_i$$
$$T_i = \max\left(0.0, \, \min\left(100.0, \, 100.0 \cdot (1.0 - \text{Penalty}_i)\right)\right)$$

Where:
- $w_A + w_I + w_C + w_R + w_H = 1.0$ (Policy Invariant).
- In default policy: $w_A = 0.35, w_I = 0.25, w_C = 0.10, w_R = 0.10, w_H = 0.20$.
- **Crucial Free-Rider Enforcement**: When $\text{IsFreeRider}(i) = \text{True}$, an additional Free-Rider penalty floor $\Omega_{fr} = 0.50$ is enforced:
$$\text{Penalty}_i = \max(\Omega_{fr}, \, \text{Penalty}_i) \implies T_i \le 50.0$$

---

## 4. Operational Node States and Weight Allocation

### Node Classification Matrix

| Security Cleanliness | Contribution Integrity | Node Status | Operational Meaning | Aggregation Weight ($q_i$) |
|:---|:---|:---|:---|:---|
| **High** ($\ge 85$) | **High** ($\ge 75$) | `TRUSTED` | Clean, productive hospital node | Full weight: $(T_i/100)^2$ |
| **High** ($\ge 85$) | **Low** ($< 20$) | `SUSPICIOUS` (`FREE_RIDER`) | Benign, but zero utility. Exploiting federation | **Strictly 0.0000** |
| **Low** ($< 50$) | High / Any | `QUARANTINED` (`POISONER`) | Active malicious attack or corrupted enclave | **Strictly 0.0000** |
| Any | Any (Rounds < 3) | `OBSERVATION` | Cold-start facility being profiled | Capped at 50% max weight |

### Operational Aggregation Weight Allocation
$$q_i = \begin{cases}
0.0 & \text{if } \text{Status}(i) \in \{\text{QUARANTINED}, \text{BLOCKED}\} \text{ or } \text{IsFreeRider}(i) = \text{True} \\
0.5 \cdot \left(\frac{T_i}{100}\right)^2 & \text{if } \text{Status}(i) = \text{OBSERVATION} \\
\left(\frac{T_i}{100}\right)^2 & \text{if } \text{Status}(i) = \text{TRUSTED}
\end{cases}$$

Normalized weight:
$$\hat{q}_i = \frac{q_i}{\sum_{j \in \mathcal{K}} q_j}$$

---

## 5. Non-Fabricated Historical Trust Invariant

### Principle of Persisted Observation
Under no circumstances shall FedSentinel-Health interpolate or fabricate synthetic trust data points:
1. **Persisted Round Observations Only**: A node's trust trajectory chart only renders points for rounds in which the node was selected, submitted an update, and underwent security verification.
2. **Missing Round Representation**: If a hospital did not participate in Round $r$, the database does not contain a record for $(client\_id, r)$. The frontend UI renders a gap or broken connection, explicitly annotated: `"Node idle / did not participate in Round r"`.
3. **No Synthetic Smoothing**: Polynomial smoothing, Bézier curve interpolation, and random walk generation across historical rounds are strictly forbidden in production code.
