# Script para remover classes dark: e padronizar cores
# Este script processa todos os arquivos .tsx e .ts

$rootPath = "c:\Users\acer\Desktop\iziBrokerz INOVADOR\iziBrokerz_inova"
$excludePaths = @("node_modules", ".git", "dist", "build")

# Contador de mudanças
$filesChanged = 0
$totalReplacements = 0

# Padrões de substituição
$patterns = @(
    # Cores básicas
    @{ Pattern = 'bg-white dark:bg-slate-(\d+)'; Replacement = 'bg-slate-$1' }
    @{ Pattern = 'bg-white dark:bg-midnight-(\d+)'; Replacement = 'bg-midnight-$1' }
    @{ Pattern = 'bg-gray-(\d+) dark:bg-slate-(\d+)'; Replacement = 'bg-slate-$2' }
    @{ Pattern = 'bg-gray-(\d+) dark:bg-midnight-(\d+)'; Replacement = 'bg-midnight-$2' }
    
    # Textos
    @{ Pattern = 'text-gray-(\d+) dark:text-white'; Replacement = 'text-white' }
    @{ Pattern = 'text-gray-(\d+) dark:text-gray-(\d+)'; Replacement = 'text-gray-$2' }
    @{ Pattern = 'text-gray-(\d+) dark:text-slate-(\d+)'; Replacement = 'text-slate-$2' }
    
    # Bordas
    @{ Pattern = 'border-gray-(\d+) dark:border-slate-(\d+)'; Replacement = 'border-slate-$2' }
    @{ Pattern = 'border-gray-(\d+) dark:border-midnight-(\d+)'; Replacement = 'border-midnight-$2' }
    
    # Hover states
    @{ Pattern = 'hover:bg-gray-(\d+) dark:hover:bg-slate-(\d+)'; Replacement = 'hover:bg-slate-$2' }
    @{ Pattern = 'hover:text-gray-(\d+) dark:hover:text-gray-(\d+)'; Replacement = 'hover:text-gray-$2' }
    
    # Blue para Midnight
    @{ Pattern = 'bg-blue-(\d+)'; Replacement = 'bg-midnight-$1' }
    @{ Pattern = 'text-blue-(\d+)'; Replacement = 'text-midnight-$1' }
    @{ Pattern = 'border-blue-(\d+)'; Replacement = 'border-midnight-$1' }
)

Write-Host "Iniciando limpeza de dark mode..." -ForegroundColor Cyan
Write-Host "Diretório: $rootPath" -ForegroundColor Gray

# Processar arquivos
Get-ChildItem -Path $rootPath -Include *.tsx,*.ts -Recurse | Where-Object {
    $path = $_.FullName
    $exclude = $false
    foreach ($excludePath in $excludePaths) {
        if ($path -like "*\$excludePath\*") {
            $exclude = $true
            break
        }
    }
    -not $exclude
} | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    # Aplicar cada padrão
    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($content, $pattern.Pattern)
        if ($matches.Count -gt 0) {
            $content = $content -replace $pattern.Pattern, $pattern.Replacement
            $fileReplacements += $matches.Count
        }
    }
    
    # Se houve mudanças, salvar arquivo
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesChanged++
        $totalReplacements += $fileReplacements
        Write-Host "✓ $($file.Name): $fileReplacements substituições" -ForegroundColor Green
    }
}

Write-Host "`n=== Resumo ===" -ForegroundColor Cyan
Write-Host "Arquivos modificados: $filesChanged" -ForegroundColor Yellow
Write-Host "Total de substituições: $totalReplacements" -ForegroundColor Yellow
Write-Host "`nLimpeza concluída!" -ForegroundColor Green
