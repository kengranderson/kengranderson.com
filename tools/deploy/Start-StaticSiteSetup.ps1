<#
Author: Claude Code for Ken Granderson
Owner: Black Facts Educational Foundation
Canonical source: blackfacts/tools devops/static-site-publish (copy updates from there)
Last Updated: 2026-10-26
Purpose: One-run workstation setup for a static website published by GitHub Actions over SSH.
         Installs missing tools, signs in to GitHub, gets the repository, installs a parked workflow,
         builds and previews the site locally, sets up the deploy key and GitHub settings, and offers
         to turn on dry-run publishing and merge a pull request. Every step is skipped when already done,
         so it is safe to run again. It never turns on live publishing unless -EnableLivePublishing is given.

.EXAMPLE
& C:\Users\Ken\source\repos\Wakanda.Tools\devops\static-site-publish\Start-StaticSiteSetup.ps1 -ProfilePath C:\Users\Ken\source\repos\Wakanda.Tools\devops\static-site-publish\profiles\mysite.json
.EXAMPLE
& C:\Users\Ken\source\repos\Wakanda.Tools\devops\static-site-publish\Start-StaticSiteSetup.ps1 -Repository owner/site -Branch feature-x -PullRequest 1
#>

[CmdletBinding()]
param(
    [string]$ProfilePath,
    [string]$Repository,
    [string]$RepoPath,
    [string]$Branch,
    [int]$PullRequest = 0,
    [string]$PendingWorkflow,
    [string]$CheckCommand = 'npm run check',
    [string]$PreviewBuildCommand = '',
    [string]$ServeCommand = '',
    [string]$PreviewUrl = 'http://localhost:8080/',
    [string]$DeployHost,
    [string]$DeployUser,
    [string]$DeployPath,
    [int]$DeployPort = 22,
    [string]$SiteUrl,
    [string]$VerifyUrl,
    [string]$ControlPanelUrl,
    [string]$DeployAccessScript,
    [switch]$SkipPrerequisites,
    [switch]$SkipPreview,
    [switch]$SkipDeploySetup,
    [switch]$EnableLivePublishing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- Profile: JSON keys (local file or https URL) fill any parameter not given on the command line -
if ($ProfilePath) {
    if ($ProfilePath -match '^https://') {
        $profileData = Invoke-RestMethod -Uri $ProfilePath
        if ($profileData -is [string]) { $profileData = $profileData | ConvertFrom-Json }
    } else {
        $profileData = Get-Content -Raw -LiteralPath $ProfilePath | ConvertFrom-Json
    }
    foreach ($property in $profileData.PSObject.Properties) {
        if ($property.Name -like '_*') { continue }
        if (-not $PSBoundParameters.ContainsKey($property.Name)) {
            if (-not (Get-Variable -Name $property.Name -Scope Local -ErrorAction SilentlyContinue)) {
                throw "Profile key '$($property.Name)' is not a parameter of this script."
            }
            Set-Variable -Name $property.Name -Value $property.Value -Scope Local
        }
    }
}
if (-not $Repository -or $Repository -notmatch '^[^/\s]+/[^/\s]+$') {
    throw 'Repository is required as owner/name (on the command line or in the profile).'
}
$repoName = $Repository.Split('/')[1]
if (-not $RepoPath) {
    $RepoPath = Join-Path (Join-Path (Join-Path $HOME 'source') 'repos') $repoName
}
$onWindows = ($PSVersionTable.PSVersion.Major -lt 6) -or $IsWindows

$summary = New-Object System.Collections.Generic.List[string]
function Write-Step([string]$Text) {
    Write-Host ''
    Write-Host "=== $Text ===" -ForegroundColor Cyan
}
function Add-Summary([string]$Text) {
    $summary.Add($Text)
    Write-Host $Text -ForegroundColor Green
}
function Confirm-Choice([string]$Question) {
    $answer = Read-Host "$Question [y/N]"
    return ($answer -match '^(y|yes)$')
}

# Runs a native command, returns exit code and combined output, without PowerShell 5.1 turning stderr into errors.
function Invoke-Native([string]$Exe, [string[]]$ArgumentList) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $Exe @ArgumentList 2>&1 | ForEach-Object { "$_" }
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previous
    }
    return [pscustomobject]@{ Code = $code; Output = ($output -join "`n") }
}
# Runs a native command with its output on screen and stops the script if it fails.
function Invoke-Checked([string]$Exe, [string[]]$ArgumentList) {
    & $Exe @ArgumentList
    if ($LASTEXITCODE -ne 0) { throw "'$Exe $($ArgumentList -join ' ')' failed (exit $LASTEXITCODE)." }
}
function Update-PathFromSystem {
    if ($onWindows) {
        $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
    }
}
function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# --- 1. Tools ----------------------------------------------------------------------------------
if (-not $SkipPrerequisites) {
    Write-Step '1. Tools (Git, Node.js, GitHub CLI, OpenSSH)'
    $packages = @(
        @{ Command = 'git'; Winget = 'Git.Git' },
        @{ Command = 'node'; Winget = 'OpenJS.NodeJS.LTS' },
        @{ Command = 'gh'; Winget = 'GitHub.cli' }
    )
    foreach ($package in $packages) {
        if (Test-Command $package.Command) {
            Write-Host "$($package.Command): found"
            continue
        }
        if (-not (Test-Command 'winget')) {
            throw "$($package.Command) is missing and winget is not available. Install $($package.Winget) by hand, then run this again."
        }
        Write-Host "$($package.Command): installing $($package.Winget)"
        Invoke-Checked 'winget' @('install', '--id', $package.Winget, '--exact', '--silent', '--accept-source-agreements', '--accept-package-agreements')
        Update-PathFromSystem
        if (-not (Test-Command $package.Command)) {
            throw "$($package.Command) was installed but is not on PATH yet. Open a new PowerShell window and run this again."
        }
        Add-Summary "Installed $($package.Winget)."
    }
    $nodeMajor = [int]((Invoke-Native 'node' @('--version')).Output.TrimStart('v').Split('.')[0])
    if ($nodeMajor -lt 22) {
        throw "Node.js $nodeMajor is too old; version 22 or newer is needed. Run: winget upgrade --id OpenJS.NodeJS.LTS"
    }
    foreach ($tool in @('ssh', 'ssh-keygen', 'ssh-keyscan')) {
        if (-not (Test-Command $tool)) {
            throw "$tool is missing. Windows: Settings > System > Optional features > Add 'OpenSSH Client', then run this again."
        }
    }
}

# --- 2. GitHub sign-in -------------------------------------------------------------------------
Write-Step '2. GitHub sign-in'
$status = Invoke-Native 'gh' @('auth', 'status', '--hostname', 'github.com')
if ($status.Code -ne 0) {
    Write-Host 'Not signed in. A browser window will open; approve the sign-in there.'
    Invoke-Checked 'gh' @('auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web', '--scopes', 'workflow')
    Add-Summary 'Signed in to GitHub with the gh CLI.'
} elseif ($PendingWorkflow -and $status.Output -notmatch "'workflow'") {
    Write-Host 'Adding the "workflow" permission (needed to install a GitHub Actions file). Approve it in the browser.'
    Invoke-Checked 'gh' @('auth', 'refresh', '--hostname', 'github.com', '--scopes', 'workflow')
    Add-Summary 'Added the workflow permission to the GitHub sign-in.'
} else {
    Write-Host 'Already signed in.'
}
Invoke-Checked 'gh' @('auth', 'setup-git', '--hostname', 'github.com')

# --- 3. Repository -----------------------------------------------------------------------------
Write-Step "3. Repository $Repository at $RepoPath"
if (-not (Test-Path -LiteralPath $RepoPath)) {
    $parent = Split-Path -Parent $RepoPath
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent | Out-Null }
    Invoke-Checked 'gh' @('repo', 'clone', $Repository, $RepoPath)
    Add-Summary "Cloned $Repository to $RepoPath."
}
Push-Location -LiteralPath $RepoPath
try {
    if ((Invoke-Native 'git' @('rev-parse', '--is-inside-work-tree')).Code -ne 0) {
        throw "$RepoPath exists but is not a Git repository. Move it aside or pass -RepoPath."
    }
    # Find the remote that points at the GitHub repository; a TFS-first checkout gets one named 'github'.
    $remote = $null
    $pattern = 'github\.com[:/]' + [regex]::Escape($Repository) + '(\.git)?/?$'
    foreach ($name in (Invoke-Native 'git' @('remote')).Output.Split("`n")) {
        if (-not $name) { continue }
        $url = (Invoke-Native 'git' @('config', '--get', "remote.$name.url")).Output.Trim()
        if ($url -match $pattern) { $remote = $name; break }
    }
    if (-not $remote) {
        $remote = 'github'
        Invoke-Checked 'git' @('remote', 'add', $remote, "https://github.com/$Repository.git")
        Add-Summary "Added remote '$remote' for GitHub."
    }
    Invoke-Checked 'git' @('fetch', '--quiet', $remote)

    $dirty = (Invoke-Native 'git' @('status', '--porcelain')).Output.Trim()
    if (-not $Branch) {
        $Branch = ((Invoke-Native 'gh' @('repo', 'view', $Repository, '--json', 'defaultBranchRef', '--jq', '.defaultBranchRef.name')).Output).Trim()
    }
    if ((Invoke-Native 'git' @('rev-parse', '--verify', '--quiet', "refs/remotes/$remote/$Branch")).Code -ne 0) {
        $default = ((Invoke-Native 'gh' @('repo', 'view', $Repository, '--json', 'defaultBranchRef', '--jq', '.defaultBranchRef.name')).Output).Trim()
        Write-Host "Branch '$Branch' is not on GitHub (already merged?); using '$default'."
        $Branch = $default
    }
    $current = (Invoke-Native 'git' @('rev-parse', '--abbrev-ref', 'HEAD')).Output.Trim()
    if ($current -ne $Branch) {
        if ($dirty) {
            throw "$RepoPath has uncommitted changes on '$current'. Commit or stash them, then run this again."
        }
        if ((Invoke-Native 'git' @('rev-parse', '--verify', '--quiet', "refs/heads/$Branch")).Code -eq 0) {
            Invoke-Checked 'git' @('switch', '--quiet', $Branch)
        } else {
            Invoke-Checked 'git' @('switch', '--quiet', '--create', $Branch, '--track', "$remote/$Branch")
        }
    }
    if (-not $dirty) {
        Invoke-Checked 'git' @('merge', '--ff-only', '--quiet', "$remote/$Branch")
    }
    Write-Host "On branch $Branch, up to date with $remote."

    # --- 4. Workflow file ------------------------------------------------------------------------
    if ($PendingWorkflow) {
        Write-Step '4. GitHub Actions workflow'
        $source = Join-Path $RepoPath $PendingWorkflow
        $target = Join-Path (Join-Path (Join-Path $RepoPath '.github') 'workflows') (Split-Path -Leaf $PendingWorkflow)
        if (Test-Path -LiteralPath $target) {
            Write-Host 'Already installed.'
        } elseif (-not (Test-Path -LiteralPath $source)) {
            Write-Host "Nothing to install ($PendingWorkflow not found)."
        } elseif ($dirty) {
            throw 'Uncommitted changes in the repository; commit or stash them so the workflow can be committed on its own.'
        } else {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
            $relativeTarget = '.github/workflows/' + (Split-Path -Leaf $PendingWorkflow)
            Invoke-Checked 'git' @('mv', $PendingWorkflow, $relativeTarget)
            $parkedFolder = Split-Path -Parent $source
            $leftovers = @(Get-ChildItem -LiteralPath $parkedFolder -Force)
            if ($leftovers.Count -eq 1 -and $leftovers[0].Name -eq 'README.md') {
                Invoke-Checked 'git' @('rm', '--quiet', (Join-Path (Split-Path -Parent $PendingWorkflow) 'README.md'))
            }
            Invoke-Checked 'git' @('commit', '--quiet', '-m', "Install $(Split-Path -Leaf $PendingWorkflow) GitHub Actions workflow")
            Invoke-Checked 'git' @('push', '--quiet', $remote, "HEAD:$Branch")
            Add-Summary "Installed $relativeTarget and pushed it to $Branch."
        }
    }

    # --- 5. Build and preview --------------------------------------------------------------------
    if (-not $SkipPreview) {
        Write-Step '5. Build and local preview'
        if (Test-Path -LiteralPath (Join-Path $RepoPath 'package.json')) {
            Invoke-Checked 'npm' @('ci', '--no-audit', '--no-fund')
        }
        foreach ($command in @($CheckCommand, $PreviewBuildCommand)) {
            if (-not $command) { continue }
            Write-Host "> $command"
            Invoke-Expression $command
            if ($LASTEXITCODE -ne 0) { throw "'$command' failed (exit $LASTEXITCODE). Fix the errors above, then run this again." }
        }
        Add-Summary 'Validated and built the site.'
        if ($ServeCommand) {
            $shell = if ($PSVersionTable.PSVersion.Major -ge 6) { 'pwsh' } else { 'powershell' }
            $escapedPath = $RepoPath.Replace("'", "''")
            Start-Process -FilePath $shell -ArgumentList @('-NoExit', '-Command', "Set-Location -LiteralPath '$escapedPath'; $ServeCommand") | Out-Null
            Start-Sleep -Seconds 3
            try { Start-Process $PreviewUrl | Out-Null } catch { Write-Host "Open $PreviewUrl in a browser." }
            Add-Summary "Opened the local preview at $PreviewUrl (close its PowerShell window to stop it)."
        }
    }
} finally {
    Pop-Location
}

# --- 6. Server publishing ----------------------------------------------------------------------
$secretNames = (Invoke-Native 'gh' @('secret', 'list', '--repo', $Repository)).Output
$deployConfigured = $secretNames -match 'DEPLOY_SSH_KEY'
if (-not $SkipDeploySetup) {
    Write-Step '6. Server publishing (SSH)'
    if ($deployConfigured -and -not $DeployHost) {
        Write-Host 'Deploy secrets already exist in GitHub. Pass -DeployHost (or a profile) to set them up again.'
    } else {
        if (-not $DeployHost) {
            if (Confirm-Choice 'Set up publishing to your web server now? You need its SSH host, username and site folder') {
                $DeployHost = Read-Host 'Server IP or hostname'
                $DeployUser = Read-Host 'SSH username (cPanel username on shared hosting)'
                $DeployPath = Read-Host 'Full path of the folder the site is served from (e.g. /home1/<user>/public_html)'
                $portAnswer = Read-Host 'SSH port [22]'
                if ($portAnswer) { $DeployPort = [int]$portAnswer }
            }
        }
        if ($DeployHost) {
            if (-not $DeployUser -or -not $DeployPath) { throw 'DeployUser and DeployPath are required with DeployHost.' }
            if (-not $DeployAccessScript) {
                $candidates = @()
                if ($PSScriptRoot) { $candidates += (Join-Path $PSScriptRoot 'Initialize-DeployAccess.ps1') }
                $candidates += @(Get-ChildItem -LiteralPath $RepoPath -Recurse -Filter 'Initialize-DeployAccess.ps1' -ErrorAction SilentlyContinue |
                    Where-Object { $_.FullName -notmatch '[\\/]node_modules[\\/]' } | ForEach-Object { $_.FullName })
                $DeployAccessScript = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
            }
            if (-not $DeployAccessScript) { throw 'Initialize-DeployAccess.ps1 not found; pass -DeployAccessScript.' }

            $accessArgs = @{ Repository = $Repository; DeployHost = $DeployHost; DeployUser = $DeployUser; DeployPath = $DeployPath; Port = $DeployPort }
            if ($SiteUrl) { $accessArgs.SiteUrl = $SiteUrl }
            if ($VerifyUrl) { $accessArgs.VerifyUrl = $VerifyUrl }
            & $DeployAccessScript @accessArgs
            $keyPath = Join-Path (Join-Path $HOME '.ssh') ($repoName + '_deploy')
            if (Test-Command 'Set-Clipboard') {
                Get-Content -Raw -LiteralPath "$keyPath.pub" | Set-Clipboard
                Write-Host ''
                Write-Host 'The public key is on your clipboard.' -ForegroundColor Yellow
            }
            if ($ControlPanelUrl) { try { Start-Process $ControlPanelUrl | Out-Null } catch { Write-Host "Open $ControlPanelUrl in a browser." } }
            Write-Host 'In the hosting control panel: SSH Access > Manage SSH Keys > Import Key, paste it, save, then click Authorize for that key.' -ForegroundColor Yellow
            Read-Host 'Press Enter when the key is imported AND authorized' | Out-Null
            & $DeployAccessScript @accessArgs -TestConnection -SetGitHub
            $deployConfigured = $true
            Add-Summary "Deploy key authorized and GitHub secrets/variables set for $DeployUser@${DeployHost}:$DeployPath."
        }
    }
}

# --- 7. Switch publishing on -------------------------------------------------------------------
if ($deployConfigured) {
    Write-Step '7. Publishing switches'
    $variables = (Invoke-Native 'gh' @('variable', 'list', '--repo', $Repository)).Output
    if ($variables -match '(?m)^DEPLOY_ENABLED\s+true') {
        Write-Host 'Dry-run publishing is already on (DEPLOY_ENABLED=true).'
    } elseif (Confirm-Choice 'Turn on DRY-RUN publishing? Each merge then shows what would change on the server, without changing it') {
        Invoke-Checked 'gh' @('variable', 'set', 'DEPLOY_ENABLED', '--repo', $Repository, '--body', 'true')
        Add-Summary 'Dry-run publishing is on (DEPLOY_ENABLED=true).'
    }
    if ($EnableLivePublishing) {
        Invoke-Checked 'gh' @('variable', 'set', 'DEPLOY_ENABLED', '--repo', $Repository, '--body', 'true')
        Invoke-Checked 'gh' @('variable', 'set', 'DEPLOY_DRY_RUN', '--repo', $Repository, '--body', 'false')
        Add-Summary 'LIVE publishing is on: merges to the default branch now update the server (DEPLOY_DRY_RUN=false).'
    } elseif ($variables -match '(?m)^DEPLOY_DRY_RUN\s+false') {
        Write-Host 'Live publishing is on (DEPLOY_DRY_RUN=false).'
    } else {
        Write-Host 'Live publishing stays off. Run this again with -EnableLivePublishing after a dry run looks right.'
    }
}

# --- 8. Pull request ---------------------------------------------------------------------------
if ($PullRequest -gt 0) {
    Write-Step "8. Pull request #$PullRequest"
    $state = (Invoke-Native 'gh' @('pr', 'view', "$PullRequest", '--repo', $Repository, '--json', 'state,title', '--jq', '.state + " " + .title')).Output.Trim()
    Write-Host $state
    if ($state -like 'OPEN*') {
        Invoke-Native 'gh' @('pr', 'checks', "$PullRequest", '--repo', $Repository) | ForEach-Object { Write-Host $_.Output }
        if (Confirm-Choice "Merge pull request #$PullRequest now? (With publishing on, this starts a publish)") {
            Invoke-Checked 'gh' @('pr', 'merge', "$PullRequest", '--repo', $Repository, '--merge')
            Add-Summary "Merged pull request #$PullRequest."
        }
    }
}

# --- Summary ------------------------------------------------------------------------------------
Write-Step 'Done'
if ($summary.Count -eq 0) { Write-Host 'Nothing needed doing; everything was already set up.' }
foreach ($line in $summary) { Write-Host "- $line" }
Write-Host "Actions runs: https://github.com/$Repository/actions"
