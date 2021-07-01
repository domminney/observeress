var express = require('express')
var formidable = require('express-formidable')
var fs = require('fs')
var cors = require('cors')
const OBSWebSocket = require('obs-websocket-js');

var app = express()
app.use(express.static('public'))
app.use(cors())
app.use(formidable())

process.env.PORT = 4816


app.post("/api/sendobscommand", async (req, res) => {

    var opts = {}

    try {
        opts = req.fields.options
    } catch (error) {
    }

    try {
        await sendOBSCommand(req.fields.cmd, opts, req.fields.connopts)
    } catch (error) {
        res.send("Error")
        return
    }

    res.send("OK")

})

app.post("/api/getobsresponse", async (req, res) => {

    var opts = {}

    try {
        opts = req.fields.options
    } catch (error) {
    }

    try {
        getOBSResponse(req.fields.cmd, opts, res, req.fields.connopts)
    } catch (error) {
        res.send("ERROR")
        return
    }

})

app.get("/api/programmes", function (req, res) {

    fs.readdir(__dirname + "/public/programmes", function (err, data) {
        res.send(JSON.stringify(data.filter(elem => elem.slice(-5) === '.json')))
    })


})

function dateToSQL(ds, ts, date) {
    ds = ds ?? "-"
    ts = ts ?? ":"
    date = date ?? new Date()
    var pad = function (num) { return ('00' + num).slice(-2) }
    var dt = date.getUTCFullYear() + ds +
        pad(date.getUTCMonth() + 1) + ds +
        pad(date.getUTCDate()) + ' ' +
        pad(date.getUTCHours()) + ts +
        pad(date.getUTCMinutes()) + ts +
        pad(date.getUTCSeconds())

    return dt

}

app.post("/api/saveprogramme", async (req, res) => {


    var dt = dateToSQL("-", "-")

    var name = req.fields.name ?? 'Default'

    try {
        fs.renameSync(__dirname + "/public/programmes/" + name, __dirname + `/public/programmes/backups/${name.replace(".json", "")} - ${dt}.json`)
    } catch (error) {
        console.log(error)
    }

    req.fields.data.lastUpdate = dt
    await fs.promises.writeFile(__dirname + "/public/programmes/" + name, JSON.stringify(req.fields.data))

    res.send("OK")

})


app.post("/api/savejson", async (req, res) => {


    await fs.promises.writeFile(__dirname + "/public/data/" + req.fields.name + ".json", JSON.stringify(req.fields.data))

    res.send("OK")

})



app.get("/api/pluginlist", function (req, res) {


    fs.readdir(__dirname + "/public/plugins", function (err, data) {
        res.send(JSON.stringify(data.filter(elem => elem.slice(-7) === '.plugin')))
    })


})

async function sendOBSCommand(cmd, opts, connopts) {

    connopts = connopts ?? { address: 'localhost:4444' }

    const obs = new OBSWebSocket()
    obs.connect(connopts).then(() => {
        obs.send(cmd, opts)
        obs.disconnect()
    }).catch(function (err) {
        console.log(err)
    })
}

async function getOBSResponse(cmd, opts, res, connopts) {

    connopts = connopts ?? { address: 'localhost:4444' }
    // console.log([cmd, opts, connopts])

    const obs = new OBSWebSocket()
    obs.connect(connopts).then(() => {
        obs.sendCallback(cmd, opts, function (err, data) {
            obs.disconnect()
            res.send(JSON.stringify(data))
        })
    }).catch(function (err) {
        console.log(err)
        res.send("ERROR")
    })
}


app.listen(process.env.PORT, function () {
    console.log('OBServerEss listening on ' + process.env.PORT)
})