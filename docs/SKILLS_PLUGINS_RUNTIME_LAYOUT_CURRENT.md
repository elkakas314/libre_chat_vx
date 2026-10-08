# SKILLS AND PLUGINS RUNTIME LAYOUT — CURRENT

## Source tree

```text
libre_chat_vx/
  skills/
    <skill-name>/
      SKILL.md
      references/       optional
      scripts/          optional
      assets/           optional

  plugins/
    vx-nostromo/
      plugin.json
      skills/           optional bundled read-only Skills
      mcp.json          optional
      ai.librechat/
        hooks/
          hooks.json    optional, hooks disabled by default
      scripts/          optional trusted plugin scripts
```

## Canonical source locations

Standalone Skills:
`skills/<skill-name>/SKILL.md`

Agent Plugin source:
`plugins/vx-nostromo/plugin.json`

Extension registry:
`config/extension_registry.current.json`

## Runtime deployment paths in LibreChat

### GitHub Skill Sync — preferred

LibreChat reads SKILL.md from the configured GitHub repository and mirrors Skills as read-only deployment content.

No tunnel and no Worker are required.

### Filesystem deployment Skills

Default runtime directory:
`DEPLOYMENT_SKILLS_DIR=./skill`

Expected runtime layout:
```text
LibreChat/
  skill/
    <skill-name>/
      SKILL.md
      references/
      scripts/
      assets/
```

Adding/removing/changing filesystem deployment Skills requires LibreChat restart.

### Agent Plugins — experimental

Default plugin directory:
`DEPLOYMENT_PLUGINS_DIR=./plugin`

Persistent plugin data:
`DEPLOYMENT_PLUGIN_DATA_DIR=./data/plugins`

Runtime layout:
```text
LibreChat/
  plugin/
    vx-nostromo/
      plugin.json
      skills/
      mcp.json
      ai.librechat/
        hooks/
          hooks.json
  data/
    plugins/
      vx-nostromo/
```

Command hooks are disabled unless `DEPLOYMENT_PLUGIN_HOOKS=true`.
VX baseline keeps hooks disabled.

Standalone deployment Skills take precedence over plugin Skills with the same name.

## What belongs in each extension layer

Native/config:
- ordinary LibreChat settings, permissions, model specs and features.

Skill:
- reusable instructions;
- intent/research/visualization procedure;
- evidence discipline;
- resource navigation;
- target cockpit behavior.

MCP/Action:
- external tools and APIs with a real contract.

Agent Plugin:
- only when Skills + MCP + hooks genuinely belong together as one optional package.

Thin wrapper:
- translation/projection around an existing real capability.

Custom source:
- last resort after the previous layers cannot express the requirement.

## Current VX Skills

Canonical active catalog (10): `config/skills.current.json` is the source of names/roles, not this historical list. The 10 active names are `nostromo-core`, `nostromo-visualization`, `nostromo-research`, `nostromo-event-triage`, `nostromo-evidence-first`, `nostromo-resource-navigation`, `manojos3-nostromo`, `vx13-nostromo`, `cross-target-read` and `nostromo-extension-review`.

Two legacy folders remain on disk: `nostromo-intent-translation` and `nostromo-tool-budget`. They are **not** part of the active SOURCE catalog; no LIVE sync is yet verified. All Skills authority=false.

### Two-stage GitHub Skill Sync source canary

See `deployment/skill-sync/README.md` and two example YAML fragments. Stage 1 scans the full `skills` folder (12 physical roots), stage 2 selects exactly ten canonical root paths with `skillDiscoveryDepth: 0` after an authenticated LIVE canary and rollback-readback. Do not delete legacy files or deploy the second stage automatically. Source proof != LIVE sync.

## Download/import sources

LibreChat does not ship a universal Skill library. Skills can be:
- created/uploaded in LibreChat;
- mounted from the filesystem;
- mirrored from GitHub;
- bundled in an Agent Plugin.

Official companion repositories are listed in LIBRECHAT_INSTALLATION_OPTIONS_CURRENT.md.

No downloaded Skill/plugin becomes trusted, authorized or LIVE merely by being present.
