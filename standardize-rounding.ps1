# Script para padronizar todos os botões e inputs da plataforma
$files = Get-ChildItem -Path "c:\Users\acer\Desktop\iziBrokerz INOVADOR\iziBrokerz_inova" -Recurse -Include *.tsx,*.ts -Exclude node_modules

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Buttons: rounded-full -> rounded-full
    $content = $content -replace 'className="([^"]*?)bg-(red|blue|emerald|primary|green|yellow|orange|purple|pink|indigo|gray|slate)-\d{3,4}([^"]*?)rounded-full', 'className="$1bg-$2-$3$4rounded-full'
    
    # Inputs/Selects: rounded-full -> rounded-full  
    $content = $content -replace 'className="([^"]*?)px-\d+\s+py-\d+\s+rounded-full\s+bg-(white|gray|slate)', 'className="$1px-$2 py-$3 rounded-full bg-$4'
    
    # Save
    Set-Content -Path $file.FullName -Value $content
}

Write-Host "Padronização concluída!"
