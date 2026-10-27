$ErrorActionPreference='Stop'
$out=Join-Path $PWD 'ChicAndHolland_Operating_Flows.pptx'
$ppt=New-Object -ComObject PowerPoint.Application;$ppt.Visible=-1;$pres=$ppt.Presentations.Add();$pres.PageSetup.SlideSize=16
function RGB($h){$c=$h.TrimStart('#');[int]('0x'+$c.Substring(4,2))*65536+[int]('0x'+$c.Substring(2,2))*256+[int]('0x'+$c.Substring(0,2))}
function Txt($s,$text,$x,$y,$w,$h,$size,$color,$bold=$false){$b=$s.Shapes.AddTextbox(1,$x*72,$y*72,$w*72,$h*72);$b.TextFrame.TextRange.Text=$text;$b.TextFrame.TextRange.Font.Name='Aptos';$b.TextFrame.TextRange.Font.Size=$size;$b.TextFrame.TextRange.Font.Color.RGB=RGB $color;$b.TextFrame.TextRange.Font.Bold=[int]$bold;$b.TextFrame.WordWrap=-1;return $b}
function Base($title,$sub){$s=$pres.Slides.Add($pres.Slides.Count+1,12);$s.Background.Fill.ForeColor.RGB=RGB '#17212b';Txt $s 'CHIC & HOLLAND  |  OPERATING FLOWS' .6 .35 12 .25 9 '#b69763' $true|Out-Null;Txt $s $title .6 .75 12 .55 26 '#ffffff' $true|Out-Null;Txt $s $sub .62 1.35 12 .4 11 '#b3bdc6'|Out-Null;$l=$s.Shapes.AddShape(1,45,512,870,1);$l.Fill.ForeColor.RGB=RGB '#b69763';$l.Line.Visible=0;Txt $s ([string]$pres.Slides.Count) 12.3 7.18 .3 .18 8 '#b69763'|Out-Null;return $s}
function Card($s,$x,$y,$title,$body){$r=$s.Shapes.AddShape(5,$x*72,$y*72,3.88*72,1.42*72);$r.Fill.ForeColor.RGB=RGB '#26333e';$r.Line.ForeColor.RGB=RGB '#43505a';Txt $s $title ($x+.16) ($y+.13) 3.55 .3 13 '#d6b979' $true|Out-Null;Txt $s $body ($x+.16) ($y+.53) 3.55 .78 10 '#ffffff'|Out-Null}
function Overview($title,$sub,$data){$s=Base $title $sub;$i=0;foreach($d in $data){$x=.62+($i%3)*4.08;$y=1.95+[Math]::Floor($i/3)*1.62;Card $s $x $y $d[0] $d[1];$i++}}
$s=Base 'Admin and retailer workflows' 'A presentation of the Chic & Holland operating flows, from retailer requests through fulfilment.';Txt $s 'ADMIN' .85 2.0 5 .3 11 '#d6b979' $true|Out-Null;Txt $s 'Review retailer requests, manage orders and payments, coordinate production, then ship and maintain the business.' .85 2.45 5.0 1.1 20 '#ffffff'|Out-Null;Txt $s 'RETAILER' 6.9 2.0 5 .3 11 '#d6b979' $true|Out-Null;Txt $s 'Browse collections and inventory, place requests, review decisions, and follow orders, payments and tracking.' 6.9 2.45 5.0 1.1 20 '#ffffff'|Out-Null
Overview 'Admin | daily operating flow' 'Sign in, triage work, move orders through production and fulfilment.' @(
 @('Access and dashboard','Sign in at /login. Dashboard shows sales, order stages and recent orders.'),
 @('Retailer requests','Review fresh, sample and stock requests. Accept with order details or reject.'),
 @('Order control','Create and publish orders; record payments and update stage, shipping and tracking.'),
 @('Production and delivery','Monitor stages and due dates. Clear balance, scan global QR to mark ready, then ship.'),
 @('Service and catalogue','Answer enquiries. Maintain products, collections, colours, beaders, stock and sponsors.'),
 @('Business operations','Manage customers, retailer access, QuickBooks, accounts, expenses, users, roles and settings.')
)
Overview 'Retailer | use the panel' 'One panel for discovery, ordering, order history and account follow-up.' @(
 @('Sign in','Log in with retailer credentials and open the retailer panel.'),
 @('Find products','Browse latest collections, catalogue, inventory and cart/favourites.'),
 @('Place a request','Submit regular, sample or ready-stock orders with quantities and specifications.'),
 @('Track decisions','Review pending requests and details; find rejected requests in Rejected Orders.'),
 @('Manage orders','Search accepted and delivered orders; inspect details and PDF previews.'),
 @('Payments and dispatch','Pay or update payment, review stage dates and follow tracking ID.')
)
Overview 'Admin | retailer request to delivery' 'The primary retailer order path, with review and operational handoffs.' @(
 @('1  Request arrives','Fresh, sample and stock requests appear in the admin request queues.'),
 @('2  Review and decide','Check request details; accept or reject. The retailer sees the result.'),
 @('3  Accept and prepare','Complete PO, pricing, advance, shipping, invoice and design; notify manufacturer.'),
 @('4  Track the order','Record payments and update production stage; monitor dates and exceptions.'),
 @('5  Clear balance','Verify payment, then scan global QR to mark Ready To Delivery.'),
 @('6  Ship and close','Set shipping status and tracking ID for the retailer.')
)
Overview 'Retailer | request to order' 'Discover products, submit requests and follow the admin decision.' @(
 @('1  Explore','Open collections, catalogue, inventory and cart/favourites.'),
 @('2  Build order','Choose product quantities, sample specifications or ready-stock sizes.'),
 @('3  Submit','Place request; status appears in Pending Orders with its key details.'),
 @('4  Await decision','Open pending request details; rejected orders remain accessible.'),
 @('5  Follow orders','Use My Orders for accepted/delivered status, details, PDFs and stage dates.'),
 @('6  Pay and track','Update payment and follow shipping with order updates and tracking ID.')
)
function Capture($title,$subtitle,$file){$s=Base $title $subtitle;$pic=$s.Shapes.AddPicture((Join-Path $PWD $file),0,-1,45,135,870,350);$pic.Line.Visible=-1;$pic.Line.ForeColor.RGB=RGB '#53616a'}
Capture 'Admin | flowchart window screenshot' 'Full-window screenshot of the Admin operating flow.' 'Admin_Operating_Flow_Screenshot.png'
Capture 'Retailer | flowchart window screenshot' 'Full-window screenshot of the Retailer operating flow.' 'Retailer_Operating_Flow_Screenshot.png'
$pres.SaveAs($out);$count=$pres.Slides.Count;$pres.Close();$ppt.Quit();Write-Output "Created $out ($count slides)"
