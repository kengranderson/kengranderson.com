<#
Author: Claude Code for Ken Granderson
Owner: Black Facts Educational Foundation
Canonical source: blackfacts/tools devops/static-site-publish (copy updates from there)
Last Updated: 2026-10-26
Purpose: One-time setup for GitHub Actions publishing over SSH. Creates a dedicated deploy key,
         reads the server's host key, optionally tests the connection, and optionally stores the
         GitHub secrets and variables with the gh CLI. Never switches publishing on.

.EXAMPLE
& C:\Users\Ken\source\repos\Wakanda.Tools\devops\static-site-publish\Initialize-DeployAccess.ps1 -Repository owner/site -DeployHost 203.0.113.10 -DeployUser siteuser -DeployPath /home/siteuser/public_html
.EXAMPLE
& C:\Users\Ken\source\repos\Wakanda.Tools\devops\static-site-publish\Initialize-DeployAccess.ps1 -Repository owner/site -DeployHost 203.0.113.10 -DeployUser siteuser -DeployPath /home/siteuser/public_html -SiteUrl https://example.org -TestConnection -SetGitHub
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$DeployHost,
    [Parameter(Mandatory)] [string]$DeployUser,
    [Parameter(Mandatory)] [string]$DeployPath,
    [Parameter(Mandatory)] [ValidatePattern('^[^/\s]+/[^/\s]+$')] [string]$Repository,
    [int]$Port = 22,
    [string]$SiteUrl,
    [string]$VerifyUrl,
    [string]$KeyPath,
    [switch]$TestConnection,
    [switch]$SetGitHub
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name was not found. Install the OpenSSH client (Windows: Settings > Optional features > OpenSSH Client)."
    }
}

if (-not $KeyPath) {
    $KeyPath = Join-Path (Join-Path $HOME '.ssh') (($Repository.Split('/')[1]) + '_deploy')
}

Require-Command ssh-keygen
Require-Command ssh-keyscan
Require-Command ssh

if (-not $DeployPath.StartsWith('/')) {
    throw "DeployPath must be an absolute folder on the server, for example /home/$DeployUser/public_html"
}

$keyDir = Split-Path -Parent $KeyPath
if (-not (Test-Path -LiteralPath $keyDir)) {
    New-Item -ItemType Directory -Path $keyDir | Out-Null
}

if (Test-Path -LiteralPath $KeyPath) {
    Write-Host "Using the existing deploy key $KeyPath"
} else {
    Write-Host "Creating deploy key $KeyPath (no passphrase; it is used only by GitHub Actions)"
    # Windows PowerShell 5.1 drops empty arguments, so it needs a literal pair of quotes.
    $emptyPassphrase = if ($PSVersionTable.PSVersion.Major -lt 7) { '""' } else { '' }
    & ssh-keygen -q -t ed25519 -C "github-actions-deploy@$Repository" -N $emptyPassphrase -f $KeyPath
    if ($LASTEXITCODE -ne 0) { throw 'ssh-keygen failed' }
}
$publicKey = (Get-Content -Raw -LiteralPath "$KeyPath.pub").Trim()

Write-Host "Reading the host key of ${DeployHost}:$Port"
$knownHosts = (& ssh-keyscan -p $Port -t ed25519,rsa,ecdsa $DeployHost 2>$null | Where-Object { $_ -and -not $_.StartsWith('#') }) -join "`n"
if (-not $knownHosts) {
    throw "Could not read a host key from ${DeployHost}:$Port. Check the address, the port, and that SSH access is enabled for the account."
}
$knownHostsFile = "$KeyPath.known_hosts"
Set-Content -LiteralPath $knownHostsFile -Value $knownHosts -NoNewline

Write-Host ''
Write-Host 'Server host key fingerprints (compare with the ones your hosting provider shows, if it shows them):'
& ssh-keygen -l -f $knownHostsFile

Write-Host ''
Write-Host '=== Public key to authorize on the server (cPanel > SSH Access > Manage SSH Keys > Import Key, then Authorize) ==='
Write-Host $publicKey

if ($TestConnection) {
    Write-Host ''
    Write-Host "Testing SSH as $DeployUser@$DeployHost"
    $remote = "command -v rsync >/dev/null && echo 'rsync: available' || echo 'rsync: MISSING'; test -d '$DeployPath' && echo 'folder: exists' || echo 'folder: MISSING'"
    & ssh -p $Port -i $KeyPath -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$knownHostsFile" "$DeployUser@$DeployHost" $remote
    if ($LASTEXITCODE -ne 0) { throw 'SSH login failed. Make sure the public key above is imported AND authorized for this account.' }
}

$variables = [ordered]@{
    DEPLOY_HOST = $DeployHost
    DEPLOY_PORT = "$Port"
    DEPLOY_USER = $DeployUser
    DEPLOY_PATH = $DeployPath
}
if ($SiteUrl) { $variables['SITE_URL'] = $SiteUrl.TrimEnd('/') }
if ($VerifyUrl) { $variables['VERIFY_URL'] = $VerifyUrl }

if ($SetGitHub) {
    Require-Command gh
    Write-Host ''
    Write-Host "Storing secrets and variables in $Repository"
    Get-Content -Raw -LiteralPath $KeyPath | & gh secret set DEPLOY_SSH_KEY --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw 'gh secret set DEPLOY_SSH_KEY failed (run "gh auth login" first)' }
    Get-Content -Raw -LiteralPath $knownHostsFile | & gh secret set DEPLOY_KNOWN_HOSTS --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw 'gh secret set DEPLOY_KNOWN_HOSTS failed' }
    foreach ($name in $variables.Keys) {
        & gh variable set $name --repo $Repository --body $variables[$name]
        if ($LASTEXITCODE -ne 0) { throw "gh variable set $name failed" }
    }
    Write-Host 'Done. Publishing is still OFF. Set DEPLOY_ENABLED=true for dry runs, then DEPLOY_DRY_RUN=false for live publishing (see the static-site-publish README).'
} else {
    Write-Host ''
    Write-Host "=== Add in GitHub: $Repository > Settings > Secrets and variables > Actions ==="
    Write-Host "Secret   DEPLOY_SSH_KEY      = contents of $KeyPath (the private key, never the .pub)"
    Write-Host "Secret   DEPLOY_KNOWN_HOSTS  = contents of $knownHostsFile"
    foreach ($name in $variables.Keys) {
        Write-Host ("Variable {0,-19} = {1}" -f $name, $variables[$name])
    }
    Write-Host 'Or re-run this script with -SetGitHub to store them with the gh CLI.'
}
