# Test di Persistenza delle Sessioni - PowerShell
Write-Host "🚀 INIZIO TEST DI PERSISTENZA DELLE SESSIONI" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n🧪 TEST: Health Check..." -ForegroundColor Yellow
$healthResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health"
Write-Host "Status: $($healthResponse.StatusCode)" -ForegroundColor Green
Write-Host "Content: $($healthResponse.Content)" -ForegroundColor Green

# Test 2: Recupero sessioni esistenti
Write-Host "`n🧪 TEST: Recupero Sessioni Esistenti..." -ForegroundColor Yellow
$sessionsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/sessions"
$sessions = $sessionsResponse.Content | ConvertFrom-Json
Write-Host "Sessioni trovate: $($sessions.Count)" -ForegroundColor Green

# Test 3: Creazione di una nuova sessione
Write-Host "`n🧪 TEST: Creazione Nuova Sessione..." -ForegroundColor Yellow
$sessionData = @{
    name = "Test Session $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    initialBankroll = 1000
    currentBankroll = 1000
    targetReturn = 10
    strategy = "Kelly Criterion"
    strategySettings = '{"kelly_fraction": 0.25, "min_bet": 10, "max_bet": 100}'
} | ConvertTo-Json

try {
    $createResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/sessions" -Method POST -ContentType "application/json" -Body $sessionData
    $newSession = $createResponse.Content | ConvertFrom-Json
    Write-Host "✅ Sessione creata con successo!" -ForegroundColor Green
    Write-Host "ID: $($newSession.id), Nome: $($newSession.name)" -ForegroundColor Green
    
    # Test 4: Aggiunta di una scommessa
    Write-Host "`n🧪 TEST: Aggiunta Scommessa..." -ForegroundColor Yellow
    $betData = @{
        betNumber = 1
        stake = 50
        odds = 2.0
        potentialWin = 100
        win = $true
        bankrollBefore = 1000
        bankrollAfter = 1050
    } | ConvertTo-Json
    
    $betResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/sessions/$($newSession.id)/bets" -Method POST -ContentType "application/json" -Body $betData
    $betResult = $betResponse.Content | ConvertFrom-Json
    Write-Host "✅ Scommessa aggiunta con successo!" -ForegroundColor Green
    Write-Host "Nuovo Bankroll: €$($betResult.session.currentBankroll)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Errore: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Verifica finale delle sessioni
Write-Host "`n🧪 TEST: Verifica Finale..." -ForegroundColor Yellow
$finalResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/sessions"
$finalSessions = $finalResponse.Content | ConvertFrom-Json
Write-Host "Sessioni totali ora: $($finalSessions.Count)" -ForegroundColor Green

foreach ($session in $finalSessions) {
    Write-Host "  • ID: $($session.id) | Nome: $($session.name) | Bankroll: €$($session.currentBankroll) | Scommesse: $($session.betCount)" -ForegroundColor Cyan
}

Write-Host "`n🎉 TEST COMPLETATO!" -ForegroundColor Green
Write-Host "`n📝 Per testare la persistenza:" -ForegroundColor Yellow
Write-Host "1. Ferma il server (Ctrl+C)" -ForegroundColor White
Write-Host "2. Riavvia con 'npm run dev'" -ForegroundColor White
Write-Host "3. Riesegui questo script" -ForegroundColor White
Write-Host "4. Le sessioni dovrebbero essere ancora presenti!" -ForegroundColor White