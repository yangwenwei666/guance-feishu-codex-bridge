# Deployment Command Skeletons

These are command patterns for the Guance self-built deployment flow.

Choose the runbook first:

- [online-runbook.md](./online-runbook.md)
- [offline-runbook.md](./offline-runbook.md)

## Host Baseline

```bash
uname -a
hostnamectl
free -h
df -h
getenforce || true
timedatectl
sysctl vm.max_map_count
sysctl -w vm.max_map_count=262144
ss -lntp | egrep ':80|:443|:30001|:30928' || true
```

## `sealos` Bootstrap

New cluster:

```bash
sealos version
sealos run <kubernetes-image> <cni-image> --masters <master-ip> --passwd '<root-password>'
```

Add nodes:

```bash
sealos add --nodes <node-ip-1>,<node-ip-2>
```

Reset a broken cluster:

```bash
sealos reset
```

Verify:

```bash
kubectl get nodes -o wide
kubectl get pods -A
```

## Launcher Install

Online Helm path:

```bash
helm repo add launcher https://pubrepo.guance.com/chartrepo/launcher
helm repo update
helm install launcher launcher/launcher -n launcher --create-namespace
```

Verify:

```bash
kubectl -n launcher get pods
kubectl -n launcher get svc
kubectl -n launcher get cm launcher-settings -o yaml
```

## Optional Single-Replica Overrides

```bash
kubectl edit cm launcher-settings -n launcher
kubectl -n launcher rollout restart deploy launcher
kubectl -n launcher rollout status deploy launcher
```

## Domain Checks

```bash
kubectl get ingress -A
curl -I http://launcher.guance.local
curl -I http://df-management.guance.local
curl -I http://dataflux.guance.local
```

## Post-Install Validation

```bash
kubectl get pods -A | egrep 'CrashLoopBackOff|Error|ImagePullBackOff|ContainerStatusUnknown' || true
kubectl get ns
kubectl get ingress -A
```

Database checks:

```bash
kubectl exec -it -n middleware <mysql-pod> -- mysql -uroot -p
```

Key things to verify:

- `wksp_system` exists
- `workspace/init` succeeded
- `metering/init` succeeded

## License Activation

See [activation.md](./activation.md).
