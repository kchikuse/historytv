$(window).load(async () => {

    let timer, 
        timeline,
        isTurnedOn = true,
        state = new Proxy({}, {
            set: (target, key, value) => {
                target[key] = value;
                update();
                return true;
            }
        });

    const playlist = await loadYears();
    const videoPlayer = $(".video-js");
    const player = videojs("video");

    player.volume(1);
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

        state.index = index;
    });

    loadState();

    buildTimeline();

    async function loadYears() {
        let response = await fetch("assets/videos.json");
        return await response.json();
    }

    function update() {
        let index = state.index || 0;
        
        showYear(playlist[index].year);

        showPause();

        player.autoplay(state.autoplay);
        player.currentTime(state.time);
        player.volume(state.volume);

        let position = playlist.findIndex(i => i.sources.src == player.currentSrc());

        if(position != state.index) {
            player.playlist.currentItem(index);
        }
    }

    function showYear(year) {
        $("calendar").html(year);
    }

    function showPause() {
        videoPlayer.attr("paused", player.paused());
    }

    function showTopic() {
        if(player.currentTime() > 0) {
            return;
        }

        let topic = playlist[state.index].title;

        clearTimeout(timer);

        $("topic").html(topic).fadeIn();

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
        
        state.time = player.currentTime();
        
        $("body").attr("off", true);

        videoPlayer.fadeOut("fast", () => {
            videoPlayer.attr("cloak", true);
            timeline.restart();
        });
    }

    function turnOn() {
        timeline.reverse();
    
        videoPlayer.fadeIn("fast", () => {
            setTimeout(() => {
                $("body").removeAttr("off"); 
                videoPlayer.removeAttr("cloak");
                player.play();
            }, 200);
        });
    }

    function togglePause() {
        if(player.paused()) {
            player.play();
        }
        else {
            state.time = player.currentTime();
            player.pause();
        }

        showPause();
    }

    function adjustVolume(increase) {
        
        let volume = player.volume();

        if(increase) {
            volume = (volume * 10 + 1) / 10;
            if(volume > 1) volume = 1;
        }
        else {
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

    $(this).keydown(e => {
        let index = state.index,
            max = playlist.length - 1,
            code = e.key.toUpperCase();

        if(e.key == "Enter" || code == "F") {
            player.requestFullscreen();
        }

        if(code == " " || code == "P") {
            togglePause();
        }

        if(code == ".") {
            toggleSwitch();
        }

        if(code == "+") {
            adjustVolume(true);
        }

        if(code == "-") {
            adjustVolume(false);
        }

        if(code == "M") {
            player.muted( ! player.muted() );
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
            state.index = index;
            state.time = 0;
        }
    });

    $(this).unload(() => {
        localStorage.setItem("state", JSON.stringify({
            autoplay: player.paused() == false,
            time: player.currentTime(),
            index: state.index
        }));
    });

    $(this).bind("contextmenu", () => false);
});