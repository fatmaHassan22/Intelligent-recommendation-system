$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.12+ first, then reopen PowerShell.' }
$database = Read-Host 'NEW database name (example: academic_team_demo)'
$password = Read-Host 'Your own LOCAL MySQL root password (hidden)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $payload = @{ database = $database; password = $plain } | ConvertTo-Json -Compress
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = (Get-Command node).Source
    $info.Arguments = '"' + (Join-Path $PSScriptRoot 'setup-local.mjs') + '"'
    $info.UseShellExecute = $false
    $info.RedirectStandardInput = $true
    $info.CreateNoWindow = $true
    $process = [System.Diagnostics.Process]::Start($info)
    $process.StandardInput.Write($payload)
    $process.StandardInput.Close()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) { throw 'Setup stopped. Read the safe error above. Never delete or reset an existing database to retry.' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $plain = $null; $payload = $null; $password = $null
}
