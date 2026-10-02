# Target adapters

Adapters are boundaries, not authorities.

Responsibilities:
- identify target;
- health/readiness;
- capability projection;
- read state;
- prepare intent/action;
- submit only through the target's admitted control plane;
- readback;
- expose receipt/evidence;
- reconcile/cancel when supported.

Planned:
- vx13: Link only; DESIGN_ONLY until runtime exists.
- manojos3: governed ingress; R0 first.
- oraculo: preferred mediated path through MANOJOS3; advisory only.

Do not copy target-system kernels or registries into this repository.
