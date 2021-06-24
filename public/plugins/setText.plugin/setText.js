var setText = async function (options) {

    if (options.text==='!prompt'){
        options.text=prompt("text")
    }

    $.post("/api/savejson",{name:options.name+'-text',data:options})
   
}

setText.new={
    "name": "headline",
    "text": ""
}

setText.params = [{
    dispName: "Text Element ID",
    name: "name",
    type: "text"
},
{
    dispName: "Text",
    name: "text",
    type: "text"
}]

__plugins.push(setText)