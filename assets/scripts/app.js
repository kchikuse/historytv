$(window).load(async () => {

    let timer, 
        slider,
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

    player.volume(0);
    player.preload(true);
    player.playlist(playlist);
    player.playlist.repeat(true);
    player.playlist.autoadvance(0);

    player.on("play", () => {
        state.autoplay = true;
        showTopic();
        showPause();
    });

    player.on("ended", () => {
        let index = state.index + 1;
        let max = playlist.length - 1;

        if(index > max) {
            index = 0;
        }

        setIndex(index);
    });

    player.on("volumechange", () => {
        let range = $("input[type='range']");
        let volume = player.volume() * 100;

        clearTimeout(slider);

        range.val(volume).fadeIn();

        $("#tv").attr("volume", volume);

        slider = setTimeout(() => {
           range.fadeOut();
        }, 1500);
    });

    $(this).keydown(handleKeys);
    
    $(this).unload(saveState);

    $(this).contextmenu(() => false);

    loadState();

    buildTimeline();

    async function loadYears() {
        let response = await fetch("assets/videos.json");
        return await response.json();
    }

    function update() {
        
        showYear();

        showPause();

        player.autoplay(state.autoplay);
        player.currentTime(state.time);
        player.volume(state.volume);

        let position = playlist.findIndex(i => i.sources.src == player.currentSrc());

        if(position != state.index) {
            player.playlist.currentItem(state.index || 0);
        }
    }

    function showYear(year) {
        let index = state.index || 0;
        let currentYear = playlist[index].year;
        $("calendar").text(year || currentYear);
    }

    function showPause() {
        $("#tv").attr("paused", player.paused());
    }

    function showTopic() {
        if(player.currentTime() > 0) {
            return;
        }

        let topic = playlist[state.index].title;

        clearTimeout(timer);

        $("topic").text(topic).fadeIn();

        timer = setTimeout(() => {
          $("topic").fadeOut();
        }, 3000);
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

        $(".video-js").fadeOut("fast", function() {
            $(this).attr("cloak", true);
            timeline.restart();
        });
    }

    function turnOn() {
        timeline.reverse();
    
        $(".video-js").fadeIn("fast", function() {
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

    function adjustVolume(code) {
        
        let volume = player.volume();

        if(code == "+") {
            volume = (volume * 10 + 1) / 10;
            if(volume > 1) volume = 1;
        }

        if(code == "-") {
            volume = (volume * 10 - 1) / 10;
            if(volume < 0) volume = 0;
        }

        player.volume(volume);
        player.muted(false);
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
        if(key == "Enter") {
            
            if(yearly.length == 4) {
                let year = Number(yearly.join(''));
                let index = playlist.findIndex(i => i.year == year);

                if(index > 0 && index < playlist.length) {
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
            showYear(yearly);
        }
    }

    function isNumeric(value) {
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

        if(code == "F") {
            return player.requestFullscreen();
        }

        if(code == " " || code == "P") {
            return togglePause();
        }

        if(code == "+" || code == "-") {
            return adjustVolume(code);
        }

        if(code == "M") {
            return player.muted( ! player.muted() );
        }

        if(e.key == "Enter" || isNumeric(e.key)) {
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