addEventListener("DOMContentLoaded", () => {
    const fs = require("fs");
    
    let timeline,
        isTurnedOn = true,
        playlist = getAllYears(),
        state = loadState();

    const player = videojs("video");
    player.currentTime(state.time);
    player.autoplay(true);
    player.preload(true);
    player.volume(0);
    player.playlist(playlist);
    player.playlist.repeat(true);
    player.playlist.currentItem(state.index);
    player.playlist.autoadvance(0);

    player.on("play", () => {
        let src = player.currentSrc();
        let video = playlist.find(p => p.sources[0].src == src);
        showYear(video.year);
        //console.log(video);
    });

    player.on("useractive", () => {
        $("button").show();
    });

    player.on("userinactive", () => {
        if(!player.paused()) {
            $("button").hide();
        }
    });

    $("button").on("click", () => {
        if (isTurnedOn) {
            turnOff();
        }
        
        if (!isTurnedOn) {
            turnOn();
        }
        
        isTurnedOn = !isTurnedOn;
    });

    setInterval(saveState, 2000);

    showYear(playlist[state.index].year);

    buildTimeline();

    function getAllYears() {
        const DIR = "./assets/videos/";
        
        let list = [];

        fs.readdirSync(DIR).sort().forEach(year => {
            if(year.startsWith(".") == false) {
                fs.readdirSync(DIR + year).sort().forEach(video => {
                    if(video.startsWith(".") == false) {
                        list.push({
                            year: year,
                            sources: [{
                                src: `${DIR}${year}/${video}`,
                                type: `video/mp4`
                            }]
                        });
                    }
                });
            }
        });
        return list;
    }

    function getYear(year) {
        return getAllYears().filter(y => y.year == year);
    }

    function showYear(year) {
        $("calendar").html(year);
    }

    function loadState() {
        let store = localStorage.getItem("state");
        return store ? JSON.parse(store) : { index: 0, time: 0 };
    }

    function saveState() {
        state.index = player.playlist.currentItem();
        state.time = player.currentTime();
        localStorage.setItem("state", JSON.stringify(state));
    }

    function buildTimeline() {
        timeline = new TimelineMax({
          paused: true
        });
        
        timeline
        .to(".screen", 0.2, {
          width: "100vw",
          height: "2px",
          background: "#ffffff",
          ease: Power2.easeOut
        })
        .to(".screen", 0.2, {
          width: "0",
          height: "0",
          background: "#ffffff"
        });
    }

    function turnOff() {
        player.pause();

        $("calendar").attr("cloak", true);
        
        $(".video-js").fadeOut("fast", function(){
            $(this).attr("cloak", true);
            $("button").text("ON");
            timeline.restart();
        });
    }

    function turnOn() {
        timeline.reverse();
        
        $(".video-js").fadeIn("fast", function() {
            $(this).removeAttr("cloak");
            $("calendar").removeAttr("cloak");
            $("button").text("OFF");
            
            if(player.paused()) {
                player.play();
            }
        });
    }

    function l(s) {
        console.log(s);
    }
});