Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("c:\Users\abdel\Desktop\Mutatawi website\public\logo_no_black_1772213040221.png")
$size = [math]::Min($img.Width, $img.Height)
$bmp = New-Object System.Drawing.Bitmap 192, 192
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, 192, 192)
$g.SetClip($path)
$srcRect = New-Object System.Drawing.Rectangle([int](($img.Width - $size) / 2), [int](($img.Height - $size) / 2), [int]$size, [int]$size)
$destRect = New-Object System.Drawing.Rectangle(0, 0, 192, 192)
$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$bmp.Save("c:\Users\abdel\Desktop\Mutatawi website\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()
