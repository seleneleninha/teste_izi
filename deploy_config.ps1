$yml = Get-Content -Raw "c:\Users\acer\Desktop\iziBrokerz INOVADOR\iziBrokerz_inova\docker-compose-fixed.yml"
$yml = $yml -replace "`r`n", "`n"
$keyPath = "c:\Users\acer\Desktop\ssh-key-2025-12-24 oracle private key2.key"
$remoteCmd = "cat > evolution/docker-compose.yml"
$yml | ssh -i $keyPath -o StrictHostKeyChecking=no ubuntu@152.67.40.239 $remoteCmd
