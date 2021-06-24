var changeScene = async function (options) {

    await sendObsCommand('SetCurrentTransition', {
        'transition-name': options["transition-name"]
    })

    await sendObsCommand('SetTransitionDuration', {
        'duration': parseInt(options["duration"])
    })
    await sendObsCommand('SetCurrentScene', {
        'scene-name': options["scene-name"]
    })

}

changeScene.new={
    "scene-name": "",
    "transition-name": "Luma Wipe",
    "duration": 400
}

changeScene.params = [{
    dispName: "Scene Name",
    name: "scene-name",
    type: "select",
    lookupList: "scenes"
},
{
    dispName: "Transition Name",
    name: "transition-name",
    type: "select",
    lookupList: "transitions"
},
{
    dispName: "Transition Duration (ms)",
    name: "duration",
    type: "number"
}]

__plugins.push(changeScene)