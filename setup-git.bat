@echo off
echo Inicializando repositorio Git...
cd /d "C:\Users\Zoé - Pixelhub\Documents\Wenova Geração\Sites\welink"
git init
echo.
echo Adicionando ficheiros...
git add .
echo.
echo Criando commit inicial...
git commit -m "Initial commit"
echo.
echo Configurando branch main...
git branch -M main
echo.
echo Conectando ao GitHub...
git remote add origin https://github.com/Rolymaya/welink.git
echo.
echo Enviando para GitHub...
git push -u origin main
echo.
echo Concluido! Pressione qualquer tecla para fechar.
pause
