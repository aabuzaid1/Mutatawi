Add-Type -AssemblyName System.Drawing
$path = (Resolve-Path "public\logo.png").Path
$img = [System.Drawing.Image]::FromFile($path)
$bmp = New-Object System.Drawing.Bitmap $img
$img.Dispose()

$rect = New-Object System.Drawing.Rectangle 0, 0, $bmp.Width, $bmp.Height
$bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$ptr = $bmpData.Scan0
$bytes = [Math]::Abs($bmpData.Stride) * $bmp.Height
$rgbValues = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($ptr, $rgbValues, 0, $bytes)

for ($i = 0; $i -lt $rgbValues.Length; $i += 4) {
    $b = $rgbValues[$i]
    $g = $rgbValues[$i+1]
    $r = $rgbValues[$i+2]
    
    # If the pixel is very dark (close to black)
    if ($r -lt 40 -and $g -lt 40 -and $b -lt 40) {
        $rgbValues[$i+3] = 0 # Set Alpha to 0 (Transparent)
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $ptr, $bytes)
$bmp.UnlockBits($bmpData)

# Save overriding the original
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Successfully removed black background from logo!"
