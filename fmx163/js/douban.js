(function(){
    var makeRandomString = function (length) {
        var text = "";
        var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < length; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };


var new_DBR = {
    act: function(u, s) {
        console.log(u,s);
        if(u == "switch"){
            window.doubanfm.changeCH(s);
        }
    },
};


    var doubanfmhtml5 = {
        changeCH: function(s){
            this.channel = s;
            this.playList('n');
        },

        getRequestData: function(v, s) {
            if (v != 'n' && v != 'p'){
                console.log("error with value " + v);
                v = 'n';
            }
            var x= {
                type: v,
                channel: this.channel,
                from: 'mainsite',
                kbps: 192,
                r: makeRandomString(10)
            };
            if (v == 'p'){
                x['sid'] = s;
            }
            return x;
        },

        changeUI: function () {
            
            channel_id = $(".player-wrap").find("script").text().match(/para\[\'defaultChannel\'\] = \'(.*)\';/)[1]
            if (typeof parseInt(channel_id) === 'number'){
                console.log("init channel: " + channel_id);
                this.channel = parseInt(channel_id);
            }else{
                this.channel = -3;
            }
            this.el = document.getElementById('fm-player');
            this.wrap = $('div.player-wrap').html('加载中...');

            this.volume = 0.5;
            this.playList('n', 0);
        },

        nextSong: function (s){
            //decide is the end of playList
            this.songId += 1;
            if (this.songId < this.songList.length) {
                    this.playSound();
                } else {
                    console.log('end of list');
                    this.playList('p', s);
                }
        },


        playSound: function () {
            var that = this;
            var i = this.songId;
            var song = this.songList[i];
            this.sendEvent(song);
            console.log(song);

            if(this.el.mp3 != undefined && this.el.mp3 != ""){
                this.el.mp3.pause();
                window.clearInterval(processbar);
                this.el.mp3.src=""; //cancel the downloading
                $("#progress").css("width", "0px");
                $(".r_time").text( '-0:00');

            }


            //change the title
            document.title = song.title + " - " + window.title_fixed;
            // todo change title of the page
            var html = '<a href="http://music.douban.com' + song.album + '">';
            html += '<img class="cover" src="'+song.picture+'"></a>';
            var rightPanel = "<span class=\"artist\">" + song.artist +"</span>";
            rightPanel +=  "<span class=\"album\">&lt; " + song.albumtitle + " &gt; " +  song.public_time + "</span>";
            rightPanel +=  "<span class=\"title\">" + song.title + "</span>";
            rightPanel +=  "<div id='defaultbar'><div id='progress'></div></div>"
            rightPanel +=  "<span class='r_time'></span>"
            var cPanel ="";
            if (song.like) {
                cPanel += '<div class="staron"></div>';
            }else{
                cPanel += '<div class="staroff"></div>';
            }
            cPanel += '<div class="trash"></div>';
            cPanel += '<div id="next_song" class="next"></div>';
            html += '<div id="m"><span class="play">Continue &gt;</span></div>';
            html += '<div id="p"><div class="pause"></div></div>';
            html += '<div id="r">'+rightPanel+'</div>';
            html += '<div id="c">'+cPanel+'</div>';
            this.wrap.html(html);

            $("#next_song").click( function() {
                that.reportNext(song.sid);
                that.nextSong();
            });

            $(".pause").click( function() {
                that.el.mp3.pause();
                $('#m').show();
            });

            $(".play").click( function() {
                that.el.mp3.play();
                $('#m').hide();
            });

            $(".staron").click( function() { 
                user_record.decrease("liked");
                $(".staron").attr("class", "staroff");
                that.unlikeSong(song.sid);

            });

            $(".staroff").click( function() {
                user_record.increase("liked");
                $(".staroff").attr("class", "staron");
                that.likeSong(song.sid);
            });

            $(".trash").click( function() {
                that.byeSong(song.sid);
                that.nextSong();
            });

            var soundfile = song.url;
            this.el.mp3 = new Audio(soundfile);
            this.el.mp3.volume = this.volume;
            this.el.mp3.play();
            var mp3 = this.el.mp3;
            processbar = setInterval(this.updatebar, 500);
            $(this.el.mp3).bind('ended', function () {
                that.reportEnd(song.sid);
                that.nextSong(song.sid);
            });
        },

        sendEvent: function(s){
            $(window).trigger("radio:start", {"channel": this.channel, "song": s, "type": "start"});
        },

        updatebar: function(){
            var mp3 = doubanfm.el.mp3;
            if(!mp3.ended){
                if(mp3.paused){
                    return;
                }
                c = parseInt(mp3.duration - mp3.currentTime);
                m = parseInt(c/60);
                ss = c % 60;
                s = mp3.currentTime / mp3.duration;
                $(".r_time").text( '-' + m + ":" + (ss < 10 ? "0" + ss : ss));
                $("#progress").css("width", parseInt(225 * s) + "px");
            }else{
                window.clearInterval(processbar);
            }

        },


        byeSong: function(sid){
            var request = {
                type: 'b',
                sid: sid,
                channel: this.channel,
                from: 'mainsite',
                kbps: 192,
                r: makeRandomString(10)
            };
            user_record.increase("banned");
            this.reportSubmit(request);

        },

        likeSong: function(sid){
            var request = {
                type: 'r',
                sid: sid,
                channel: this.channel,
                from: 'mainsite',
                kbps: 192,
                r: makeRandomString(10)
            };
            this.reportSubmit(request);
        },

        unlikeSong: function(sid){
            var request = {
                type: 'u',
                sid: sid,
                channel: this.channel,
                from: 'mainsite',
                kbps: 192,
                r: makeRandomString(10)
            };
            this.reportSubmit(request);

        },

        reportNext: function(sid){
            var request = {
                type: 's',
                sid: sid,
                channel: this.channel,
                from: 'mainsite',
                kbps: 192,
                r: makeRandomString(10)
            };
            this.reportSubmit(request);

        },

        reportEnd: function(sid){
            var request = {
                type: 'e',
                sid: sid,
                channel: this.channel,
                from: 'mainsite',
                kbps: 192,
                r: makeRandomString(10)
            };
            user_record.increase("played");
            this.reportSubmit(request);
        },

        reportSubmit: function(data){
            var that = this;
            $.ajaxSetup({
                async: false
            });
            $.getJSON('/j/mine/playlist', data, function(ret) {
                if (ret.r !== 0){
                    console.log('report Submit error');
                    console.log(data);
                    
                }else if (ret.song != undefined){
                    that.songList = ret.song;
                    that.songId = -1;
                    
                }
            });
            $.ajaxSetup({
                async: false
            });
        },

        playList: function (v, s) {
            //var that = this;
            var that = this;
            console.log('playList: ' + this.channel);
            window.now_play_channel = this.channel;
            $.getJSON('/j/mine/playlist', doubanfmhtml5.getRequestData(v, s), function(ret) {
                if (ret.r !== 0) {
                    alert('get playlist fail');
                    return;
                }
                that.songList = ret.song;
                that.songId = 0;
                that.playSound();
            });
        },

        init_act:function (){
            if(typeof window.DBR !== 'undefined'){
                //hack the act function.
                window.DBR.act = window.new_DBR.act;

                try{
                    window.clearInterval(window.doubanfm.init_id);
                }catch(err) {}

                //enable the html5 player
                window.doubanfm.changeUI();
                
            }else if(typeof this.init_id === 'undefined'){
                this.init_id = setInterval(this.init_act, 2000);
            }
        }
    };
    window.doubanfm = doubanfmhtml5;
    window.new_DBR = new_DBR;
    //start
    window.doubanfm.init_act();

})();
