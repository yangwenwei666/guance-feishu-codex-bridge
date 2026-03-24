# Online Deployment Runbook

Use this runbook when the target cluster nodes can pull required images directly.

This path matches the official self-built deployment docs where:

- Kubernetes is still brought up with `sealos`
- launcher is installed from the public Helm repo
- middleware images can be pulled online instead of imported from offline bundles

## 0. Confirm Scope

- Confirm this is a self-built Guance deployment with `launcher`.
- Confirm all required nodes can reach the image sources they need.
- Confirm whether the business stack should run in single-replica / low-resource mode before opening the launcher UI.

Verification:

- Deployment path is explicitly `online`
- Reachability is known, not assumed
- Final hostname plan prefers `*.guance.local`

## 1. Check Host And Cluster Baseline

- Check OS, CPU, RAM, disk, hostname, time sync, firewall, and SELinux state.
- Confirm ports and storage paths are not already occupied by an old Guance install.
- Prepare directories such as `/data/nfs` and `/data/containerd` if the environment needs them.
- Set `vm.max_map_count=262144`.

Verification:

- Nodes are healthy enough for the intended scale
- No obvious conflict with an older Kubernetes or Guance stack
- Outbound access for required registries is confirmed

## 2. Bootstrap Kubernetes With `sealos`

- Follow the official `sealos` self-built path.
- For a new cluster, the docs show the `sealos run` pattern with Kubernetes and Calico images.
- For multi-node extension, add nodes instead of changing the deployment family.

Verification:

- `kubectl get nodes` reports the expected nodes as `Ready`
- Control-plane pods are healthy
- API server remains stable under repeated checks

## 3. Prepare Storage And Ingress

- Deploy storage provisioning suitable for the environment.
- Deploy ingress only after the cluster is stable.
- Keep ingress hosts aligned with the final domain strategy.

Verification:

- PVC provisioning works
- ingress controller is healthy
- `80/443` are served by ingress, not leftover host processes

## 4. Deploy Middleware By Online Pull

- Install middleware after Kubernetes, storage, and ingress are healthy.
- Use the official middleware docs with online image pulls.
- Keep launcher form addresses aligned with in-cluster services.
- The MySQL docs expose the common in-cluster default as `mysql.middleware:3306`.

Verification:

- MySQL, OpenSearch, GuanceDB, Redis, and related services are healthy where required
- No repeated `ImagePullBackOff`
- Core endpoints are reachable from inside the cluster

## 5. Install `launcher`

- Use the official public Helm repo flow for launcher.
- Wait until the launcher deployment and service are healthy before opening the web UI.

Verification:

- `launcher` namespace and deployment are healthy
- launcher API responds
- launcher page is reachable through the planned hostname

## 6. Apply Optional Single-Replica Settings

- Before the browser install starts, ask whether low-resource / single-replica mode should be enabled.
- If yes, patch `launcher-settings` first.
- Keep `debug: True` available when the environment is resource-constrained.
- Do not guess replica overrides if the exact keys are not known; inspect the ConfigMap or use agreed examples.

Verification:

- `launcher-settings` contains the intended low-resource adjustments
- launcher rollout restarted successfully

## 7. Run The Browser Install Flow

- Use browser automation for the launcher wizard.
- Prefer in-cluster middleware addresses.
- Wait for the install workflow to finish fully.

Verification:

- business namespaces and deployments are created
- launcher no longer reports install in progress
- critical business APIs respond through ingress

## 8. Cut Over Final Domains

- Apply final ingress hosts and ConfigMaps before hand-off.
- Prefer `*.guance.local` plus local hosts mapping for the operator machine.

Verification:

- management page works on the final hostname
- front-end page works on the final hostname
- APIs resolve on the final hostname

## 9. Activate And Validate

- Activate the license through launcher APIs after install completion.
- Verify:
  - `workspace/init`
  - `metering/init`
  - `wksp_system`
  - management login
  - front-end login

If validation fails, stop and branch through [pitfalls.md](./pitfalls.md).
