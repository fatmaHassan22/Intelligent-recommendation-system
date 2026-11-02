param([ValidateSet('dev','build','start','test','migrate','inspect','test:prepare','provision:local')][string]$Action='dev')
$ErrorActionPreference='Stop'
$backendRoot=Split-Path -Parent $PSScriptRoot
Push-Location $backendRoot
$oldEnvFile=$env:ENV_FILE
try {
    $nodeCommand=Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) {
        $bundledNode=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
        if (-not (Test-Path -LiteralPath (Join-Path $bundledNode 'node.exe'))) { throw 'Install Node.js >=22 first.' }
        $env:PATH="$bundledNode;$env:PATH"
    }
    if ($Action -eq 'test') { $phase8Test=Join-Path $backendRoot '.env.phase8b-test.local'; $phase7Test=Join-Path $backendRoot '.env.phase7-test.local'; $phase6Test=Join-Path $backendRoot '.env.phase6-test.local'; $phase5Test=Join-Path $backendRoot '.env.phase5-test.local'; $phase4Test=Join-Path $backendRoot '.env.phase4-test.local'; $env:ENV_FILE=if(Test-Path -LiteralPath $phase8Test){$phase8Test}elseif(Test-Path -LiteralPath $phase7Test){$phase7Test}elseif(Test-Path -LiteralPath $phase6Test){$phase6Test}elseif(Test-Path -LiteralPath $phase5Test){$phase5Test}elseif(Test-Path -LiteralPath $phase4Test){$phase4Test}else{Join-Path $backendRoot '.env.test'} }
    if ($Action -in @('migrate','test:prepare','provision:local')) { $env:ENV_FILE=Join-Path $backendRoot '.env.migrate.local' }
    switch ($Action) {
        'build' { & '.\node_modules\.bin\tsc.cmd' }
        'start' { & node 'dist/server.js' }
        'dev' { & '.\node_modules\.bin\tsx.cmd' watch 'src/server.ts' }
        'test' { & '.\node_modules\.bin\tsx.cmd' --test --test-concurrency=1 'tests/*.test.ts' }
        'migrate' { & '.\node_modules\.bin\tsx.cmd' 'scripts/migrate.ts' }
        'inspect' { & '.\node_modules\.bin\tsx.cmd' 'scripts/inspect.ts' }
        'test:prepare' { & '.\node_modules\.bin\tsx.cmd' 'scripts/prepare-test-db.ts' }
        'provision:local' { & '.\node_modules\.bin\tsx.cmd' 'scripts/provision-local-user.ts' }
    }
    if ($LASTEXITCODE -ne 0) { throw "Backend command failed: $Action" }
} finally { $env:ENV_FILE=$oldEnvFile; Pop-Location }

