param(
  [string]$MySqlPath = "C:\xampp\mysql\bin\mysql.exe",
  [string]$Host = "127.0.0.1",
  [string]$Port = "3306",
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "parsom_brand",
  [string]$InputFile = "USE_YOUR_DATA_HERE"
)

Get-Content $InputFile | & $MySqlPath `
  --host=$Host `
  --port=$Port `
  --user=$User `
  --password=$Password `
  $Database

Write-Host "Restore completed from $InputFile"
