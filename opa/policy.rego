package shms.authz
import future.keywords.if
import future.keywords.in

role_permissions := {
  "gp": {
    "patients": ["read","write"],
    "appointments": ["read","write"],
    "vitals": ["read"],
    "billing": [],
    "inventory": [],
    "audit": [],
  },
  "nurse": {
    "patients": ["read"],
    "appointments": ["read"],
    "vitals": ["read","write"],
    "billing": [],
    "inventory": [],
    "audit": [],
  },
  "admin": {
    "patients": ["read"],
    "appointments": ["read"],
    "vitals": [],
    "billing": ["read","write"],
    "inventory": ["read","write"],
    "audit": [],
  },
  "superadmin": {
    "patients": ["read","write"],
    "appointments": ["read","write"],
    "vitals": ["read","write"],
    "billing": ["read","write"],
    "inventory": ["read","write"],
    "audit": ["read"],
  },
}

default allow := false
allow if {
  action := input.action
  action in role_permissions[input.role][input.resource]
}
