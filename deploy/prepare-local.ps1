# Creates only new local simulation secrets/certificate files. Never overwrites.
$ErrorActionPreference='Stop'
$deployRoot=$PSScriptRoot
foreach($folder in @('secrets','tls')){New-Item -ItemType Directory -Force -Path (Join-Path $deployRoot $folder) | Out-Null}
foreach($name in @('root_password','migrator_password','app_password','csrf_secret')) {
 $path=Join-Path $deployRoot "secrets/$name"
 if(-not(Test-Path -LiteralPath $path)) {
  $bytes=New-Object byte[] 48
  $rng=[System.Security.Cryptography.RandomNumberGenerator]::Create()
  try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
  [IO.File]::WriteAllText($path,([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant())
 }
}
$envPath=Join-Path $deployRoot '.env'
if(-not(Test-Path -LiteralPath $envPath)){Copy-Item -LiteralPath (Join-Path $deployRoot '.env.example') -Destination $envPath}
Write-Host 'Local secrets prepared without printing or replacing values. Restrict secrets/ and tls/ to your account; create TLS certificate using the guide.'
