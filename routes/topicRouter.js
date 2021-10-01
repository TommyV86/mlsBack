const http = require('http')
let express = require("express");
const app = express();
const bdd = require('../bdd');
const ObjectId = require('mongodb').ObjectID;
const cors = require('cors');


const port = http.createServer(app).listen(8080)
const uri = bdd.dbURI
const dbName = 'mls';
let db

bdd.MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
    if(err){
        console.log("----------------------------")
        console.log(" xxx Connection failed xxx ")
        console.log("----------------------------")

    } else {
        console.log("----------------------------------------------")
        console.log(" *** Connected successfully to server *** ")
        console.log("----------------------------------------------")

        db = client.db(dbName);
    } 
})

// créer une confiance entre le port du back et du front (axios)
app.use(cors())
// nécessaire pour le retour des données en json
app.use(express.json())


// routes topic
app.post('/create', async (req, res) => {
    let {
        nom, 
        texte_topic, 
        image_topic, 
        date_topic, 
        vote_topic
    } = req.body

    try {
        const newTopic = await db.collection('topic').insertOne({
            nom: nom, 
            texte_topic: texte_topic, 
            image_topic: image_topic, 
            date_topic: date_topic, 
            vote_topic: vote_topic, 
        })

        console.log(` *** new topic's name created *** : ${nom}`)
        res.status(200).json(newTopic)
    } catch (err) {
        throw err
    }
})

app.get('/forum', async (req, res) => {

    try {
        const topics = await db.collection('topic').find({}).toArray()
        console.log("topic displayed")
        return res.json(topics)

    } catch (error) {
        throw error
    }
})

app.put('/modifierTopic/:idTopic', async req => {
    let id = ObjectId(req.params.idTopic)
    let newVal = req.body.texte_topic
    try {
        await db.collection("topic").updateOne(
            { _id: id },
            { $set: {texte_topic: newVal} }
        )
        console.log(` *** topic modifié via l'id *** : ${id} `)
    } catch (err) {
        throw err
    }
})

app.delete('/supprimer', async (req, res) => {
    let id = ObjectId(req.body._id)

    try {
        const topic = await db.collection('topic').deleteOne({_id: id})
        console.log(` *** topic supprimé via id *** : ${id}`)
        res.status(200).json(topic)
    } catch (err) {
        throw err
    }
})

console.log("----------------------------------------------")
console.log(" Listen to port => " + port._connectionKey)