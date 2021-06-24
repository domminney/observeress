var mediaPlayer = async function (options) {

    $.post("/api/savejson",{name:"mediaplayer-"+options.mediaid,data:options})
   
}

mediaPlayer.new={
    "mediaid": "0",
    "mediatype":"audio",
    "url":"",
    "onended":"",
    "startat":"0",
    "endat":"-1",
    "volume":0.9
}

mediaPlayer.params = [{
    dispName: "Media Player ID",
    name: "mediaid",
    type: "number"
},
{
    dispName: "Media Type",
    name: "mediatype",
    type: "select",
    lookupList:["audio","video"]
},
{
    dispName:"File",
    name:"url",
    type:"text"
},
{
    dispName:"Volume (0-100)",
    name:"volume",
    type:"number"
},
{
    dispName:"Sequence To End",
    name:"onended",
    type:"select",
    lookupList:"sequences"
},
{
    dispName:"Start At (s)",
    name:"startat",
    type:"text"
},
{
    dispName:"End at (s) -1 for auto",
    name:"endat",
    type:"text"
}]

__plugins.push(mediaPlayer)