param(
  [string]$MySqlDumpPath = "C:\xampp\mysql\bin\mysqldump.exe",
  [string]$Host = "127.0.0.1",
  [string]$Port = "3306",
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "parsom_brand",
  [string]$BackupDir = "B:\parsom-backups\mysql"
)

if (!(Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutputFile = Join-Path $BackupDir "$Database-$Timestamp.sql"

& $MySqlDumpPath `
  --host=$Host `
  --port=$Port `
  --user=$User `
  --password=$Password `
  --single-transaction `
  --routines `
  --triggers `
  --events `
  $Database > $OutputFile

Write-Host "Backup written to $OutputFile"
