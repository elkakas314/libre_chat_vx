# SOURCE-only validation. The meaning of each field is explicit;
# values for gate/integration state are not deployment states.
def field_allowed($runtime_enum; $gate_enum):
  {
    "status": $runtime_enum,
    "librechat": $runtime_enum,
    "cloudflare_gateway": $runtime_enum,
    "skill_sync": $runtime_enum,
    "events": $runtime_enum,
    "tailscale_serve": $runtime_enum,
    "targets": (["GATED"] + $gate_enum | unique)
  };

($spec[0].meta.estado_runtime_enum) as $runtime_enum
| ($gaps[0].properties.state.enum) as $gate_enum
| (field_allowed($runtime_enum; $gate_enum)) as $allowed
| ($bootstrap[0].runtime) as $runtime
| if ($runtime | type) != "object" then
    error("BOOTSTRAP_RUNTIME_NOT_OBJECT")
  else
    [($runtime | to_entries[]) as $entry
     | ($allowed[$entry.key]) as $enum
     | select($enum == null or ($enum | index($entry.value)) == null)
     | {field: $entry.key, value: $entry.value, expected: ($enum // "NO_FIELD_CONTRACT")}]
    as $errors
    | if ($errors | length) > 0 then
        error("BOOTSTRAP_RUNTIME_INVALID " + ($errors | tojson))
      else
        true
      end
  end
