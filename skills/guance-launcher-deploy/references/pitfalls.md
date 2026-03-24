# Deployment Pitfalls

## Path Selection

- Do not choose the workflow by `single-node` vs `multi-node` first. Choose `online` vs `offline` first.
- If online image pulls fail because the nodes cannot actually reach the registries, stop and switch to the offline/private-registry path.
- Do not keep retrying an online flow in an environment that is effectively offline.

## Kubernetes Bootstrap

- Keep `sealos` as the default self-built bootstrap unless the user explicitly asks for something else.
- If control-plane static pods cannot come up, check the actual image source first.
- If the host already contains a half-broken cluster and `etcd` / `apiserver` keep flapping, a clean `sealos reset` is often faster than in-place repair.

## Low-Resource Mode

- Single-replica is a launcher configuration choice, not the deployment classification.
- Decide it before the launcher browser flow begins.
- Avoid shrinking critical dependencies blindly. Over-aggressive scale-down can break install, activation, and business startup.

## Domains And Browser Reachability

- Prefer `*.guance.local + /etc/hosts` when DNS conditions are unreliable.
- If business domains fail but direct IP returns ingress default `404`, suspect host mismatch or domain config.
- If the launcher page is unstable from the operator machine, use launcher APIs and cluster-side verification rather than blocking on the browser alone.

## Middleware And Initialization

- If `kodo` or `kodo-inner` logs mention `NSQ no pub available`, check whether low-resource adjustments removed required NSQ components.
- If all business pods are `Running` but `wksp_system` is still missing, treat it as initialization failure.
- If OpenSearch was selected but `main_es_instance.configJSON.provider` was saved as `elastic`, fix it to `opensearch` before retrying `workspace/init`.

## License And Login

- If management page loads but APIs return `ft.InvalidLicense`, activate first.
- If front-end login fails with `ft.Forbidden`, check permission bootstrap and seed data before blaming the account.
- A member record and workspace record are not enough by themselves; verify `biz_permission` and `biz_role_permission` are populated.
- If `workspace/change` or `workspace/account/permissions` returns `ft.Forbidden`, inspect cached member permissions too.
- Validated recovery path:
  - run `reset_init_permissions()`
  - run `refresh_workspace_member_permission_cache([...])`
- Distinguish domain issues, captcha issues, invalid license, and actual credential errors.

## DataWay And DataKit

- Prefer a standard user-facing `DataWay` created from launcher or management UI.
- Do not treat `internal-dataway` as the normal `DataKit` upstream.
- If a public `DataWay` endpoint fails, test the same standard gateway over node IP or private reachability before switching to any internal-only workaround.
- A `404` on `http://<dataway-host>:<port>/` can still mean the `DataWay` process is healthy; combine HTTP response with control-plane version display and TCP reachability.

## MySQL Saturation

- If APIs return `(1040, 'Too many connections')`, check `SHOW VARIABLES LIKE 'max_connections'`, `SHOW STATUS LIKE 'Threads_connected'`, `SHOW STATUS LIKE 'Max_used_connections'`, and `information_schema.processlist`.
- This deployment profile can exhaust the default `151` connections under normal component load.
- Minimal recovery is to raise `max_connections` and persist the setting in the MySQL deployment instead of only applying a temporary session change.
