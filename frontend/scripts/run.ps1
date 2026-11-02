param([ValidateSet('dev','build','test','typecheck','preview')][string]$Action='dev')
$ErrorActionPreference='Stop'
$frontendRoot=Split-Path -Parent $PSScriptRoot
$previousPath=$env:PATH
Push-Location $frontendRoot
try {
 if(-not (Get-Command node -ErrorAction SilentlyContinue)) {
  $bundledNode=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
  if(-not(Test-Path -LiteralPath (Join-Path $bundledNode 'node.exe'))) {throw 'Install Node.js >=22.12 first.'}
  $env:PATH="$bundledNode;$env:PATH"
 }
 if(-not(Test-Path -LiteralPath 'node_modules')){throw 'Install frontend dependencies first: pnpm install --frozen-lockfile'}
 switch($Action){
  'dev' {& '.\node_modules\.bin\vite.cmd' --host 127.0.0.1}
  'typecheck' {& '.\node_modules\.bin\tsc.cmd' -b}
  'build' {& '.\node_modules\.bin\tsc.cmd' -b;if($LASTEXITCODE -ne 0){throw 'TypeScript failed'};& '.\node_modules\.bin\vite.cmd' build}
  'test' {& '.\node_modules\.bin\vitest.cmd' run}
  'preview' {& '.\node_modules\.bin\vite.cmd' preview --host 127.0.0.1 --port 5173 --strictPort}
 }
 if($LASTEXITCODE -ne 0){throw "Frontend command failed: $Action"}
}finally{$env:PATH=$previousPath;Pop-Location}
