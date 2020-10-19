<?php

echo "<title>mover</title>";

$root = "/Users/KChikuse/Downloads/";

$dir = new DirectoryIterator($root);

foreach ($dir as $file) {
    
    if ($file->isFile() && end(explode('.', $file)) === "mp4") {

        $file = $file->getFilename();

        $clean = str_replace(". - British Pathé.mp4", ".mp4", $file);
        $clean = str_replace(". - British Pathé.mp4", ".mp4", $clean);
        $clean = str_replace(" - British Pathé.mp4", ".mp4", $clean);
        $clean = str_replace(" - British Pathé.mp4", ".mp4", $clean);


        rename($root.$file, $root.$clean);

        echo $file . " > " . $clean . "<br>";
    }
}