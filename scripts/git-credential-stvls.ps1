# Git credential helper: usa el token de GitHub SOLO para este repositorio.
# Lee el token de .github-token en la raíz del repo o de GITHUB_TOKEN en .env.local.
# Uso en este repo: git config --local credential.helper "!powershell -NoProfile -File scripts/git-credential-stvls.ps1"
# Así git push usa la cuenta/token de este proyecto y no mezcla con otros repos.

param([string]$Operation = $args[0])

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
    $dir = Get-Location
    if ($dir.Path) {
        $d = $dir
    } else {
        $d = (Get-Item .).FullName
    }
    while ($d) {
        if (Test-Path (Join-Path $d '.git')) { return $d }
        $d = Split-Path $d -ErrorAction SilentlyContinue
    }
    return $null
}

function Get-Token {
    $root = Get-RepoRoot
    if (-not $root) { return $null }

    $tokenFile = Join-Path $root '.github-token'
    if (Test-Path $tokenFile) {
        $t = (Get-Content $tokenFile -Raw).Trim()
        if ($t) { return $t }
    }

    $envFile = Join-Path $root '.env.local'
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        if ($content -match 'GITHUB_TOKEN\s*=\s*["'']?([^"\s''\r\n]+)["'']?') {
            return $Matches[1].Trim()
        }
    }

    return $null
}

if ($Operation -eq 'get') {
    $token = Get-Token
    if (-not $token) {
        Write-Host 'No se encontró token. Crea .github-token o define GITHUB_TOKEN en .env.local en la raíz del repo.'
        exit 1
    }
    # GitHub acepta cualquier username con PAT; usar 'git' o el usuario de la cuenta
    Write-Host 'username=git'
    Write-Host "password=$token"
} elseif ($Operation -eq 'store' -or $Operation -eq 'erase') {
    # No persistir en este helper; solo leer del archivo del proyecto
    exit 0
} else {
    exit 0
}
