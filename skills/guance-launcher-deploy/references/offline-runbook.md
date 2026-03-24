# Offline Deployment Runbook

Use this runbook when cluster nodes cannot pull required images directly.

This path covers both:

- environments that rely on offline image bundles
- environments that preload images into a private registry before install

## 0. Confirm Scope

- Confirm the deployment path is explicitly `offline`.
- Confirm whether images will be consumed from tarballs, from a private registry, or from both.
- Confirm whether the business stack should run in single-replica / low-resource mode before launcher install starts.

Verification:

- Image source is known and prepared
- Registry credentials and addresses are known if a private registry is used
- Final hostname plan prefers `*.guance.local`

## 1. Check Host Baseline

- Check OS, CPU, RAM, disk, hostname, time sync, firewall, and SELinux state.
- Prepare working directories and persistent storage paths.
- Set `vm.max_map_count=262144`.
- Confirm there is enough disk for image import and runtime storage.

Verification:

- Nodes are sized appropriately for the intended topology
- Offline package paths or private registry endpoints are reachable
- No critical port conflicts or leftover broken cluster state

## 2. Prepare Image Sources

- Import offline images or push them into the target private registry first.
- If launcher will pull through a private registry, confirm the corresponding launcher registry settings before install.
- Do not start middleware or launcher installation until image availability is verified.

Verification:

- Required Kubernetes, middleware, launcher, and business images are present
- Pull or load succeeds from the actual runtime environment

## 3. Bootstrap Kubernetes With `sealos`

- Keep `sealos` as the default bootstrap path for self-built environments.
- Use the same overall cluster pattern for single-node and multi-node environments.
- If an earlier failed install left the cluster half-broken, a clean reset is often faster than in-place repair.

Verification:

- `kubectl get nodes` shows the expected nodes as `Ready`
- Control-plane pods are stable
- Static pod image sources match the prepared offline or private-registry path

## 4. Prepare Storage, Ingress, And Middleware

- Bring up storage provisioning and ingress after Kubernetes is healthy.
- Install middleware from the prepared offline or private-registry source.
- Keep the launcher form inputs aligned with the actual in-cluster service names.

Verification:

- PVC provisioning works
- ingress controller is healthy
- middleware pods are `Running`
- no repeated image pull or mount failures

## 5. Install `launcher`

- Make sure launcher images and chart sources are available in the offline path.
- If a private registry is used, confirm launcher can pull from it before opening the UI.

Verification:

- launcher pods are healthy
- launcher API responds
- launcher hostname opens correctly

## 6. Apply Optional Single-Replica Settings

- Ask whether low-resource / single-replica mode should be enabled before running the browser flow.
- If yes, patch `launcher-settings` before clicking through the launcher install wizard.
- Keep `debug: True` available for low-resource troubleshooting when appropriate.

Verification:

- intended low-resource settings are present
- launcher rollout restarted successfully

## 7. Run The Browser Install Flow

- Use browser automation for the launcher wizard.
- Prefer in-cluster middleware addresses.
- Wait until the install workflow completes fully.

Verification:

- business namespaces and deployments are created
- launcher workflow reaches completion
- core business APIs respond

## 8. Cut Over Domains, Activate, And Validate

- Apply final ingress and ConfigMap hostnames.
- Activate the license after install completion.
- Verify:
  - `workspace/init`
  - `metering/init`
  - `wksp_system`
  - management login
  - front-end login

If validation fails, branch through [pitfalls.md](./pitfalls.md).
