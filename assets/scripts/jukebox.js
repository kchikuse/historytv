class JukeBox {

    constructor(playlist) {
        
        this.songs = [];

        playlist.forEach((item, index) => {
            if (item.song) {
                this.songs.push(index);
            }
        });

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

    shuffle() {
        this.songs.shuffle();
        this.songs.shuffle();
    }
}