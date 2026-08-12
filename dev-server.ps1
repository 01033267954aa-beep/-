param(
  [int]$Port = 5500,
  [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
$rootPrefix = $resolvedRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
  ".txt" = "text/plain; charset=utf-8"
}

function Get-SafeFilePath {
  param([string]$RequestPath)

  $pathOnly = $RequestPath.Split("?")[0]
  $decodedPath = [System.Uri]::UnescapeDataString($pathOnly)
  if ($decodedPath -eq "/" -or [string]::IsNullOrWhiteSpace($decodedPath)) {
    $decodedPath = "/index.html"
  }

  $relativePath = $decodedPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
  $candidate = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($resolvedRoot, $relativePath))

  if (-not $candidate.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }

  return $candidate
}

function Send-HttpResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [byte[]]$Body,
    [string]$ContentType,
    [bool]$IncludeBody = $true
  )

  $headerText = "HTTP/1.1 $StatusCode $Reason`r`n" +
    "Content-Type: $ContentType`r`n" +
    "Content-Length: $($Body.Length)`r`n" +
    "Cache-Control: no-store`r`n" +
    "Connection: close`r`n`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($IncludeBody -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

$server = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)

try {
  $server.Start()
  Write-Host "Meow Cafe Tycoon is running at http://127.0.0.1:$Port"
  Write-Host "Serving files from $resolvedRoot"
  Write-Host "Press Ctrl+C to stop."

  while ($true) {
    $client = $server.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $buffer = New-Object byte[] 8192
      $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
      if ($bytesRead -le 0) {
        continue
      }

      $requestText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
      $requestLine = ($requestText -split "`r?`n")[0]

      if ($requestLine -notmatch "^(GET|HEAD) ([^ ]+) HTTP/") {
        $body = [System.Text.Encoding]::UTF8.GetBytes("405 Method Not Allowed")
        Send-HttpResponse -Stream $stream -StatusCode 405 -Reason "Method Not Allowed" -Body $body -ContentType "text/plain; charset=utf-8"
        continue
      }

      $method = $matches[1]
      $requestPath = $matches[2]
      $filePath = Get-SafeFilePath -RequestPath $requestPath

      if (-not $filePath -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        Send-HttpResponse -Stream $stream -StatusCode 404 -Reason "Not Found" -Body $body -ContentType "text/plain; charset=utf-8" -IncludeBody ($method -ne "HEAD")
        continue
      }

      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { "application/octet-stream" }
      $body = [System.IO.File]::ReadAllBytes($filePath)
      Send-HttpResponse -Stream $stream -StatusCode 200 -Reason "OK" -Body $body -ContentType $contentType -IncludeBody ($method -ne "HEAD")
    }
    catch {
      try {
        $body = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
        Send-HttpResponse -Stream $stream -StatusCode 500 -Reason "Internal Server Error" -Body $body -ContentType "text/plain; charset=utf-8"
      }
      catch {
        # Ignore connection failures from clients that disconnected early.
      }
    }
    finally {
      $client.Close()
    }
  }
}
finally {
  $server.Stop()
}
