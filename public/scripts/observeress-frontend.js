startApp()

function startApp() {

    checkTimeElements()
    checkTextElements()
    checkMediaElements()
}


function checkTimeElements() {

    var timers = $(".obess-timer")

    if (timers.length === 0) {
        return false
    }

    setTimeout(checkTimeElements, 1000)

    timers.forEach(timer => {
        var t = $(timer)

        if (t.hasClass("obess-timer-countdown")) {

            var cdt = t.data("countdown-to").split(":")
            var now = new Date()
            cdt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(cdt[0]), parseInt(cdt[1]), parseInt(cdt[2]))
            if (now > cdt) {
                cdt.setUTCMilliseconds(cdt.getUTCMilliseconds() + 86400000)
            }
            var sec = Math.floor((cdt - now) / 1000)



            var hour = Math.floor(sec / 60 / 60)
            sec -= (hour * 60 * 60)
            var min = Math.floor(sec / 60)
            sec -= (min * 60)


            var format = t.data("format")

            format = format.replace("hh", hour.toString().padStart(2, "0"))
            format = format.replace("mm", min.toString().padStart(2, "0"))
            format = format.replace("ss", sec.toString().padStart(2, "0"))

            t.text(format)


            return false
        }

        if (t.hasClass("obess-timer-now")) {

            var format = t.data("format")

            format = format.replace("HH", new Date().getHours().toString().padStart(2, "0"))
            format = format.replace("mm", new Date().getMinutes().toString().padStart(2, "0"))
            format = format.replace("ss", new Date().getSeconds().toString().padStart(2, "0"))

            t.text(format)
        }

    })

}

function checkTextElements() {
    $(".obess-text").forEach((elem) => {
        setInterval(updateText, 200, elem)
    })

    $(".obess-text-group").forEach((elem) => {
        $(elem).data("inc", "0")
        nextGroupText(elem)
        setInterval(nextGroupText, 13000, elem)
    })
}

var texts = {}

async function updateText(elem) {
    elem = $(elem)
    var id = elem.attr("id")
    var data = await $.get("/data/" + id + "-text.json")
    if (!texts[id]) texts[id] = {}

    if (texts[id].text === data.text) return false

    texts[id].text = data.text

    var div = $("<div />")
    data.text.toString().split('').forEach((c) => {

        var char = $("<span />").text(c).addClass("text-off")
        div.append(char)
    })

    elem.removeClass("text-on")
    var tmo = 500
    if (data.text === '') tmo = 0

    setTimeout(function (elem, chars) {
        $(elem).children().remove()
        $(elem).append(chars)
        setTimeout(function (elem) {
            $(elem).addClass("text-on")
        }, 100, elem)
    }, tmo, elem, div.children())

}

function nextGroupText(elem) {
    elem = $(elem)
    var inc = parseInt(elem.data("inc"))
    elem.find("text").removeClass("text-on")
    if (inc === elem.find("text").length) inc = 0
    setTimeout(function (elem) {
        $(elem).addClass("text-on")
    }, 500, elem.find("text")[inc])
    elem.data("inc", inc + 1)
}

var __mediaElementOptions = {}

var __audioContexts = {}

async function checkMediaElements() {

    var mps = $(".mediaplayer")

    if (mps.length === 0) return false

    setTimeout(checkMediaElements, 40)



    mps.forEach(async function (mp) {
        mp = $(mp)
        var id = mp.data("media-id")
        var data = {}
        try {
            data = await $.get("/data/mediaplayer-" + id + ".json")
        } catch (error) {

        }

        if (__mediaElementOptions[id]) {
            if (JSON.stringify(__mediaElementOptions[id]) === JSON.stringify(data)) {
                return false
            }
        }

        __mediaElementOptions[id] = data

        if (data.mediatype === 'audio') {
            $(mp).find(".audioplayer").show()
            $(mp).find(".videoplayer").hide()
            $(".videoplayer video").forEach(a => a.pause())


            if (!__audioContexts[id]) {
                var AudioContext = window.AudioContext || window.webkitAudioContext
                var ctx = new AudioContext()
                __audioContexts[id] = { ctx }

                var aud2 = $("<audio />").addClass("audio-" + id)
                $("body").append(aud2)
                __audioContexts[id].audioElem = aud2[0]
                var track = ctx.createMediaElementSource(aud2[0])
                __audioContexts[id].track = track
                track.connect(ctx.destination)
                var vis = mp.find(".audioplayervisualiser")

                for (var i = 0; i < 16; i++) {
                    vis.prepend($("<div />"))
                }
                var analyser = ctx.createAnalyser()
                analyser.fftSize = 32

                __audioContexts[id].analyser = analyser
                track.connect(analyser)

                var c = $(vis).find("div")

                setInterval(updateMediaPlayerVisuals, 120, id, vis, c)
                setInterval(updateMediaPlayerTime, 500, id, vis)


            }

            var vis = mp.find(".audioplayervisualiser")


            var aud = $(".audio-" + id)

            aud[0].pause()
            aud[0].currentTime = 0
            aud.children().remove()
            aud.append($("<source />").attr("src", data.url))
            aud[0].currentTime = parseFloat(data.startat)
            aud[0].volume = parseFloat(data.volume) / 100
            aud[0].play()





        }

        if (data.mediatype === 'video') {

            var vid = $(mp).find(".videoplayer").show().find("video")


            $("audio").forEach(a => a.pause())


            vid[0].pause()

            vid.children().remove()
            vid.append($("<source />").attr("src", data.url))
            vid[0].currentTime = parseFloat(data.startat)
            vid[0].volume = parseFloat(data.volume) / 100
            vid[0].play()

        }

    })


}

function updateMediaPlayerVisuals(id, vis, c) {

    var a = __audioContexts[id].analyser
    var data = new Uint8Array(a.frequencyBinCount);
    a.getByteFrequencyData(data)

    var av = 0.0
    for (var i = 0; i < data.length; i++) {
        av = (av * 1.8) + ((Math.max(0, data[i] - 100) * 1.3))
        av = av / 2
        c[i].style.height = av.toString() + 'px'
        c[i].style.backgroundColor = 'hsl(' + Math.floor((av / 200) * 360) + ', 100%, 33%)'
    }

}
function updateMediaPlayerTime(id, vis) {

    var sa = parseFloat(__mediaElementOptions[id].startat)
    var ea = parseFloat(__mediaElementOptions[id].endat)
    if (ea === -1) {
        ea = __audioContexts[id].audioElem.duration
    }
    var secs = ea - __audioContexts[id].audioElem.currentTime

    var pos = Math.min(((__audioContexts[id].audioElem.currentTime - sa + 1) / (ea - sa)) * 100, 100)

    $(vis).find("position").css("margin-left", pos.toString() + "%")

    var mins = Math.floor(secs / 60)

    var time = mins.toString().padStart(2, "0") + ":" + Math.floor(secs - (mins * 60)).toString().padStart(2, "0")
    $(vis).find(".audiotime").text(time)

    if (secs <= 0.1) {
        __audioContexts[id].audioElem.pause()
        var oe = __mediaElementOptions[id].onended
        if (oe) {
            $.post("/api/savejson", { name: "runSequence", data: { name: "runSequence", sequence: oe, rnd: Math.random() } })
        }
    }


}