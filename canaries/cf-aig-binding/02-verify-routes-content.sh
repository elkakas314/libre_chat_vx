#!/usr/bin/env bash
# Objetivo: read each route configuration, deployed version, model nodes and deployment history.
# Prerequisitos: successful 01; curl/jq and same authenticated environment.
# NO hace: create/deploy/delete routes, change models or infer provider quota/cost.
set -euo pipefail
source "$(dirname -- "$0")/lib.sh"
cf_start "02-routes-content"
cf_check_file "01-routes.json"
for profile in "${CF_AIG_ROUTES[@]}"; do
  name="nostromo-$profile"
  route_id="$(cf_route_id "$profile")"
  [[ "$route_id" =~ ^[a-zA-Z0-9_-]+$ ]] || cf_fail "Route missing/invalid: $name"
  cf_get "$CF_AIG_GATEWAY/routes/$route_id" "$CF_AIG_EVIDENCE_DIR/02-$profile-route.json"
  route_file="$CF_AIG_EVIDENCE_DIR/02-$profile-route.json"
  jq -e --arg name "$name" --arg id "$route_id" \
    '.result.name == $name and .result.id == $id and (.result.deployment.version_id|type=="string")' \
    "$route_file" >/dev/null || cf_fail "No deployed version for $name"
  version_id="$(jq -r '.result.deployment.version_id' "$route_file")"
  [[ "$version_id" =~ ^[a-zA-Z0-9_-]+$ ]] || cf_fail "Invalid version ID for $name"
  cf_get "$CF_AIG_GATEWAY/routes/$route_id/versions/$version_id" \
    "$CF_AIG_EVIDENCE_DIR/02-$profile-version.json"
  cf_get "$CF_AIG_GATEWAY/routes/$route_id/deployments" \
    "$CF_AIG_EVIDENCE_DIR/02-$profile-deployments.json"
  jq -e --arg version "$version_id" \
    '.result.version_id == $version and
     ([.result.elements[]? | select(.type=="model")] | length > 0) and
     ([.result.elements[]? | select(.type=="model") |
       select((.properties.provider|type)!="string" or (.properties.provider|length)==0 or
              (.properties.model|type)!="string" or (.properties.model|length)==0)] | length == 0)' \
    "$CF_AIG_EVIDENCE_DIR/02-$profile-version.json" >/dev/null ||
    cf_fail "Missing or invalid provider/model nodes in $name"
  jq -e --arg version "$version_id" \
    '[.data.deployments[]? | select(.version_id==$version)] | length > 0' \
    "$CF_AIG_EVIDENCE_DIR/02-$profile-deployments.json" >/dev/null ||
    cf_fail "Deployed version not corroborated in history: $name"
  jq -n --arg route "dynamic/$name" --arg id "$route_id" --arg version "$version_id" \
    --slurpfile v "$CF_AIG_EVIDENCE_DIR/02-$profile-version.json" \
    '{route:$route,route_id:$id,deployed_version_id:$version,
      models:[$v[0].result.elements[] | select(.type=="model") |
        {provider:.properties.provider,model:.properties.model}]}' \
    > "$CF_AIG_EVIDENCE_DIR/02-$profile-summary.json"
  printf 'READ %s deployed-version present; model nodes discovered\n' "$name"
done
jq -s '{schema:"librechat-vx.cf-aig-route-content.v1",routes:.}' \
  "$CF_AIG_EVIDENCE_DIR"/02-*-summary.json > "$CF_AIG_EVIDENCE_DIR/02-route-models.json"
chmod 600 -- "$CF_AIG_EVIDENCE_DIR/02-route-models.json"
echo 'READ provider/model/version evidence saved outside repo; no quota/cost inference'
