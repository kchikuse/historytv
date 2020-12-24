$(window).load(async () => {

    let timer,
        volumer,
        timeline,
        yearly = [],
        isJukeBox = false,
        isTurnedOn = true,
        state = new Proxy({}, {
            set: (target, key, value) => {
                target[key] = value;
                updateScreen();
                return true;
            }
        });

    const playlist = await loadYears();

    let jukeBox = new JukeBox(playlist);

    const player = videojs("video");

    player.volume(0);
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
        navigate("+");
    });

    player.on("volumechange", () => {

        clearTimeout(volumer);

        $("volume").text( player.volume() * 10 ).fadeIn();

        volumer = setTimeout(() => {
           $("volume").fadeOut();
        }, 1500);
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
        navigate("-");
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
        navigate("+");
    });

    navigator.mediaSession.setActionHandler("pause", () => {
        togglePause();
    });

    $(this).keydown(handleKeys);
    
    $(this).unload(saveState);

    $(this).contextmenu(() => false);

    Array.prototype.shuffle = shuffle;

    loadState();

    buildTimeline();

    async function loadYears() {
        let response = await fetch("assets/videos.json");
        return await response.json();
    }

    function updateScreen() {
        
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

    function showAbout() {
        $("about").attr("show", $("about").is(":not(:visible)"));
    }

    function showJukeBox() {
        $("calendar").attr("jukebox", isJukeBox);
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

    function toggleJukeBox() {
        isJukeBox = !isJukeBox;

        showJukeBox();

        if(isJukeBox) {
            jukeBox.shuffle();
            navigate("+");
        }
    }

    function navigate(direction) {
        let index = state.index,
            max = playlist.length - 1,
            prev = direction == "-",
            next = direction == "+";

        if(prev) {
            index = index - 1;
        }

        if(next) {
            index = index + 1;
        }

        if(index < 0) {
            index = max;
        }

        if(index > max) {
            index = 0;
        }

        if(isJukeBox) {
            if(prev) index = jukeBox.prev();
            if(next) index = jukeBox.next();
        }

        if(index != state.index) {
            setIndex(index);
            setTime(0);
        }
    }

    function loadState() {
        Object.assign(state, JSON.parse(localStorage.getItem("state")) || {
            jukebox: false,
            autoplay: true,
            index: 0, 
            time: 0
        });

        if(state.jukebox == true) {
            jukeBox = new JukeBox(playlist);
            jukeBox.shuffle();
            isJukeBox = true;
            showJukeBox();
        }
    }

    function saveState() {
        localStorage.setItem("state", JSON.stringify({
            autoplay: player.paused() == false,
            time: player.currentTime(),
            index: state.index || 0,
            jukebox: isJukeBox
        }));
    }

    function checkForYear(key) {
        let digits = 4,
            stringify = e => Number(e.join(''));

        if(key == "Enter") {
            
            if(yearly.length == digits) {
                let year = stringify(yearly);
                let index = playlist.findIndex(i => i.year == year);

                if(isJukeBox) {
                    index = playlist.findIndex(i => i.year == year && i.song);
                }

                if(index >= 0 && index < playlist.length) {
                    setIndex(index);
                    setTime(0);
                }
                else {
                    showYear();
                }

                yearly = [];
            }
            else if(yearly.length < digits) {
                showYear();
                yearly = [];
            }
        }
        else if(yearly.length < digits) {
            yearly.push(Number(key));
            showYear(stringify(yearly));
        }
    }

    function isNumber(value) {
        return /^-?\d+$/.test(value);
    }

    function adjustVolume(code) {
        
        let volume = player.volume();

        if(code == "ArrowUp") {
            volume = (volume * 10 + 1) / 10;
            if(volume > 1) volume = 1;
        }

        if(code == "ArrowDown") {
            volume = (volume * 10 - 1) / 10;
            if(volume < 0) volume = 0;
        }

        player.volume(volume);
        player.muted(false);
        player.trigger("volumechange");
    }

    function playVideo() {
        let ids = playlist.filter(i => !i.song).map(i => i.id);

        ids.shuffle();

        let min = 0,
            max = ids.length - 1,
            pos = Math.random() * (max - min) + min,
            id = ids[ Math.floor(pos) ],
            index = playlist.findIndex(i => i.id == id);
        
        if(isJukeBox) {
            toggleJukeBox();
        }
        
        setIndex(index);
        setTime(0);
    }

    function setIndex(index) {
        state.index = index;
    }

    function setTime(time) {
        state.time = time;
    }

    function shuffle() {
        for(let k = 0; k < 50; k++) {
            for (let i = this.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                [this[i], this[j]] = [this[j], this[i]];
            }
        }
    }

    function handleKeys(e) {
        let code = e.key.toUpperCase();

        if(code != "F5") {
            e.preventDefault();
        } 
        
        if(code == "." || code ==  "O") {
            return toggleSwitch();
        }

        if (!isTurnedOn) {
            return;
        }

        if(code == "R") {
            return playVideo();
        }

        if(code == "A" || e.key == "F1") {
            return showAbout();
        }

        if(code == "I") {
            return showTopic();
        }

        if(code == "J") {
            return toggleJukeBox();
        }

        if(code == "P" || code == " ") {
            return togglePause();
        }

        if(e.key == "Escape") {
            return $("about").attr("show", false);
        }

        if(e.key == "ArrowUp" || e.key == "ArrowDown") {
            return adjustVolume(e.key);
        }

        if(e.key == "Enter" || isNumber(e.key)) {
            return checkForYear(e.key);
        }
        
        if(e.key == "ArrowLeft") {
            return navigate("-");
        }

        if(e.key == "ArrowRight") {
            return navigate("+");
        }
    }
});