var bgAudio = async function (options) {

    console.log(options)
    $.post("/api/savejson",{name:"bgaudio",data:options})
   
}

bgAudio.new={
    "url": "",
    "volume": "3"
}

bgAudio.params = [{
    dispName: "Audio File",
    name: "url",
    type: "text"
},
{
    dispName: "Volume (0-100)",
    name: "volume",
    type: "number"
}]

__plugins.push(bgAudio)