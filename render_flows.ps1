$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
function Render($path,$file){
 $doc=[xml](Get-Content -Raw -Encoding UTF8 $path);$cells=@($doc.mxfile.diagram[0].mxGraphModel.root.mxCell|Where-Object{$_.vertex -eq '1'})
 $maxX=($cells|ForEach-Object{[double]$_.mxGeometry.x+[double]$_.mxGeometry.width}|Measure-Object -Maximum).Maximum
 $maxY=($cells|ForEach-Object{[double]$_.mxGeometry.y+[double]$_.mxGeometry.height}|Measure-Object -Maximum).Maximum
 $bmp=New-Object Drawing.Bitmap(2200,1400);$g=[Drawing.Graphics]::FromImage($bmp);$g.Clear([Drawing.Color]::White);$scale=[Math]::Min(2100/$maxX,1300/$maxY)
 $font=New-Object Drawing.Font('Arial',9);$pen=New-Object Drawing.Pen([Drawing.Color]::DarkSlateGray,2);$brush=New-Object Drawing.SolidBrush([Drawing.Color]::FromArgb(255,239,205))
 foreach($c in $cells){$z=$c.mxGeometry;$x=45+[int]([double]$z.x*$scale);$y=45+[int]([double]$z.y*$scale);$w=[int]([double]$z.width*$scale);$h=[int]([double]$z.height*$scale);$rect=New-Object Drawing.Rectangle($x,$y,$w,$h);$g.FillRectangle($brush,$rect);$g.DrawRectangle($pen,$rect);$label=([string]$c.value -replace '<br\s*/?>',"`n" -replace '<[^>]+>',' ' -replace '&amp;','&' -replace '&#39;',"'");$fmt=New-Object Drawing.StringFormat;$fmt.Alignment=[Drawing.StringAlignment]::Center;$fmt.LineAlignment=[Drawing.StringAlignment]::Center;$g.DrawString($label,$font,[Drawing.Brushes]::MidnightBlue,[Drawing.RectangleF]$rect,$fmt)}
 $bmp.Save((Join-Path $PWD $file),[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$bmp.Dispose()
}
Render 'ChicAndHolland_Admin_Operating_Flow.drawio' 'Admin_Operating_Flow_Screenshot.png'
Render 'ChicAndHolland_Retailer_Operating_Flow.drawio' 'Retailer_Operating_Flow_Screenshot.png'
