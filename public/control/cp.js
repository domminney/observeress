var __plugins = []
var __lookupLists = {}

__lookupLists.transitions = ['Fade', 'Cut', 'Luma Wipe']

function selectPanel(pnl, t) {
    $(".header .menu button").removeClass("button-selected")
    $(t).addClass("button-selected")
    $(".panel").hide()
    $(".panel-" + pnl).show()
}

startApp();

__programmes = []
__obs__connopts = { address: 'localhost:4444' }

var programmeName, programme

async function startApp() {
    console.log("app starting")
    await attachPlugins()
    programmeName = $(".programme-name")
    programmeName.toFormItem()
    programmeName.on("change", function () {
        $.localStorage("programme-name", $(this).val())
        window.location.reload()
    })
    await updateScenesList()
    await updateProgrammeNames()
    await loadProgramme()
   
    setInterval(checkForSequence, 100)

}

var __lastSeqRnd = 0.0



async function checkForSequence() {
    var data = await $.get("/data/runSequence.json")
    if (data.rnd !== __lastSeqRnd) {
        __lastSeqRnd = data.rnd
        if (data.sequence) {
            playSequence(data.sequence)
            $.post("/api/savejson", { name: "runSequence", data: { name: "runSequence", data: "", rnd: Math.random() } })
        }
    }
}

async function updateScenesList() {
    var sl = await $.post("/api/getobsresponse", { cmd: 'GetSceneList', opts: {} })
    __lookupLists.scenes = sl.scenes.map(s => s.name)
    __lookupLists.scenes.sort((a, b) => { if (a.toLowerCase() > b.toLowerCase()) { return 1 } else { return -1 } })
}

document.onmousemove = handleMouseMove

function handleMouseMove(event) {
    var eventDoc, doc, body

    event = event || window.event

    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document
        doc = eventDoc.documentElement
        body = eventDoc.body
        event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0)
        event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0)
    }

}

async function attachPlugins() {
    var pluginlist = await $.get("/api/pluginlist")
    pluginlist.forEach((plugin) => {
        $.addScript(`/plugins/${plugin}/${plugin.replace(".plugin", ".js")}`)
    })
}

async function updateProgrammeNames() {
    __programmes = await $.get("/api/programmes")
    programmeName.children().remove()
    __programmes.forEach((elem) => {
        var opt = $("<option />")
        opt.attr("value", elem)
        opt.text(elem?.toString().replace(".json", ""))
        programmeName.append(opt)
    })
    var selected = $.localStorage("programme-name")
    if (selected === '') {
        selected = programmeName.firstChild().attr("value")
        $.localStorage("programme-name", selected)
    }
    programmeName.val(selected)

}

async function loadProgramme() {
    programme = await $.get("/programmes/" + programmeName.val())
    refreshSequences()
    refreshButtonPanels()
    __lookupLists.sequences = function () {
        var sns = ['', ...programme.sequences.map(s => s.name)].sort(function (a, b) { if (a.toLowerCase() > b.toLowerCase()) { return 1 } else { return -1 } })
        return sns
    }
}

async function saveProgramme() {
    $.post("/api/saveprogramme", { name: programmeName.val(), data: programme })
}

function refreshSequences() {
    var bg = $(".panel-sequences .buttongrid")
    bg.children().remove()

    var btexts = []

    programme.sequences.forEach((seq) => {
        btexts.push(seq.name)
        var button = $("<button />")
        button.text(seq.name)
        button.data("name", seq.name)
        bg.append(button)
        button.click(function () {
            editSequence($(this).data("name"))
        })
    })

    $(".scenebuttons").children().remove()

    __lookupLists.scenes.forEach((scn) => {
        var button = $("<button />")
        button.text(scn)
        if (btexts.includes(scn)) button.addClass("redbutton")
        button.data("name", scn)
        $(".scenebuttons").append(button)
        button.click(function () {
            addSequenceFromScene($(this).data("name"))
        })
    })
}

var px, py, inbpmove


function refreshButtonPanels() {
    var bps = $(".buttonpanels")
    bps.children().remove()
    programme.buttonPanels.forEach((bp) => {

        var width = bp.width ?? 32
        var height = bp.height ?? 20

        var div = $("<div />").addClass(['buttongrid', 'buttonpanel']).appendTo(bps)
        div.width(width).data("width", width)
        div.height(height).data("height", height)

        var sizeDiv = $("<div />").addClass("sizeicon").addClass("nodrag").appendTo(div)

        sizeDiv.on("mousedown", function () {
            inbpmove = $(this).parent()
            px = event.pageX
            py = event.pageY
            event.stopPropagation()
            $(this).parent().attr("draggable","false")
        })

        $(document).on("mousemove", function () {
            if (inbpmove) {
                inbpmove.width(parseInt(inbpmove.data("width")) + parseInt((event.pageX - px) / 16))
                inbpmove.height(parseInt(inbpmove.data("height")) + parseInt((event.pageY - py) / 16))
            }
        })

        $(document).on("mouseup", function () {
            if (inbpmove) {
                inbpmove.attr("draggable","true")
                inbpmove.data("width", parseInt(inbpmove.data("width")) + parseInt((event.pageX - px) / 16))
                inbpmove.data("height", parseInt(inbpmove.data("height")) + parseInt((event.pageY - py) / 16))
                inbpmove = undefined
                saveButtons()

            }
            inbpmove = undefined
        })

        div.on("contextmenu", function (ev) {
            ev.preventDefault()
            var newbtn = $("<button oncontextmenu='editButton(this); event.preventDefault(); event.stopPropagation();'></button>").text("New Button")
            $(this).append(newbtn)
            newbtn.click(function () {
                playSequence($(this).data("sequence"))
            })
            editButton(newbtn)
            return false
        })
        var h2 = $("<h2 contenteditable='true' />").addClass("nodrag").text(bp.name)
        h2.appendTo(div)


        h2.on("blur", function () {
            console.log($(this).text())
            $(this).data("name", $(this).text())
            saveButtons()

        })
        div.data("name", bp.name)
        bp.buttons.forEach((but) => {
            var button = $("<button oncontextmenu='editButton(this); event.preventDefault(); event.stopPropagation();' />")
            button.text(but.text)
            button.css(but.css)
            button.data("sequence", but.sequence)
            for (var i = 0; i < 8; i++) {
                button.data("param-" + i, but["param" + i])
            }
            div.append(button)
            button.click(function () {
                __btnParams = []
                for (var i = 0; i < 8; i++) {
                    __btnParams.push($(this).data("param-" + i))
                }
                playSequence($(this).data("sequence"))
            })
        })
    })

    enableDragSort('.buttonpanels')

    enableDragSort('.buttonpanel')

}

var __btnSel

var __btnParams = []

function editButton(btn) {

    __btnSel = $(btn)

    var editContainer = $("<div />").addClass(['panel-fullscreen', 'btneditor']).appendTo("body")
    editContainer.append(`
        <div class='fixedwidth'>
            <h1>Button Editor</h1>            
            <div class='buttonform'>
                <input type="text" data-label="Button Text" class='buttontext bfi' />
                <select data-label="Button Action" class='buttonaction bfi' />
                <input type="color" data-label="Background Color" class="buttonbgcolor bfi" />
                <input type="color" data-label="Text Color" class="buttontextcolor bfi" />
                <input type="text" data-label="Param 1" class='param0 bfi' />
                <input type="text" data-label="Param 2" class='param1 bfi' />
                <input type="text" data-label="Param 3" class='param2 bfi' />
                <input type="text" data-label="Param 4" class='param3 bfi' />
                <input type="text" data-label="Param 5" class='param4 bfi' />
                <input type="text" data-label="Param 6" class='param5 bfi' />
                <input type="text" data-label="Param 7" class='param6 bfi' />
                <input type="text" data-label="Param 8" class='param7 bfi' />

                <button class='dq--formitem' onclick="saveButton()" class='bfi'>Save Button</button>  
                <button class='dq--formitem' onclick="__btnSel.remove(); saveButtons()" class='bfi'>Delete Button</button> 
            </div>
        </div>
        <div class='close' onclick='$(this).parent().remove()'></div>    
        
    `)

    programme.sequences.forEach((elem) => {
        var opt = $("<option />").text(elem.name).attr("value", elem.name).appendTo(editContainer.find(".buttonaction"))
    })
    try {
        editContainer.find(".buttonbgcolor").val(rgb2hex(__btnSel[0].style.backgroundColor))
        editContainer.find(".buttontextcolor").val(rgb2hex(__btnSel[0].style.color))

    } catch (error) {
        editContainer.find(".buttonbgcolor").val("#222222")
        editContainer.find(".buttontextcolor").val("#ffffff")
    }

    for (var i = 0; i < 8; i++) {
        editContainer.find(".param" + i).val(__btnSel.data("param-" + i))
    }

    editContainer.find(".buttontext").val(__btnSel.text())
    editContainer.find(".buttonaction").val(__btnSel.data("sequence"))

    $(".bfi").toFormItem()

}

var hexDigits = new Array
    ("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");


function rgb2hex(rgb) {
    if (rgb.startsWith("#")) return rgb
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex(x) {
    return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}

function saveButton() {
    __btnSel.text($(".buttontext").val())
    __btnSel.data("sequence", $(".buttonaction").val())
    __btnSel[0].style.color = $(".buttontextcolor").val()
    __btnSel[0].style.backgroundColor = $(".buttonbgcolor").val()
    for (var i = 0; i < 8; i++) {
        __btnSel.data("param-" + i, $(".param" + i).val())
    }
    saveButtons()
}

function saveButtons() {
    programme.buttonPanels = []
    $(".buttonpanels .buttonpanel").forEach((bp) => {
        var buttonPanel = {
            "width": parseInt($(bp).data("width")),
            "height": parseInt($(bp).data("height"))
        }
        buttonPanel.name = $(bp).find("h2").text()
        buttonPanel.buttons = []
        $(bp).find("button").forEach((b) => {
            var button = {
                "text": $(b).text(),
                "sequence": $(b).data("sequence"),
                "css": {
                    "backgroundColor": $(b)[0].style.backgroundColor,
                    "color": $(b)[0].style.color
                }
            }
            for (var i = 0; i < 8; i++) {
                button["param" + i] = $(b).data("param-" + i)
                if (button["param" + i] === 'null') button["param" + i] = ''
            }
            buttonPanel.buttons.push(button)
        })

        programme.buttonPanels.push(buttonPanel)
    })

    $(".btneditor").remove()
    saveProgramme()

}
var __timeouts = []
var __timebarpos = 1
var __timebarduration = 1

function playSequence(sequenceName) {

    sequenceName = sequenceName ?? __seqSel.name

    __timeouts.forEach(to => clearTimeout(to))
    __timeouts = []

    var lastTime = 0.0
    __timebarduration = 1
    __timebarpos = 1

    var seq = programme.sequences.filter(s => s.name === sequenceName)[0]
    if (seq) {
        console.log(seq)
        seq.events.forEach((evt) => {
            evt.functionCalls.forEach((fc) => {
                var opts = JSON.parse(JSON.stringify(fc.options))

                Object.keys(opts).forEach((k) => {

                    if (opts[k].toString().startsWith("$") && opts[k].toString().slice(-1) === "$") {
                        opts[k] = __btnParams[parseInt(opts[k].slice(-2).replace("$", "")) - 1]
                    }

                })

                __timeouts.push(setTimeout(__plugins.find(f => f.name === fc.function), evt.time * 1000, opts))


                if (lastTime.toFixed(2) !== evt.time.toFixed(2)) {
                    __timeouts.push(setTimeout(function (t) {
                        __timebarpos = 0
                        __timebarduration = t * 1000
                    }, lastTime * 1000, evt.time - lastTime))
                    lastTime = evt.time
                }

            })
        })
    }
}

setInterval(updateTimeBar, 40)

var __lasttimebarpos;

function updateTimeBar() {

    if (__lasttimebarpos !== __timebarpos) {

        var w = Math.min(__timebarpos / __timebarduration, 1.0) * 100
        var tm = ((__timebarduration - __timebarpos) / 1000).toFixed(2) + "s"

        $('.eventprogress').width(w.toString() + "%").text(tm)

    }

    __lasttimebarpos = __timebarpos
    if (__timebarpos < __timebarduration) __timebarpos += 40

}

async function sendObsCommand(cmd, options) {
    await $.post("/api/sendobscommand", {
        cmd, options, connopts: __obs__connopts
    })
}

var __seqSel

function editSequence(s) {
    var seqEdit = $("<div />").addClass(["panel-fullscreen", "seqedit"]).appendTo("body")
    seqEdit.append(`
        <h1>Events Editor - </h1>
        <div class='menu'>
            <button onclick="saveSequence()">Save Sequence</button>
            <button onclick="playSequence()">Play Sequence</button>
            <select class='newSeqEvent'></select>
            <button onclick="addSequenceEvent()">Add Sequence Event</button>
        </div>
        <div class='eventslist spreadsheet'></div>
        <div class='close' onclick='$(this).parent().remove()'></div>    
    `)

    seqEdit.find("h1").append($("<span />").text(s))

    __plugins.forEach((fn) => {
        $("<option />").text(fn.name).attr("value", fn.name).appendTo(".newSeqEvent")
    })

    __seqSel = programme.sequences.find(elem => elem.name === s)

    var time = 0

    __seqSel.events.forEach((evt) => {
        time = parseFloat(evt.time)
        var c = -1
        evt.functionCalls.forEach((fc) => {
            c++
            var eventContainer = $("<div />").data("arraypos", c).addClass("event-container")
            var row = $("<div class='spreadsheet-row'></div>").appendTo(eventContainer)
            row.append($("<label />").text("Offset mm:ss.xx"))


            row.append($("<input type='text' class='eventtime' />").val(Math.floor(time / 60)))
            row.append($("<input type='text' class='eventtime' />").val(time - (Math.floor(time / 60) * 60)))

            row.append($("<input type='text' class='eventfunction' readonly='true' />").val(fc.function))
            $('.eventslist').append(eventContainer)
            row.append($("<label />").text("Delete").addClass("delete").click(function () {
                $(this).parent().parent().remove()
            }))


            var plugin = __plugins.find(p => p.name === fc.function)
            if (plugin) {

                var paramGrid = $("<div class='spreadsheet-row spreadsheet-row-params' />").appendTo(eventContainer)
                plugin.params.forEach((param) => {
                    var label = $("<label></label>").text(param.dispName)
                    paramGrid.append(label)
                    var input
                    if (param.type === 'select') {
                        input = $("<select />")
                        opts = []

                        if (Array.isArray(param.lookupList)) {
                            opts = param.lookupList
                        } else {
                            if (typeof __lookupLists[param.lookupList] === 'function') {
                                opts = __lookupLists[param.lookupList]()
                            } else {
                                opts = __lookupLists[param.lookupList]
                            }

                        }

                        opts.forEach((opt) => {
                            var optHtml = $("<option />").text(opt).attr("value", opt).appendTo(input)
                        })

                    } else {
                        input = $("<input />")
                        input.attr("type", param.type)
                    }

                    input.data("name", param.name)
                    input.val(fc.options[param.name])
                    paramGrid.append(input)


                })
            }
        })
    })

}

function addSequenceEvent() {
    saveSequence()
    var en = $(".newSeqEvent").val()
    var newOpts = __plugins.find(fn => fn.name === en).new

    var newEvent = {
        "time": 0,
        "functionCalls": [
            {
                "function": en,
                "options": newOpts
            }
        ]
    }

    __seqSel.events.push(newEvent)
    __seqSel.events.sort(function (a, b) { return (a.time > b.time) ? 1 : -1 })
    $('.seqedit').remove()
    editSequence(__seqSel.name)

}

function saveSequence() {
    __seqSel.events = []

    $(".event-container").forEach((evtcnt) => {
        var time = (parseFloat($(evtcnt).find(".eventtime").first().val()) * 60) + (parseFloat($(evtcnt).find(".eventtime").last().val()))
        var fName = $(evtcnt).find(".eventfunction").val()

        var params = {}
        $(evtcnt).find('.spreadsheet-row-params').find("input,select").forEach((elem) => {
            params[$(elem).data("name")] = $(elem).val()
        })
        var evt = __seqSel.events.find(e => e.time === time)
        if (evt) {
            evt.functionCalls.push({
                "function": fName,
                "options": params
            })
            return
        }

        var newEvent = {
            "time": time,
            "functionCalls": [
                {
                    "function": fName,
                    "options": params
                }
            ]
        }

        __seqSel.events.push(newEvent)



    })

    __seqSel.events.sort(function (a, b) { if (parseFloat(a.time) > parseFloat(b.time)) { return 1 }; return -1 })

    saveProgramme()

}

function addSequence() {

    var seqName = prompt("New Sequence Name")
    if (seqName === '' || programme.sequences.find(s => s.name.toLowerCase() === seqName.toLowerCase())) {
        alert("Cannot create sequence with that name, it's either invalid or already exists")
        return false
    }

    programme.sequences.push({
        "name": seqName,
        "events": []
    })

    refreshSequences()
    saveProgramme()

}

function addSequenceFromScene(sn) {

    var seqName = prompt("New Sequence Name", sn)
    if (seqName === '' || programme.sequences.find(s => s.name.toLowerCase() === seqName.toLowerCase())) {
        alert("Cannot create sequence with that name, it's either invalid or already exists")
        return false
    }

    programme.sequences.push({
        "name": seqName,
        "events": [
            {
                "time": 0,
                "functionCalls": [
                    {
                        "function": "changeScene",
                        "options": {
                            "scene-name": sn,
                            "transition-name": "Luma Wipe",
                            "duration": "400"
                        }
                    }
                ]
            }
        ]
    })

    refreshSequences()
    saveProgramme()
}

function addPanel() {
    programme.buttonPanels.push({
        name: "New Panel",
        buttons: []
    })
    saveProgramme()
    refreshButtonPanels()
}


/* Made with love by @fitri
 This is a component of my ReactJS project
 https://codepen.io/fitri/full/oWovYj/ */

function enableDragSort(listClass) {
    const sortableLists = document.querySelectorAll(listClass)
    console.log(sortableLists)
    Array.prototype.map.call(sortableLists, (list) => { enableDragList(list) })
}

function enableDragList(list) {
    Array.prototype.map.call(list.children, (item) => { enableDragItem(item) })
}

function enableDragItem(item) {
    if ($(item).hasClass("nodrag")) return false
    item.setAttribute('draggable', true)
    item.ondrag = handleDrag
    item.ondragend = handleDrop
}

function handleDrag(item) {
    const selectedItem = item.target,
        list = selectedItem.parentNode, x = event.clientX, y = event.clientY

    selectedItem.classList.add('drag-sort-active')
    let swapItem = document.elementFromPoint(x, y) === null ? selectedItem : document.elementFromPoint(x, y)

    if (list === swapItem.parentNode) {
        swapItem = swapItem !== selectedItem.nextSibling ? swapItem : swapItem.nextSibling
        list.insertBefore(selectedItem, swapItem)
    }
}

function handleDrop(item) {
    item.target.classList.remove('drag-sort-active')
    saveButtons()
}
