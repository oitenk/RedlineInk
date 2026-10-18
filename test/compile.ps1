# Compiles one scratch r6\scripts tree against a fresh copy of the vanilla script cache,
# killing the compiler if it has not finished within the timeout (it can stall on some errors).
# -Game is the game's folder.
param([string]$Case, [int]$TimeoutSeconds = 90, [string]$Game = "C:\Games\steamapps\common\Cyberpunk 2077")
$game = $Game
$cache = Join-Path $Case "cache-$(Get-Date -Format 'HHmmssfff')"
New-Item -ItemType Directory -Force $cache | Out-Null
Copy-Item "$game\r6\cache\final.redscripts" "$cache\final.redscripts" -Force
$log = Join-Path $cache "scc.log"
$p = Start-Process -FilePath "$game\engine\tools\scc.exe" `
  -ArgumentList @('-compile', "`"$Case\r6\scripts`"", '-customCacheDir', "`"$cache`"") `
  -RedirectStandardOutput $log -RedirectStandardError "$log.err" -NoNewWindow -PassThru
if (-not $p.WaitForExit($TimeoutSeconds * 1000)) {
  $p.Kill()
  "TIMED OUT after $TimeoutSeconds s (compiler killed)"
}
Get-Content $log, "$log.err" -ErrorAction SilentlyContinue | Where-Object { $_ -notmatch 'cache file is not ours' }
"exit code: $($p.ExitCode)"
