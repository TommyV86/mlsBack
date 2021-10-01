const http = require('http')
let express = require("express");
const app = express();
const bdd = require('./bdd')
const cors = require('cors');
const nodemailer = require('nodemailer')
const ObjectId = require('mongodb').ObjectID
const { v1: uuidv1, v4: uuidv4 } = require('uuid');


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



// ------------------user routers------------------//



app.post('/signup', async req => {
    //les variables font office d'objet user
    let {firstName, lastName, email, password, token} = req.body

    try {
        await db.collection('User').insertOne({
            firstName: firstName, 
            lastName: lastName, 
            email: email, 
            password: password, 
            token: token
        })
        console.log(' *** user inserted *** ')
    } catch (err) {
        console.log(err)
    }
})

app.get('/users', async () => {
    try {
        const users = await db.collection('User').find({}).toArray()
        console.log(' *** list finded *** ')
        console.log(users)
    } catch (err) {
        console.log(err)
    }
})

app.post('/connexion', async (req, res) => {
    // les variables font référence aux valeurs formik
    let email = req.body.email
    let password = req.body.password

    try {
        // code appliqué si les mails et mdp correspondent
        const userLogged = await db.collection('User').findOne({ 
            email: email, 
            password: password 
        })
    
        if(userLogged.email === email && userLogged.password === password){
            console.log(" -------  connection réussie !  ------- ")
            console.log("")
            console.log(`***user*** : ${email} ***password*** : ${password}`)
            console.log("")
            console.log(" -------  info de l'user dans la database  ------- ")
            console.log(userLogged)

            const dbUserName = userLogged.firstName
            const dbUserMail = userLogged.email

            // stocker dans un objet et l'envoyer en json 
            // avec un return pour pouvoir l'utiliser dans le front 
            let objUserDb = { dbUserName, dbUserMail }
            return res.status(200).json(objUserDb)

        } else {
            console.log('xxx erreur de connexion xxx')
            // debug
            console.log(" ---DEBUG---")
            console.log(userLogged)
            console.log(email)
            console.log(password)
            return res.status(400)
        }
       
    } catch(e) {
        console.log(" xxx condition non respectée xxx")
        throw e
    }
})

app.delete('/delete', async req => {
    //la variable fait office d'objet user
    let reqBobyId = req.body._id
    let id = ObjectId(reqBobyId)

    try {
        await db.collection('User').deleteOne({_id: id})
        console.log(`user with id ${id} deleted`)
    } catch(e) {
        console.log(e.message)
        throw e
    }
})

app.post('/password', async req => {

    // valeur qui est rentrée dans le front
    let currentMail = req.body.email
    try {
        // req pour trouver le mail dans la db qui correspond au mail tapé dans le front
        const userMail = await db.collection('User').findOne({ email: currentMail })
        
        // code appliqué si les mails correspondent
        if(userMail.email === currentMail){

            let uniqueCodev4 = uuidv4()

            // attribution d'un token pour servir d'index pour le changement de mdp
            db.collection('User').updateOne({ email: currentMail }, { $set: {token: uniqueCodev4} })

            // identifiants d'expediteur provisoire
            let sendMailer = 'mlsmail59000@gmail.com'
            let passwordMailer = 'mls123456'


            // creation de l'expediteur
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: sendMailer,
                    pass: passwordMailer
                }
            })
            
            // creation du contenu de mail
            let mailOptions = {
                from: sendMailer,
                to: currentMail,
                subject: 'Redéfinition du mdp',
                text: `Veuillez redéfinir votre mdp en cliquant sur le lien 
                http://localhost:3000/newPassword/?token=${uniqueCodev4}`
            }

            // envoi du mail par l'expediteur
            transporter.sendMail(mailOptions, (e, info) => {
                if(e){
                    console.log('not sent')
                    console.log(e)
                } else {
                    console.log('Email sent: ' + info.response)
                }
            })
            console.log(`user mail finded : ${currentMail}`)
        } else {
            console.log(`this mail ${currentMail} doesn't exist`)
        }
    } catch (e) {
        console.log("error 1")
        console.log(e.message)
    }
})


app.put(`/newPassword/:token`, async req => {
    let newPassword = req.body.password
    let token = req.params.token

    
    try {
        await db.collection("User").updateOne(
            { token: token }, 
            { $set: {password: newPassword} })
        console.log(`token : ${token}`)
        console.log(` *** password updated *** : ${newPassword}`)
    } catch (e) {
        console.log(e.message)
    }
})



// ------------------topic routers------------------//



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
        const result = await db.collection("reponse").updateMany({ _id: ObjectId }, { $set: {texte_reponse : newVal} }, { upsert: true })
        // console.log(`reponse updated : ${date_reponse}`)
        res.status(200).json(result)
    } catch (e){
        console.log(e.message)
        throw e
    }
})

app.delete('/reponseDelete', async (req, res) => {

    try {
        const result = await db.collection('reponse').deleteOne({_id : ObjectId })
        // console.log(`reponse deleted : ${date_reponse}`)
        res.status(200).json(result)
    } catch(e) {
        console.log(e.message)
        throw e
    }
})

console.log("----------------------------------------------")
console.log(" Listen to port => " + port._connectionKey)