<#
.SYNOPSIS
Checks whether this computer is ready to work on KenGranderson.com.

.DESCRIPTION
Runs the shared Wakanda Tools validator (blackfacts/tools local-dev/workstation-readiness,
Test-DevEnvironment.ps1) against docs/dev-environment.json: tools and versions, repository
state, packages, a full build, the smoke test, and manual prerequisites. Prints
PASS / FAIL / NOT VERIFIED. Needs a clone of the private blackfacts/tools repository next
to this one (Wakanda.Tools or tools), or -ToolsPath.

Author: Claude Code for Ken Granderson
Owner: Ken Granderson
Last Updated: 2026-10-27

.EXAMPLE
.\scripts\Test-Workstation.ps1
.\scripts\Test-Workstation.ps1 -SkipBuild -Offline
#>
[CmdletBinding()]
param(
    [string]$ToolsPath,
    [switch]$SkipBuild,
    [switch]$Offline,
    [switch]$Strict
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$candidates = @($ToolsPath, $env:WAKANDA_TOOLS_ROOT, (Join-Path (Split-Path -Parent $repo) 'Wakanda.Tools'), (Join-Path (Split-Path -Parent $repo) 'tools')) | Where-Object { $_ }
$validator = $candidates | ForEach-Object { Join-Path $_ 'local-dev/workstation-readiness/Test-DevEnvironment.ps1' } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $validator) {
    Write-Host 'Wakanda Tools not found. Clone it next to this repository (needs access to the private blackfacts/tools):' -ForegroundColor Yellow
    Write-Host ("  git clone https://github.com/blackfacts/tools.git `"{0}`"" -f (Join-Path (Split-Path -Parent $repo) 'Wakanda.Tools'))
    Write-Host 'or pass -ToolsPath <folder>. Without it, follow docs/workstation-setup.md by hand.'
    exit 1
}
$params = @{ Manifest = (Join-Path $repo 'docs/dev-environment.json'); SkipBuild = $SkipBuild; Offline = $Offline; Strict = $Strict }
& $validator @params
exit $LASTEXITCODE
