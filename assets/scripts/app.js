$(window).load(async () => {

    let timer,
        timeline,
        yearly = [],
        isTurnedOn = true,
        state = new Proxy({}, {
            set: (target, key, value) => {
                target[key] = value;
                update();
                return true;
            }
        });

    const playlist = await loadYears();

    const player = videojs("video");

    player.volume(1);
    player.muted(false);
    player.preload(true);
    player.playlist(playlist);
    player.playlist.repeat(true);
    player.playlist.autoadvance(0);

    player.on("play", () => {
        state.autoplay = true;
        
        showPause();

        if(player.currentTime() == 0) {
            showTopic();
        }
    });

    player.on("ended", () => {
        let index = state.index + 1;
        let max = playlist.length - 1;

        if(index > max) {
            index = 0;
        }

        setIndex(index);
    });

    player.on("error", (e, err) => {
        console.error(e, err, JSON.stringify(state));
    });

    $(this).keydown(handleKeys);
    
    $(this).unload(saveState);

    $(this).contextmenu(() => false);

    loadState();

    buildTimeline();

    async function loadYears() {
        return await fetch("assets/videos.json").then(r => r.json());
    }

    function update() {
        
        showYear();

        showPause();

        player.autoplay(state.autoplay);
        player.currentTime(state.time);

        let position = playlist.findIndex(i => i.sources.src == player.currentSrc());

        if(position != state.index) {
            player.playlist.currentItem(state.index || 0);
        }

        $(player.el()).attr("scale", playlist[position].scale);
    }

    function showYear(year) {
        let index = state.index || 0;
        let currentYear = playlist[index].year;
        $("calendar").text(year || currentYear);
    }

    function showPause() {
        $(player.el()).attr("paused", player.paused());
    }

    function showTopic() {
        let video = playlist[state.index];

        clearTimeout(timer);

        $("topic").text(video.title).fadeIn()
            .css("background-image", `url(assets/images/${video.flag}.gif)`);

        timer = setTimeout(() => {
          $("topic").fadeOut();
        }, 4000);
    }

    function buildTimeline() {
        timeline = new TimelineMax({
          paused: true
        });
        
        timeline
        .to("screen", 0.2, {
          width: "100vw",
          height: "2px",
          background: "#ffffff",
          ease: Power2.easeOut
        })
        .to("screen", 0.2, {
          width: "0",
          height: "0",
          background: "#ffffff"
        });
    }

    function toggleSwitch() {
        if (isTurnedOn) {
            turnOff();
        }
        
        if (!isTurnedOn) {
            turnOn();
        }
        
        isTurnedOn = !isTurnedOn;
    }  

    function turnOff() {
        player.pause();
        
        setTime(player.currentTime());
        
        $("body").attr("off", true);
        
        $("topic").fadeOut(0);

        $(player.el()).fadeOut("fast", function() {
            $(this).attr("cloak", true);
            timeline.restart();
        });
    }

    function turnOn() {
        timeline.reverse();
    
        $(player.el()).fadeIn("fast", function() {
            setTimeout(() => {
                $(this).removeAttr("cloak");
                $("body").removeAttr("off");
                player.play();
            }, 200);
        });
    }

    function togglePause() {
        if(player.paused()) {
            player.play();
        }
        else {
            setTime(player.currentTime());
            player.pause();
        }

        showPause();
    }

    function loadState() {
        Object.assign(state, JSON.parse(localStorage.getItem("state")) || {
            autoplay: true,
            index: 0, 
            time: 0
        });
    }

    function saveState() {
        localStorage.setItem("state", JSON.stringify({
            autoplay: player.paused() == false,
            time: player.currentTime(),
            index: state.index || 0
        }));
    }

    function checkForYear(key) {
        let stringify = e => Number(e.join(''));

        if(key == "Enter") {
            
            if(yearly.length == 4) {
                let year = stringify(yearly);
                let index = playlist.findIndex(i => i.year == year);

                if(index >= 0 && index < playlist.length) {
                    setIndex(index);
                    setTime(0);
                }
                else {
                    showYear();
                }

                yearly = [];
            }
            else if(yearly.length < 4) {
                showYear();
                yearly = [];
            }
        }
        else if(yearly.length < 4) {
            yearly.push(Number(key));
            showYear(stringify(yearly));
        }
    }

    function isNumber(value) {
        return /^-?\d+$/.test(value);
    }

    function setIndex(index) {
        state.index = index;
    }

    function setTime(time) {
        state.time = time;
    }

    function handleKeys(e) {
        let index = state.index;
        let max = playlist.length - 1;
        let code = e.key.toUpperCase();
        
        if(code == ".") {
            return toggleSwitch();
        }

        if (!isTurnedOn) {
            return;
        }

        if(code == "I") {
            return showTopic();
        }

        if(code == " " || code == "P") {
            return togglePause();
        }

        if(e.key == "Enter" || isNumber(e.key)) {
            return checkForYear(e.key);
        }
        
        if(e.key == "ArrowLeft") {
            index = index - 1;
        }

        if(e.key == "ArrowRight") {
            index = index + 1;
        }

        if(index < 0) {
            index = max;
        }

        if(index > max) {
            index = 0;
        }

        if(index != state.index) {
            setIndex(index);
            setTime(0);
        }
    }
});