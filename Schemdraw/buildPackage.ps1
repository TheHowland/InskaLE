$curDir = Get-Location
Set-Location $PSScriptRoot
python -m build
Set-Location $curDir