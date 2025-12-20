# Script para verificar e instalar Node.js v20
Write-Host "=== Verificação do Node.js ===" -ForegroundColor Cyan

# Verificar versão atual
$nodeVersion = node --version 2>$null
Write-Host "Versão atual: $nodeVersion" -ForegroundColor Yellow

if ($nodeVersion -like "v24.*") {
    Write-Host "`n❌ PROBLEMA: Node.js v24 detectado (incompatível)" -ForegroundColor Red
    Write-Host "`n📥 SOLUÇÃO RÁPIDA:" -ForegroundColor Green
    Write-Host "1. Baixe Node.js v20 LTS de: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    Write-Host "2. Execute o instalador (vai substituir v24)"
    Write-Host "3. Reinicie este terminal"
    Write-Host "4. Execute este script novamente"
    
    # Tentar abrir o link automaticamente
    $download = Read-Host "`nDeseja abrir o link de download agora? (S/N)"
    if ($download -eq "S" -or $download -eq "s") {
        Start-Process "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    }
    
} elseif ($nodeVersion -like "v20.*") {
    Write-Host "`n✅ Node.js v20 detectado! Versão correta!" -ForegroundColor Green
    
    # Limpar e reinstalar dependências
    Write-Host "`n🔧 Limpando e reinstalando dependências..." -ForegroundColor Cyan
    
    Set-Location "c:\Users\Zoé - Pixelhub\Documents\Wenova Geração\Sites\welink\backend"
    
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force node_modules
    }
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force dist
    }
    
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
    
    Write-Host "`n🏗️ Compilando backend..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "`n🚀 Iniciando servidor backend..." -ForegroundColor Green
    npm run start:dev
    
} else {
    Write-Host "`n⚠️ Node.js não encontrado ou versão desconhecida" -ForegroundColor Yellow
    Write-Host "Baixe Node.js v20 de: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
}
