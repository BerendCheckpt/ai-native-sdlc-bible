<#
.SYNOPSIS
  One-time repository setup: labels and branch protection for main.

.DESCRIPTION
  Run this yourself as a repository admin (not as the Claude bot account),
  after main exists on GitHub. It changes repository settings, so Claude is
  not allowed to run it (.claude/hooks/guard-gh.js blocks protection changes).

.EXAMPLE
  gh auth login   # as BerendCheckpt
  powershell -ExecutionPolicy Bypass -File scripts/setup-branch-protection.ps1
#>
param(
  [string]$Repo = 'BerendCheckpt/ai-native-sdlc-bible',
  [string]$Branch = 'main',
  # This repository has a single engineer, who is also the only approver.
  # GitHub never lets a PR author approve their own PR, so with EnforceAdmins
  # the engineer could not merge PRs opened from their own account. Keep it
  # off: Claude's PRs come from the bot account and still need the engineer's
  # code-owner approval; admin bypass is only for the engineer's own PRs.
  [bool]$EnforceAdmins = $false
)

$ErrorActionPreference = 'Stop'

$labels = @(
  @{ name = 'critical';       color = 'B60205'; description = 'Needs the engineer: new feature, framework divergence or new node modules' },
  @{ name = 'feature';        color = '1D76DB'; description = 'New feature (always critical)' },
  @{ name = 'needs-approval'; color = 'FBCA04'; description = 'Waiting for a human engineer to approve' },
  @{ name = 'approved';       color = '0E8A16'; description = 'Approved by a human engineer; Claude may create the feature branch' },
  @{ name = 'deps-approved';  color = '0E8A16'; description = 'A human engineer approved the new or changed node modules' },
  @{ name = 'governance';     color = '5319E7'; description = 'Changes CLAUDE.md, REVIEW.md, skills, subagents, hooks or CI' },
  @{ name = 'bug';            color = 'D73A4A'; description = 'Something does not work as expected' }
)

foreach ($label in $labels) {
  gh label create $label.name --repo $Repo --color $label.color --description $label.description --force
  if ($LASTEXITCODE -ne 0) { throw "Could not create label $($label.name)" }
}

$protection = @{
  required_status_checks           = @{ strict = $true; contexts = @('unit', 'e2e', 'frameworks', 'deps', 'pr-policy') }
  enforce_admins                   = $EnforceAdmins
  required_pull_request_reviews    = @{
    required_approving_review_count = 1
    require_code_owner_reviews      = $true
    dismiss_stale_reviews           = $true
    # "Last push approved by someone other than the pusher" needs a second
    # engineer, which a single-engineer repository does not have.
    require_last_push_approval      = $false
  }
  restrictions                     = $null
  required_linear_history          = $true
  allow_force_pushes               = $false
  allow_deletions                  = $false
  required_conversation_resolution = $true
} | ConvertTo-Json -Depth 5

$protection | gh api --method PUT "repos/$Repo/branches/$Branch/protection" --input -
if ($LASTEXITCODE -ne 0) { throw 'Could not set branch protection' }

Write-Host "Branch protection is active on $Repo/$Branch. Every merge now needs a code-owner approval and green CI."
