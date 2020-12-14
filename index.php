<?php

	require_once "flight/Flight.php";

	require "rb.php";

	R::setup("mysql:host=localhost;dbname=historytv", "root", "root");

	Flight::route("OPTIONS *", function () {
		echo "{}";
	});

	Flight::route("GET /videos", function () {
		$videos = R::getAll("SELECT * FROM videos ORDER BY sorter ASC");

		$years = [];

		foreach ($videos as $video) {
			$years[] = array(
				"id" => intval($video["id"]),
				"year" => intval($video["year"]),
				"title" => $video["title"],
				"sorter" => $video["sorter"],
				"scale" => $video["scale"] == 0 ? false : true,
				"song" => $video["song"] == 0 ? false : true,
				"flag" => intval($video["flag"]),
				"sources" => array(
					"src" => "assets/videos/{$video["year"]}/{$video["filename"]}",
					"type" => "video/mp4"
				));
		}

		$json = Flight::json( $years );

		file_put_contents("C:\\Users\\DVT\\Documents\\xampp\\htdocs\\historytv\\assets\\videos.json", $json);

		return $json;
	});

	Flight::route("POST /update-sorting", function () {
		$data = Flight::request()->data->getData();

		$ids = $data["ids"];

		$found = [];

		for($position = 0; $position < count($ids); $position++) {
			$id = $ids[ $position ];
			$video = R::findOne('videos', ' id = ? ', [ $id ]);
		
			if($video !== null) {
				$found[] = $id . ") " . $video["title"] . ", " . $position;
				$video->sorter = $position;
				R::store($video);
			}
		}

		echo Flight::json( array("found" => count($found)) );
	});

	Flight::route("POST /update-scaling", function () {
		$data = Flight::request()->data->getData();
		$id = $data["id"];
		$scale = $data["scale"];

		$video = R::findOne('videos', ' id = ? ', [ $id ]);
		
		if($video !== null) {
			$video->scale = $scale == 1 ? true : false;
			R::store($video);
		}

		echo Flight::json(array("id" => $id, "scale" => $scale));
	});

	Flight::after("start", function() {
		header("Access-Control-Allow-Origin: *");
		header("Access-Control-Allow-Methods: *");
		header("Access-Control-Allow-Headers: content-type");
		header("Content-Type: application/json");
	});

	Flight::start();

?>