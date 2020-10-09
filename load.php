<?php

require "rb.php";

R::setup("mysql:host=localhost;dbname=historytv","root","root");

header("Access-Control-Allow-Origin: *");

$years = load();

save($years);

$json = json_encode(getVideos());

file_put_contents("assets/videos.json", $json);

echo file_get_contents("assets/videos.json");

function load() {

    $root = "assets/videos/";

    $dir = new DirectoryIterator($root);

    $years = [];

    foreach ($dir as $fileinfo) {
        if ($fileinfo->isDir() && isOk($fileinfo)) {
            
            $year = $fileinfo->getFilename();
            $videos = new DirectoryIterator($root . $year);

            foreach ($videos as $video) {
                if ($video->isFile() && isOk($video)) {

                    $src = $video->getFilename();

                    $years[] = array(
                        year => intval($year),
                        sources => array(
                            src => $src,
                            type => "video/mp4"
                        ));
                }
            }
        }
    }

    return $years;
}

function save(&$years) {
    for($i = 0; $i < count($years); $i++) {
        $filename = $years[$i]["sources"]["src"];
        $year = $years[$i]["year"];
    
        $video = R::findOne('videos', ' filename = ? ', [ $filename ]);
    
        if($video == null) {
            $title = str_replace(".mp4", "", $filename);
            $title = str_replace("  ", " ", $title);
    
            $video = R::dispense('videos');
            $video->year = $year;
            $video->filename = $filename;
            $video->title = $title;
            $video->sorter = null;
            $years[$i]["title"] = $title;
            R::store($video);
        }
    }
}

function isOk($file) {
    return !$file->isDot() 
    && $file->getFilename() != ".git" 
    && $file->getFilename() != ".DS_Store";
}

function getVideos() {
    $videos = R::getAll('SELECT * FROM videos ORDER BY year, sorter IS NULL, sorter ASC');

    $years = [];

    foreach ($videos as $video) {
        $years[] = array(
            year => $video["year"],
            title => $video["title"],
            sources => array(
                src => "assets/videos/{$video["year"]}/{$video["filename"]}",
                type => "video/mp4"
            ));
    }

    return $years;
}