const http = require('http')
let express = require("express");
const app = express();
const bdd = require('../bdd')
const cors = require('cors');
const nodemailer = require('nodemailer')
const objectId = require('mongodb')
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

// routes part

app.post('/signup', async req => {
    //les variables font office d'objet user
    let {firstName, lastName, email, token} = req.body

    let pswd = req.body.passwordHash
    let salt = crypto.randomBytes(16).toString('hex')
    let pswdHash = crypto.createHmac('sha256', pswd).update(salt).digest('hex')

    try {
        await db.collection('User').insertOne({
            firstName: firstName, 
            lastName: lastName, 
            email: email, 
            password: pswdHash, 
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
    let id = objectId.ObjectID(reqBobyId)

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

            // debug 
            // console.log(" ---DEBUG---")
            // console.log("----------------------------------")
            // console.log(" ** uuidv4 ** : " + uniqueCodev4)
            // console.log(" ** updatedTokenField ** : " + updateToken)
            // console.log("----------------------------------")
            // console.log("db user mail : " + userMail.email)

            // identifiants d'expediteur provisoire
            let sendMailer = ''
            let passwordMailer = ''


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


console.log("----------------------------------------------")
console.log(" Listen to port => " + port._connectionKey)