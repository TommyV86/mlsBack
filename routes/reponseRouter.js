const http = require('http')
let express = require("express");
const app = express();
const bdd = require('../bdd')
const cors = require('cors')
const objectID = require('mongodb').ObjectID

const port = http.createServer(app).listen(8080)
const uri = bdd.dbURI
const dbName = 'mls';
let db

bdd.MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) =>{
    console.log("Connected successfully to server");
    db = client.db(dbName);
})

app.use(cors())

app.use(express.json())


// ------------------response routers------------------//
app.post('/reponseCreate', async (req,res) => {
    let texte_reponse = req.body.texte_reponse
    let image_reponse = req.body.image_reponse
    let image_response = req.body.image_response
    let date_reponse = req.body.date_reponse
    let vote_reponse = req.body.vote_reponse
    try {
        const usrs = await db.collection('reponse').insertOne({texte_reponse: texte_reponse, image_reponse: image_reponse, image_response: image_response, date_reponse: date_reponse, vote_reponse: vote_reponse})
        console.log('reponse inserted')
        res.status(200).json(usrs)
    } catch (err) {
        console.log(err)
        throw err
    }
})

app.put('/reponseModif', async (req, res) => {
    let newVal = req.body.texte_reponse

    try {
        const result = await db.collection("reponse").updateMany({ _id: objectID }, { $set: {texte_reponse : newVal} }, { upsert: true })
        // console.log(`reponse updated : ${date_reponse}`)
        res.status(200).json(result)
    } catch (e){
        console.log(e.message)
        throw e
    }
})

app.delete('/reponseDelete', async (req, res) => {

    try {
        const result = await db.collection('reponse').deleteOne({_id : objectID })
        // console.log(`reponse deleted : ${date_reponse}`)
        res.status(200).json(result)
    } catch(e) {
        console.log(e.message)
        throw e
    }
})

console.log(port._connectionKey)