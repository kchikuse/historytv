addEventListener("DOMContentLoaded", () => {
    
    const fs = require("fs");
    const http = require("http");
    const player = videojs("video");

    const DIR = "./assets/videos/";

    let timeline,
        playlist = getAllYears(),
        state = new Proxy({ index: 0, volume: 0, time: 0 }, {
            set: function (target, key, value) {
                target[key] = value;
                updatePlayer(key);
                return true;
            }
    });

    player.autoplay(true);
    player.preload(true);
    player.playlist(playlist);
    player.playlist.repeat(true);
    player.playlist.autoadvance(0);

    player.on("play", () => {
        let src = player.currentSrc();
        let video = playlist.find(p => p.sources[0].src == src);
        state.index = player.playlist.currentIndex();
        state.year = video.year;
    });

    player.on("volumechange", () => {
        $("button")[ player.volume() == 0 ? "show" : "hide" ]();
    });

    $(window).on("beforeunload", saveState);

    loadState();

    buildTimeline();

    controlServer();

    function getAllYears() {        
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

    function showYear(year) {
        $("calendar").html(year);
    }

    function loadState() {
        try {
            let src = player.currentSrc();
            let video = playlist.find(p => p.sources[0].src == src);
            let store = JSON.parse(localStorage.getItem("state") || {});

            state.on = store.on == false ? false : true;
            state.year = store.year || video.year;
            state.volume = store.volume || 0;
            state.index = store.index || 0;
            state.time = store.time || 0; 
        }
        catch(e) {}
    }

    function saveState() {
        let store = Object.assign(state, {
            time: player.currentTime()
        });

        localStorage.setItem("state", JSON.stringify(store));
    }

    function updatePlayer(key) {
        if(player.playlist.currentItem() != state.index) {
            player.playlist.currentItem(state.index);
        }

        if(player.volume() != state.volume) {
            player.volume(state.volume);
        }

        if(key == "time") {
            player.currentTime(state.time);
        }

        showYear(state.year);
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
        
        $(".video-js").fadeOut("fast", () => {
            $(".video-js, calendar").attr("cloak", true);
            timeline.restart();
        });
    }

    function turnOn() {
        timeline.reverse();

        $(".video-js").fadeIn("fast", () => {
            $(".video-js, calendar").removeAttr("cloak");
            player.play();
        });
    }

    function process(data) {
        try {
            let e = JSON.parse(data);
            
            if(e.volume <= 1 && e.volume >= 0) {
                state.volume = e.volume;
            }
        
            if(e.index >= 0) {
                state.year = playlist[e.index].year;
                state.index = e.index;
            }

            if(e.year) {
                state.index = playlist.findIndex(i =>  i.year == e.year);
                state.year = e.year;
                state.time = 0;
            }

            if(e.on == true && state.on == false) {
                state.on = true;
                turnOn();
            }

            if(e.on == false && state.on == true) {
                state.on = false;
                turnOff();
            }

            if(e.skip && !player.paused()) {
                player.playlist.next();
                state.index ++;
                state.year = playlist[state.index].year;
            }
        }
        catch(e) {}
    }

    function controlServer() {
        http.createServer((r, s) => {     
            let body = "";

            const regex = new RegExp('.{1,4} .{1} .{1,4}\.mp4');
            
            r.on("end", () => {
                
                if(r.method == "POST") {
                    process(body);
                }

                let output = Object.assign({}, state, {
                        playlist: playlist.length,
                        duration: player.duration(),
                        title: player.currentSrc().replace(regex, "").replace(DIR+state.year+"/", "").trim(),
                        years: Array.from(new Set(playlist.map(i => i.year)))
                    });

                s.setHeader("access-control-allow-origin", "*");
                s.setHeader("content-type", "application/json");
                s.write(JSON.stringify(output));
                s.end();
            });

            r.on("data", chunk => {
                body += chunk;
            });

        }).listen(8000); 
    }
});