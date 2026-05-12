param(
  [string]$BaseUrl = "https://polished-eagle-138.convex.site",
  [string]$ViewerKey = "e2e-smoke",
  [switch]$SeedUsers,
  [switch]$TestAuth
)

$ErrorActionPreference = "Stop"

function Invoke-JsonPost {
  param(
    [string]$Uri,
    [hashtable]$Payload
  )

  $body = $Payload | ConvertTo-Json -Depth 20
  return Invoke-RestMethod -Uri $Uri -Method Post -ContentType "application/json" -Body $body
}

function Write-Case {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Detail
  )

  Write-Output ("[{0}] {1} :: {2}" -f $Status, $Name, $Detail)
}

$results = New-Object System.Collections.Generic.List[object]

try {
  $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
  $results.Add([pscustomobject]@{ kind = "health"; name = "GET /health"; ok = $true; detail = ($health | ConvertTo-Json -Compress -Depth 10) })
  Write-Case "GET /health" "PASS" ($health | ConvertTo-Json -Compress -Depth 10)
} catch {
  $results.Add([pscustomobject]@{ kind = "health"; name = "GET /health"; ok = $false; detail = $_.Exception.Message })
  Write-Case "GET /health" "FAIL" $_.Exception.Message
}

$queryCases = @(
  @{ name = "mobile:status"; args = @{} },
  @{ name = "financials:listAccounts"; args = @{} },
  @{ name = "financials:getCashflow"; args = @{} },
  @{ name = "financials:listCurrencies"; args = @{} },
  @{ name = "planning:getOverview"; args = @{} },
  @{ name = "planning:getBudgets"; args = @{} },
  @{ name = "planning:getDebts"; args = @{} },
  @{ name = "planning:getInstallments"; args = @{} },
  @{ name = "analytics:getStatistics"; args = @{} },
  @{ name = "transactions:listHistory"; args = @{ limit = 5 } }
)

foreach ($case in $queryCases) {
  try {
    $resp = Invoke-JsonPost -Uri "$BaseUrl/mobile/query" -Payload @{
      name = $case.name
      viewerKey = $ViewerKey
      args = $case.args
    }
    $results.Add([pscustomobject]@{ kind = "query"; name = $case.name; ok = $true; detail = ($resp | ConvertTo-Json -Compress -Depth 10) })
    Write-Case $case.name "PASS" ($resp | ConvertTo-Json -Compress -Depth 10)
  } catch {
    $results.Add([pscustomobject]@{ kind = "query"; name = $case.name; ok = $false; detail = $_.Exception.Message })
    Write-Case $case.name "FAIL" $_.Exception.Message
  }
}

$mutationCases = @(
  @{ name = "mobile:bootstrap"; args = @{} },
  @{ name = "financials:createAccount"; args = @{ name = "E2E Account"; institution = "QA Bank"; type = "checking"; openingBalance = 123.45; currencyCode = "USD" } },
  @{ name = "transactions:createIncome"; args = @{ amount = 321.0; category = "Freelance"; note = "E2E income" } },
  @{ name = "transactions:createExpense"; args = @{ amount = 45.5; category = "Food"; note = "E2E expense" } }
)

foreach ($case in $mutationCases) {
  try {
    $resp = Invoke-JsonPost -Uri "$BaseUrl/mobile/mutation" -Payload @{
      name = $case.name
      viewerKey = $ViewerKey
      args = $case.args
    }
    $results.Add([pscustomobject]@{ kind = "mutation"; name = $case.name; ok = $true; detail = ($resp | ConvertTo-Json -Compress -Depth 10) })
    Write-Case $case.name "PASS" ($resp | ConvertTo-Json -Compress -Depth 10)
  } catch {
    $results.Add([pscustomobject]@{ kind = "mutation"; name = $case.name; ok = $false; detail = $_.Exception.Message })
    Write-Case $case.name "FAIL" $_.Exception.Message
  }
}

if ($SeedUsers) {
  try {
    $seedOut = npx convex run seed:seedUsersWithPasswords '{}' --prod
    $results.Add([pscustomobject]@{ kind = "seed"; name = "seed:seedUsersWithPasswords"; ok = $true; detail = ($seedOut -join "`n") })
    Write-Case "seed:seedUsersWithPasswords" "PASS" "created or already linked"
  } catch {
    $results.Add([pscustomobject]@{ kind = "seed"; name = "seed:seedUsersWithPasswords"; ok = $false; detail = $_.Exception.Message })
    Write-Case "seed:seedUsersWithPasswords" "FAIL" $_.Exception.Message
  }
}

if ($TestAuth) {
  $authChecks = @(
    @{ email = "alice@luxurious.trade"; role = "admin" },
    @{ email = "clara@luxurious.trade"; role = "member" }
  )

  foreach ($authCase in $authChecks) {
    try {
      $authOut = node .\scripts\test-auth-signin.mjs $authCase.email password123
      $results.Add([pscustomobject]@{ kind = "auth"; name = "auth:signIn:$($authCase.role)"; ok = $true; detail = ($authOut -join "`n") })
      Write-Case "auth:signIn:$($authCase.role)" "PASS" $authCase.email
    } catch {
      $results.Add([pscustomobject]@{ kind = "auth"; name = "auth:signIn:$($authCase.role)"; ok = $false; detail = $_.Exception.Message })
      Write-Case "auth:signIn:$($authCase.role)" "FAIL" $_.Exception.Message
    }
  }
}

$summary = [pscustomobject]@{
  baseUrl = $BaseUrl
  viewerKey = $ViewerKey
  timestamp = (Get-Date).ToString("s")
  passed = @($results | Where-Object { $_.ok }).Count
  failed = @($results | Where-Object { -not $_.ok }).Count
  results = $results
}

$summary | ConvertTo-Json -Depth 20
