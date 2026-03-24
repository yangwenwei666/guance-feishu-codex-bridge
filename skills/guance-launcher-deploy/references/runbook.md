# Deployment Path Overview

Pick the Guance self-built workflow by **image delivery path**, not by node count.

## Choose `online` When

- cluster nodes can pull required images directly
- official public Helm repo and online middleware images are reachable
- there is no need to preload tarballs first

Then follow [online-runbook.md](./online-runbook.md).

## Choose `offline` When

- cluster nodes cannot pull required images directly
- images must be imported from offline bundles
- images must be pushed to a private registry before install

Then follow [offline-runbook.md](./offline-runbook.md).

## Keep These Separate From The Path Choice

- single-node vs multi-node topology
- low-resource / single-replica launcher settings
- final domain strategy
- post-install activation and validation

Those decisions still matter, but they are secondary to the `online` vs `offline` split.

## Common Milestones

- bootstrap Kubernetes with `sealos`
- prepare storage and ingress
- deploy middleware
- install launcher
- decide whether to enable single-replica mode before browser install
- run the launcher workflow
- activate license
- verify `workspace/init`, `metering/init`, and `wksp_system`
