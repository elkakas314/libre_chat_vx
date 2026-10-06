# Resource Tree — CURRENT

Status: `DESIGNED_CURRENT / SOURCE_UI_NOT_IMPLEMENTED / LIVE_NO_VERIFICADO`

## Purpose

Provide one visual hierarchy component that can evolve from a cloud file tree into a generic system/resource navigator without adding a new module for every source.

## Resource node contract

A renderer should be able to consume a bounded node with fields equivalent to:

- stable resource id;
- parent id;
- display name;
- resource kind;
- provider/target id;
- expandable flag;
- freshness/provenance;
- read permissions;
- optional governed actions;
- presentation metadata.

The exact UI representation is not canonical.

## Example sources

```text
Resources
├── Google Drive
│   └── VX13
│       └── APORTACIONES
├── OneDrive
│   └── Projects
├── VX13
│   ├── Madre
│   ├── Switch
│   ├── Manifestator
│   └── Spawner
├── MANOJOS3
│   ├── Capabilities
│   ├── Intent Flows
│   └── Runs
└── LibreChat
    ├── Projects
    ├── Skills
    └── Agents
```

## Loading model

- fetch roots first;
- fetch children only on expand/open;
- cache bounded metadata, not whole provider contents;
- release subscriptions when the branch is not visible;
- fetch file bodies only for preview/search/context/open;
- use pagination for large folders/registries.

## Action boundary

Resource navigation is read-only by default.

Edit/move/delete/apply/cancel/execute must return to the owning provider or target path and its authorization rules.

## Visual evolution

Tree, breadcrumb, split pane, cards or graph views may be changed later without changing adapters if they consume the same resource-node contract.
