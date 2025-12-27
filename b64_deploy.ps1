$bytes = [System.IO.File]::ReadAllBytes("c:\Users\acer\Desktop\iziBrokerz INOVADOR\iziBrokerz_inova\docker-compose-fixed.yml")
$b64 = [Convert]::ToBase64String($bytes)
$keyPath = "c:\Users\acer\Desktop\ssh-key-2025-12-24 oracle private key2.key"
$remoteCmd = "echo $b64 | base64 -d > evolution/docker-compose.yml"
ssh -i $keyPath -o StrictHostKeyChecking=no ubuntu@152.67.40.239 $remoteCmd
