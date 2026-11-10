<?php
// Optional: only needed on PHP/cPanel hosting (not on GitHub Pages). Lists folders/files for blog + gallery.
header('Content-Type: application/json');header('Cache-Control: public, max-age=300');
$allowed=['blog','success-stories/images'];$d=$_GET['dir']??'';
if(!in_array($d,$allowed,true)){http_response_code(400);exit('{}');}
$p=__DIR__.'/'.$d;$dirs=[];$files=[];
foreach(scandir($p) as $n){if($n[0]==='.')continue;is_dir("$p/$n")?$dirs[]=$n:$files[]=$n;}
echo json_encode(['dirs'=>$dirs,'files'=>$files]);
