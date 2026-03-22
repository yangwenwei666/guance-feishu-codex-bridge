# Guance Single-Host Command Skeletons

## 1. Host Baseline

```bash
uname -a
cat /etc/os-release
lscpu
free -h
df -h
getenforce || true
systemctl is-active firewalld || true
timedatectl
hostnamectl
sysctl vm.max_map_count
ss -lntp | egrep ':80|:443|:30001|:30928' || true
```

```bash
mkdir -p /root/guance-install /data/nfs /data/containerd
sysctl -w vm.max_map_count=262144
```

## 2. Kubernetes Bootstrap

```bash
sealos version
sealos run <kubernetes-image> <helm-image> <calico-image> --single
kubectl get nodes -o wide
kubectl get pods -A
```

If the cluster is dirty and repair is not worth it:

```bash
sealos reset --force
```

## 3. Storage And Ingress

```bash
kubectl get sc
kubectl get pods -A | egrep 'nfs|ingress'
ss -lntp | egrep ':80|:443'
```

## 4. Middleware

```bash
kubectl get pods -A | egrep 'mysql|opensearch|guancedb|middleware|nsq'
kubectl get svc -A | egrep 'mysql|opensearch|guancedb|middleware|nsq'
```

## 5. Launcher

```bash
kubectl -n launcher get deploy,pod,svc,cm
kubectl edit cm launcher-settings -n launcher
# set settings.yaml: 'debug: True'
kubectl -n launcher rollout restart deploy launcher
kubectl -n launcher rollout status deploy launcher --timeout=180s
```

## 6. Launcher Install Fallback

```bash
kubectl -n launcher exec deploy/launcher -- curl -sS http://127.0.0.1:5000/api/v1/service/status
kubectl -n launcher exec deploy/launcher -- curl -sS -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:5000/api/v1/workspace/init
kubectl -n launcher exec deploy/launcher -- curl -sS -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:5000/api/v1/metering/init
```

## 7. Domain Validation

```bash
curl -I -H 'Host: df-management.guance.local' http://127.0.0.1
curl -I -H 'Host: dataflux.guance.local' http://127.0.0.1
```

## 8. Post-Install Initialization

```bash
kubectl -n launcher exec deploy/launcher -- curl -sS http://127.0.0.1:5000/api/v1/service/status
kubectl -n middleware exec deploy/mysql -- mysql -h127.0.0.1 -uroot -p<mysql-root-password> \
  -e "select uuid,name,token from df_core.main_workspace;"
kubectl -n middleware exec deploy/mysql -- mysql -h127.0.0.1 -uroot -p<mysql-root-password> \
  -e "select uuid,dbType,configJSON from df_core.main_es_instance\\G"
kubectl -n forethought-kodo logs deploy/kodo-inner --tail=200
```

If OpenSearch is in use but provider was saved as elastic:

```bash
kubectl -n middleware exec deploy/mysql -- mysql -h127.0.0.1 -uroot -p<mysql-root-password> \
  -e "update df_core.main_es_instance set configJSON=JSON_OBJECT('provider','opensearch'), updateAt=UNIX_TIMESTAMP() where uuid='<es-instance-uuid>';"

kubectl -n launcher exec deploy/launcher -- curl -sS -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:5000/api/v1/workspace/init

kubectl -n launcher exec deploy/launcher -- curl -sS -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:5000/api/v1/metering/init
```

## 9. License Activation

```bash
curl -X POST "http://<server-ip>:30001/api/v1/setting/activate" \
  -H "Content-Type: application/json" \
  -d '{
    "ak": "<AK>",
    "sk": "<SK>",
    "dataway_url": "http://<server-ip>:30928?token={}",
    "license": "<base64-license>"
  }'
```

## 10. Permission Repair

```bash
kubectl exec -n forethought-core deploy/front-backend -- sh -lc '
cd /config/cloudcare-forethought-backend &&
PYTHONPATH=/config/cloudcare-forethought-backend python3 tools/fix_script/fix_update_permission.py
'
```

```bash
kubectl exec -n forethought-core deploy/front-backend -- sh -lc '
cd /config/cloudcare-forethought-backend &&
python3 -c "from forethought import create_app; app=create_app(); ctx=app.app_context(); ctx.push(); from forethought.tasks.sync_permission_tasks import refresh_workspace_member_permission_cache; refresh_workspace_member_permission_cache()"
'
```
