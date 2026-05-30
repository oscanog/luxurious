# RBAC Permissions

Source of truth for member management permissions in the network workspace.

## Default Joined Member

Can do:

- View own allowed network/subtree.
- View joined member directory data allowed by backend.
- Use normal member workspace modules.
- Copy visible member IDs.

Cannot do:

- Add/edit downlines.
- Reassign/delete members.
- Reset passwords/change member emails.
- Promote/demote admins.
- Change direct capacity limits.
- Bypass direct-limit rules.

## Level 1 Admin

Can do:

- Add/edit only owned or self-created members/prospects.
- Manage status/location/investment/socials/assets for owned/self-created members.
- Work inside own allowed branch.

Cannot do:

- Manage unrelated visible members.
- Promote/demote admins.
- Change direct capacity limits.
- Run org ownership backfill.
- Bypass capacity rules.

## Level 2 Admin

Can do:

- Manage any visible member.
- Add/edit downlines under any visible joined member.
- Promote/demote Level 1 admins and members.
- Set per-member direct capacity overrides.
- Run org ownership backfill.
- Bypass default joined-member and Level 1 ownership restrictions.

Cannot do:

- Bypass authentication.
- Mutate missing/invalid records.
- Break protected backend safety checks such as valid parent, no self-parenting, no reconnect into own subtree.
