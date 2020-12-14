class JukeBox {

    constructor(playlist) {
        this.songs = [];

        playlist.forEach((item, index) => {
            if (item.song) {
                this.songs.push(index);
            }
        });

        this.shuffle(this.songs);
        this.max = this.songs.length - 1;
        this.index = 0;
    }

    prev() {
        this.index--;

        if (this.index < 0) {
            this.index = this.max;
        }

        return this.songs[ this.index ];
    }

    next() {
        this.index++;

        if (this.index > this.max) {
            this.index = 0;
        }

        return this.songs[ this.index ];
    }

    shuffle(list) {
        for(let k = 0; k < 50; k++) {
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [list[i], list[j]] = [list[j], list[i]];
            }
        }
    }
}