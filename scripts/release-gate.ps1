$ErrorActionPreference = 'Stop'

function Invoke-Step {
  param(
    [string]$Name,
    [ScriptBlock]$Action
  )

  Write-Host "==> $Name"
  & $Action
}

function Invoke-NpmCommand {
  param(
    [string]$Directory,
    [string]$Command
  )

  Push-Location $Directory
  try {
    & npm run $Command
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed: npm run $Command in $Directory"
    }
  } finally {
    Pop-Location
  }
}

function Assert-NoMatches {
  param(
    [string[]]$Patterns,
    [string[]]$Targets,
    [string]$Reason
  )

  foreach ($pattern in $Patterns) {
    $matches = & rg -n -F --hidden --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/.git/**' $pattern $Targets
    if ($LASTEXITCODE -gt 1) {
      throw "Gate failed while scanning pattern: $pattern"
    }
    if ($LASTEXITCODE -eq 0 -and $matches) {
      Write-Host $matches
      throw "Gate failed: $Reason"
    }
  }
}

Invoke-Step "Backend type-check" { Invoke-NpmCommand "backend" "type-check" }
Invoke-Step "Frontend type-check" { Invoke-NpmCommand "frontend" "type-check" }
Invoke-Step "Mobile type-check" { Invoke-NpmCommand "mobile" "type-check" }
Invoke-Step "Backend tests" { Invoke-NpmCommand "backend" "test" }

Invoke-Step "PII scan (known sensitive names)" {
  Assert-NoMatches @("Maria Silva", "Ana Costa", "João Santos", "João Sitoe", "Ana Machel", "João Machel", "João Matos", "Elsa Nhone", "Carlos Muamba") @("docs", "backend", "frontend", "mobile") "PII names still present"
}

Invoke-Step "Mock markers scan (critical front/mobile)" {
  Assert-NoMatches @("MOCKUP", "JobsMockup", "Códigos válidos para demonstração", "example.com/video", "setState(mock", "mockCourses", "mockUsers") @("frontend/src", "mobile/src") "Mock indicators still present in critical UI"
}

Invoke-Step "Security TODO scan" {
  Assert-NoMatches @("TODO: Implement dark mode logic", "TODO: Handle successful report generation", "TODO: Implement download functionality") @("frontend/src", "mobile/src", "backend/src") "Security/production TODOs still present"
}

Write-Host "Release gate passed."
