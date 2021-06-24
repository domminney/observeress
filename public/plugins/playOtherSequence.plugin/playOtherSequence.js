var playOtherSequence = async function (options) {

    playSequence(options.name)
   
}

playOtherSequence.new={
    "name": ""
}

playOtherSequence.params = [{
    dispName: "Sequence",
    name: "name",
    type: "select",
    lookupList: "sequences"
}]

__plugins.push(playOtherSequence)