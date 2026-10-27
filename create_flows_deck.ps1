$ErrorActionPreference = 'Stop'
$out = Join-Path $PWD 'ChicAndHolland_Operating_Flows.pptx'
$adminPath = Join-Path $PWD 'ChicAndHolland_Admin_Operating_Flow.drawio'
$retailPath = Join-Path $PWD 'ChicAndHolland_Retailer_Operating_Flow.drawio'
$adminXml = [xml](Get-Content -Raw -Encoding UTF8 $adminPath)
$retailXml = [xml](Get-Content -Raw -Encoding UTF8 $retailPath)
function Get-FlowPages($doc) {
  $result = @()
  foreach ($diagram in $doc.mxfile.diagram) {
    $model = $diagram.mxGraphModel
    $cells = @($model.root.mxCell)
    $verts = @($cells | Where-Object { $_.vertex -eq '1' } | ForEach-Object {
      $g=$_.mxGeometry
      [pscustomobject]@{ id=[string]$_.id; label=([string]$_.value -replace '<br\s*/?>',' ' -replace '<[^>]+>',' ' -replace '&amp;','&' -replace '&#39;',"'" -replace '&quot;','"'); x=[double]$g.x; y=[double]$g.y; w=[double]$g.width; h=[double]$g.height; style=[string]$_.style }
    })
    $edges = @($cells | Where-Object { $_.edge -eq '1' } | ForEach-Object {
      $g=$_.mxGeometry; $pts=@(); if($g.Array){$pts=@($g.Array.mxPoint|ForEach-Object{@{x=[double]$_.x;y=[double]$_.y}})}
      [pscustomobject]@{ source=[string]$_.source; target=[string]$_.target; label=([string]$_.value -replace '<[^>]+>',' ' -replace '&amp;','&'); points=$pts; style=[string]$_.style }
    })
    $result += [pscustomobject]@{name=[string]$diagram.name; model=$model; vertices=$verts; edges=$edges}
  }
  return ,$result
}
$adminPages=Get-FlowPages $adminXml; $retailPages=Get-FlowPages $retailXml
$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = -1
$pres=$ppt.Presentations.Add()
$pres.PageSetup.SlideSize=16
$sw=13.333; $sh=7.5
function RGB($hex) { $c=$hex.TrimStart('#'); return [Convert]::ToInt32($c.Substring(4,2),16)*65536 + [Convert]::ToInt32($c.Substring(2,2),16)*256 + [Convert]::ToInt32($c.Substring(0,2),16) }
$navy='#17212b'; $gold='#b69763'; $cream='#f5f2ec'; $white='#ffffff'; $muted='#9ba4ae'
function Add-Text($slide,[string]$text,[double]$x,[double]$y,[double]$w,[double]$h,[double]$size,[string]$color,[bool]$bold=$false) {
  $box=$slide.Shapes.AddTextbox(1,$x*72,$y*72,$w*72,$h*72); $box.TextFrame.TextRange.Text=$text; $box.TextFrame.TextRange.Font.Name='Aptos'; $box.TextFrame.TextRange.Font.Size=$size; $box.TextFrame.TextRange.Font.Color.RGB=(RGB $color); $box.TextFrame.TextRange.Font.Bold=[int]$bold; $box.TextFrame.WordWrap=-1; $box.TextFrame.MarginLeft=3; $box.TextFrame.MarginRight=3; $box.TextFrame.MarginTop=2; $box.TextFrame.MarginBottom=2; return $box
}
function New-Base([string]$eyebrow,[string]$title,[string]$sub='') {
  $s=$pres.Slides.Add($pres.Slides.Count+1,12); $s.Background.Fill.ForeColor.RGB=RGB $navy
  Add-Text $s $eyebrow.ToUpper() .62 .35 12 .22 9 $gold $true|Out-Null
  Add-Text $s $title .62 .72 12 0.58 27 $white $true|Out-Null
  if($sub){Add-Text $s $sub .65 1.36 12 .38 11 $muted $false|Out-Null}
  $line=$s.Shapes.AddShape(1,.62*72,7.12*72,12.1*72,1.2); $line.Fill.ForeColor.RGB=RGB $gold; $line.Line.Visible=0
  Add-Text $s 'CHIC & HOLLAND  &#8226;  OPERATING FLOWS' .62 7.17 8 .16 8 $muted $false|Out-Null
  Add-Text $s ([string]$pres.Slides.Count) 12.38 7.17 .35 .16 8 $gold $false|Out-Null
  return $s
}
function Add-Card($s,$x,$y,$w,$h,$title,$body,$fill='#26333e') {
  $shp=$s.Shapes.AddShape(5,$x*72,$y*72,$w*72,$h*72); $shp.Fill.ForeColor.RGB=RGB $fill; $shp.Line.ForeColor.RGB=RGB '#43505a'; $shp.Line.Weight=1
  Add-Text $s $title ($x+.16) ($y+.14) ($w-.32) .34 13 $gold $true|Out-Null
  Add-Text $s $body ($x+.16) ($y+.56) ($w-.32) ($h-.65) 10.5 $white $false|Out-Null
}
function Add-Arrow($s,$x1,$y1,$x2,$y2,$label='') {
  $ln=$s.Shapes.AddConnector(1,$x1*72,$y1*72,$x2*72,$y2*72); $ln.Line.ForeColor.RGB=RGB $gold; $ln.Line.Weight=1.5; $ln.Line.EndArrowheadStyle=3
  if($label){Add-Text $s $label ((($x1+$x2)/2)-.35) ((($y1+$y2)/2)-.15) .7 .2 8 $gold $true|Out-Null}
}
function Add-FlowSlide($page,$owner,$title,$subtitle) {
  $s=New-Base $owner $title $subtitle
  $vs=$page.vertices; if(!$vs.Count){return}
  $minX=($vs|Measure-Object x -Minimum).Minimum; $maxX=($vs|ForEach-Object{$_.x+$_.w}|Measure-Object -Maximum).Maximum
  $minY=($vs|Measure-Object y -Minimum).Minimum; $maxY=($vs|ForEach-Object{$_.y+$_.h}|Measure-Object -Maximum).Maximum
  $areaX=.72; $areaY=1.94; $areaW=11.9; $areaH=4.85; $scale=[Math]::Min($areaW/($maxX-$minX),$areaH/($maxY-$minY)); $offsetX=$areaX+($areaW-($maxX-$minX)*$scale)/2; $offsetY=$areaY+($areaH-($maxY-$minY)*$scale)/2
  $map=@{}
  foreach($v in $vs){$x=$offsetX+($v.x-$minX)*$scale;$y=$offsetY+($v.y-$minY)*$scale;$w=[Math]::Max(.7,$v.w*$scale);$h=[Math]::Max(.3,$v.h*$scale);$map[$v.id]=@{x=$x;y=$y;w=$w;h=$h};$color=if($v.style -match 'rhombus|fff2cc'){'#fff2cc'}elseif($v.style -match 'f8cecc'){'#f8cecc'}elseif($v.style -match 'dae8fc'){'#dae8fc'}elseif($v.style -match 'e1d5e7'){'#e1d5e7'}elseif($v.style -match 'ffe6cc'){'#ffe6cc'}else{'#d5e8d4'}
    $shapeType=if($v.style -match 'rhombus'){4}else{5};$node=$s.Shapes.AddShape($shapeType,$x*72,$y*72,$w*72,$h*72);$node.Fill.ForeColor.RGB=RGB $color;$node.Line.ForeColor.RGB=RGB '#53616a';$node.Line.Weight=.7
    $font=[Math]::Max(5.5,[Math]::Min(9.0,8.3*$scale));$node.TextFrame.TextRange.Text=$v.label;$node.TextFrame.TextRange.Font.Name='Aptos';$node.TextFrame.TextRange.Font.Size=$font;$node.TextFrame.TextRange.Font.Color.RGB=RGB $navy;$node.TextFrame.TextRange.Font.Bold=if($v.style -match 'fontStyle=1'){ -1 } else { 0 };$node.TextFrame.TextRange.ParagraphFormat.Alignment=2;$node.TextFrame.VerticalAnchor=3;$node.TextFrame.MarginLeft=2;$node.TextFrame.MarginRight=2;$node.TextFrame.MarginTop=1;$node.TextFrame.MarginBottom=1;$node.TextFrame.WordWrap=-1
  }
  foreach($e in $page.edges){if($map.ContainsKey($e.source) -and $map.ContainsKey($e.target)){$a=$map[$e.source];$b=$map[$e.target];Add-Arrow $s ($a.x+$a.w/2) ($a.y+$a.h) ($b.x+$b.w/2) $b.y $e.label}}
}
function Add-Overview($owner,$title,$subtitle,$items,$cols=3){
  $s=New-Base $owner $title $subtitle;$gap=.18;$x0=.65;$y0=1.95;$cardW=(12.02-($cols - 1)*$gap)/$cols;$rows=[Math]::Ceiling($items.Count/$cols);$cardH=[Math]::Min(1.35,(4.95-($rows-1)*$gap)/$rows)
  for($i=0;$i -lt $items.Count;$i++){$row=[Math]::Floor($i/$cols);$col=$i%$cols;$x=$x0+$col*($cardW+$gap);$y=$y0+$row*($cardH+$gap);Add-Card $s $x $y $cardW $cardH $items[$i][0] $items[$i][1]}
}
function Add-ScreenshotSlide($page,$owner,$title,$subtitle,$destFile){
  $w=$page.model.pageWidth;if(!$w){$w=($page.vertices|ForEach-Object{$_.x+$_.w}|Measure-Object -Maximum).Maximum};$h=$page.model.pageHeight;if(!$h){$h=($page.vertices|ForEach-Object{$_.y+$_.h}|Measure-Object -Maximum).Maximum};$w=[double]$w;$h=[double]$h
  if($page.model.page -eq '1' -or $page.model.pageHeight -eq '0'){$h=($page.vertices|ForEach-Object{$_.y+$_.h}|Measure-Object -Maximum).Maximum}
  $svg=@("<svg xmlns='http://www.w3.org/2000/svg' width='$w' height='$h' viewBox='0 0 $w $h'><rect width='100%' height='100%' fill='#ffffff'/>")
  foreach($e in $page.edges){if(!$e.source -or !$e.target){continue};$a=$page.vertices|Where-Object id -eq $e.source|Select-Object -First 1;$b=$page.vertices|Where-Object id -eq $e.target|Select-Object -First 1;if(!$a -or !$b){continue};$x1=$a.x+$a.w/2;$y1=$a.y+$a.h/2;$x2=$b.x+$b.w/2;$y2=$b.y+$b.h/2;$svg+= "<path d='M $x1 $y1 L $x2 $y2' fill='none' stroke='#333' stroke-width='2' marker-end='url(#arrow)'/>"}
  $svg[0]="<svg xmlns='http://www.w3.org/2000/svg' width='$w' height='$h' viewBox='0 0 $w $h'><defs><marker id='arrow' markerWidth='10' markerHeight='8' refX='9' refY='4' orient='auto'><path d='M0,0 L10,4 L0,8 z' fill='#333'/></marker></defs><rect width='100%' height='100%' fill='#ffffff'/>"
  foreach($v in $page.vertices){$fill=if($v.style -match 'rhombus|fff2cc'){'#fff2cc'}elseif($v.style -match 'f8cecc'){'#f8cecc'}elseif($v.style -match 'dae8fc'){'#dae8fc'}elseif($v.style -match 'e1d5e7'){'#e1d5e7'}elseif($v.style -match 'ffe6cc'){'#ffe6cc'}else{'#d5e8d4'};$x=$v.x;$y=$v.y;$rx=if($v.style -match 'rhombus'){'0'}else{'8'};$label=[System.Security.SecurityElement]::Escape($v.label);$lines=$label -split ' ';$svg+= "<rect x='$x' y='$y' width='$($v.w)' height='$($v.h)' rx='$rx' fill='$fill' stroke='#53616a' stroke-width='2'/><foreignObject x='$($x+4)' y='$($y+4)' width='$($v.w-8)' height='$($v.h-8)'><body xmlns='http://www.w3.org/1999/xhtml' style='margin:0;font:16px Arial,sans-serif;color:#17212b;text-align:center;display:flex;align-items:center;justify-content:center;height:100%;overflow:hidden'>$label</body></foreignObject>"}
  $svg+='</svg>';[IO.File]::WriteAllText($destFile,($svg -join "`n"),(New-Object System.Text.UTF8Encoding $false))
  $s=New-Base $owner $title $subtitle
  $img=Join-Path $PWD $destFile;$shape=$s.Shapes.AddPicture($img,0,-1,.65*72,1.9*72,12*72,4.95*72);$shape.Line.Visible=-1;$shape.Line.ForeColor.RGB=RGB '#53616a';$shape.Line.Weight=.7
}
# Title
$s=New-Base 'Operations reference' 'How Chic & Holland runs' 'Admin and retailer workflows at a glance  |  Source diagrams: draw.io'
Add-Text $s 'A practical map of the work behind retailer orders, production, delivery and account management.' .78 2.15 6.0 1.0 20 $white $false|Out-Null
Add-Text $s 'ADMIN' .8 3.7 1 .25 9 $gold $true|Out-Null;Add-Text $s 'Review requests, manage orders, move production forward, ship and maintain the business.' .8 4.05 5.3 .7 14 $white $false|Out-Null
Add-Text $s 'RETAILER' 6.9 3.7 1.3 .25 9 $gold $true|Out-Null;Add-Text $s 'Browse the catalogue, place requests, track decisions and follow orders and payments.' 6.9 4.05 5.3 .7 14 $white $false|Out-Null
# Admin readable summary
Add-Overview 'Admin' 'Admin | daily operating flow' 'Sign in, triage what needs attention, and keep each order moving to fulfilment.' @(
 @('01  Access & dashboard','Sign in at /login. Invalid credentials return to retry. Dashboard shows sales, stage totals and recent orders.'),
 @('02  Retailer requests','Review fresh, sample and stock requests. Accept with pricing, PO, advance, shipping, invoice and design details, or reject.'),
 @('03  Order control','Create and publish store, online, retail and customer orders. Record payments; update stage, shipping and tracking.'),
 @('04  Production & delivery','Monitor stage counts and due dates. Handle exceptions. After balance clears, scan global QR to mark ready, then ship.'),
 @('05  Service & catalogue','Reply to website and product enquiries. Maintain products, collections, colours, beaders, stock and sponsors.'),
 @('06  Business operations','Manage customers and retailer access, store locator visibility, QuickBooks, accounts, expenses, users, roles and settings.')
) 3
# Retailer summary
Add-Overview 'Retailer' 'Retailer | use the panel' 'A single panel for discovery, ordering, order history and account follow-up.' @(
 @('01  Sign in','Log in to /retailer-login with retailer credentials; the panel opens after authentication.'),
 @('02  Find products','Browse latest collections, product catalogue, inventory and favourites/cart.'),
 @('03  Place a request','Submit regular, sample or ready-stock orders. Add specifications, quantities, uploads or comments where needed.'),
 @('04  Track decisions','Review pending requests and details. Check rejected orders and admin responses.'),
 @('05  Manage orders','Search accepted, delivered and admin orders; inspect order details and PDF previews.'),
 @('06  Payments & dispatch','Pay or update payment, review stage dates and follow shipping with the tracking ID.')
) 3
# Admin lane
Add-Overview 'Admin' 'Admin | the request-to-delivery lane' 'The primary retailer order path, with decision points and operational handoffs.' @(
 @('1  Request arrives','Retailer submits a fresh order, sample request or stock order. Admin sees each in its request queue.'),
 @('2  Review & decide','Check request details. Accept or reject; the retailer sees the outcome in their panel.'),
 @('3  Accept & prepare','Complete PO, prices, advance, shipping and invoice; upload design and notify the manufacturer.'),
 @('4  Track the order','Record payment and update production stage. Monitor due dates and resolve exceptions.'),
 @('5  Clear balance','Verify the balance is paid, then use global QR scanning to mark Ready To Delivery.'),
 @('6  Ship & close','Add shipping status and tracking ID so the retailer can follow delivery.')
) 3
# Retailer lane
Add-Overview 'Retailer' 'Retailer | request-to-order lane' 'How retailers discover products, submit requests and follow the admin’s decision.' @(
 @('1  Explore','Open latest collections, catalogue, inventory and favourites. Ready-stock pages support search and filters.'),
 @('2  Build order','Add product quantities to cart, request samples with specifications, or select stock by size and quantity.'),
 @('3  Submit','Place the request. It enters Pending Orders with type, date, quantity, amount and status.'),
 @('4  Await decision','Open request details while pending. If rejected, find it in Rejected Orders.'),
 @('5  Follow accepted orders','Use My Orders to view accepted/delivered orders, details, PDF and stage dates.'),
 @('6  Pay and track','Pay or edit payment, then use tracking ID and order updates to follow dispatch.')
) 3
# Full diagrams
foreach($p in $adminPages){Add-FlowSlide $p 'Admin' "Admin | $($p.name)" 'Rebuilt from the source draw.io flowchart as editable PowerPoint shapes.'}
foreach($p in $retailPages){Add-FlowSlide $p 'Retailer' "Retailer | $($p.name)" 'Rebuilt from the source draw.io flowchart as editable PowerPoint shapes.'}
# Screenshot-sized captures for each source flowchart
$adminShot=Join-Path $PWD 'ChicAndHolland_Admin_Flow_Screenshot.svg';$retailShot=Join-Path $PWD 'ChicAndHolland_Retailer_Flow_Screenshot.svg'
Add-ScreenshotSlide $adminPages[0] 'Admin' 'Admin | flowchart window capture' 'Full-page capture of the Admin daily workflow diagram in a clean, presentation-sized window.' $adminShot
Add-ScreenshotSlide $retailPages[0] 'Retailer' 'Retailer | flowchart window capture' 'Full page view of the Retailer operating flow in a clean presentation window.' $retailShot
$pres.SaveAs($out)
$pres.Close();$ppt.Quit()
Write-Output "Created $out"

