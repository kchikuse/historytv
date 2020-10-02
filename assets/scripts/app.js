addEventListener("DOMContentLoaded", async () => {

    let timer, 
        state = new Proxy({}, {
            set: function (target, key, value) {
                target[key] = value;
                update();
                return true;
            }
        });

    let playlist = await loadYears();

    const player = videojs("video");
    player.volume(1.0);
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

    async function loadYears() {
        let response = await fetch("assets/videos.json");
        return await response.json();
    }

    function update() {
        let index = state.index || 0;
        
        showYear(playlist[index].year);

        showPause();

        player.currentTime(state.time);
        player.autoplay(state.autoplay);
        player.playlist.currentItem(index);
    }

    function showYear(year) {
        document.querySelector("calendar").innerHTML = year;
    }

    function showPause() {
        player.el().dataset.paused = player.paused();
    }

    function showTopic() {
        if(player.currentTime() > 0) {
            return;
        }

        let topic = playlist[state.index].title;
        let element = document.querySelector("topic");

        clearTimeout(timer);
        element.innerHTML = topic;
        element.dataset.visible = true;

        timer = setTimeout(() => {
           delete element.dataset.visible;
        }, 3000);
    }

    function loadState() {
        Object.assign(state, JSON.parse(localStorage.getItem("state")) || {
            autoplay: true,
            index: 0, 
            time: 0
        });
    }

    window.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
    });

    window.addEventListener("keydown", e => {
        let index = state.index;
        let max = playlist.length - 1;
        let code = e.key.toUpperCase();

        if(e.key == "Enter" || code == "F") {
            player.requestFullscreen();
        }

        if(code == " " || code == "P") {
            if(player.paused()) player.play();
            else player.pause();
            showPause();
        }

        if(code == "+") {
            player.muted(false);
        }

        if(code == "-") {
            player.muted(true);
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

    window.addEventListener("beforeunload", () => {
        localStorage.setItem("state", JSON.stringify({
            autoplay: player.paused() == false,
            time: player.currentTime(),
            index: state.index
        }));
    });
});