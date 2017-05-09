## Mongoose passport

För att enkelt implementera autentisering i _node_-projekt använder man oftast [**Passport.js**](http://passportjs.org/) som förser en med ett väldigt generell lösning på autentisering. Det man gör med **Passportjs** är att man tillämpar en viss **strategi** beroende på _hur_ man vill autentisera. Vi vill enbart autentisera mot vår _MongoDB_-databas som ligger lokalt eller via _mLab_.

Denna strategi heter just [`passport-local`](https://github.com/jaredhanson/passport-local) då man kan autentisera sig med användarnamn och lösen lokalt. **Men** eftersom vi har _mongoose_ finns det en ännu enklare lösning: [**`passport-local-mongoose`**]() som är en plugin till [`mongoose`]()


## `.env`

Som en dependency finns [`dotenv`](https://github.com/bkeepers/dotenv) som läser in **environment variables**
from en `.env`-fil. Dessa kan vi sedan enkelt komma åt i vår kod via `process.env.VARIABLE`.

Denna fil ska innehålla vår känsliga information och ska läggas till i `.gitignore`. Så koden läser från den här filen men denna fil kan varje enskild användare skapa med sina egna credentials.

Skapa en fil som heter `.env` (eller kopiera `.env.example`) i din root-mapp som har följande innehåll men byter ut värdena till dina egna värden, din egen databas-url t.ex.:

```
DB_HOST=mongodb://user:password@127.0.0.1:27017/databaseName
SESSION_SECRET=my big secret
PORT = 4000
```

## Config

Vi behöver först installera själva _passport_ samt _passport-local-mongoose_ som ska sköta själva autentiseringen.

```bash
npm install --save passport passport-local-mongoose
```

När vi väl har autentiserat så måste vi spara användaren i en **session** så att _Express_ kommer ihåg att användaren är inloggad när vi navigerar mellan olika sidor. Sedan är det också bra att ha [`cookie-parser`](https://github.com/expressjs/cookie-parser) som fungerar som `body-parser` fast för _cookies_. Med `cookie-parser` sparas våra cookies enkelt i `req.cookies`. Detta var förut inbyggt i _Express_ men har nu lagts i ett separata paket:

```
npm install --save express-session cookie-parser
```

Använd dessa paket, sätt `secret` till vadsom:

```javascript
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET, //from .env-file
  resave: true,
  saveUninitialized: false
}));
```


Initiera vår **local strategy** och hur _passport_ ska lagra vår användare i sessionen. Vi behöver _mongoose_-modellen och själva _passport_.

```javascript
const passport = require('passport');
const User = require('./User.js');

app.use(passport.initialize());                 //Start passport
app.use(passport.session());                    //Used to set the session
passport.use(User.createStrategy());            //Create the local strategy

//Used to set the user to the cookie, save to session
passport.serializeUser(User.serializeUser()); 
//Used to get the user from the cookie, get the session
passport.deserializeUser(User.deserializeUser()); 
```


Vi måste även säga åt vår **Model** i _mongoose_ att använda denna strategi. Om vi utgår från att vi har en `User`-model med `username` och `password` så lägger vi till pluginen på detta enkla sätt:

```javascript
//User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
    username: String,
    password: String
});

User.plugin(passportLocalMongoose); //Add the plugin

module.exports = mongoose.model('User', User);

```

## Authenticate

Vid lyckad autentisering via `passport.authenticate('local')` kommer `passport` att spara användaren i `req.user`. Efter autentisering behöver du enbart kolla om denna variabel är satt för att se om användaren är inloggad eller ska ha tillgång till en resurs eller route.

`passport.authenticate('local')` är alltså en middleware som körs när vi går till dessa olika routes. Vi behöver dock bara köra dessa vid login. Vi behöver inte använda denna middleware om användaren är inloggad.

###### Skapandet av användare

Till vår _moongoose_-model har vi nu `register` kopplat via den plugin som vi installerade tidigare. Detta kommer att sköta myckat av det nitty gritty inre grejerna. Vi behöver bara se till så att det är en ny användare och att den sparas i rätt samling `user`. Om det misslyckas skickas vi tillbaka till samma sida. Om det lyckas så omdirigeras vi till `index` och `req.user` sätts till vår nya användare, d.v.s. vi är inloggade. Error-hanteringen får vi dock sköta själva :)

```javascript
app.post('/register', (req, res) => {
    User.register(new User({ username : req.body.username }), req.body.password, (error, user) => {
      if (error) {
        res.render('register', { user : user });
      }
      passport.authenticate('local')(req, res, ()=> {
        res.redirect('/'); //on success, redirect with req.user set
      });
    });
  });

```

###### Login av användare

Använd `passport.authenticate('local')` som middleware vid login för att sätta `req.user`.

```javascript
app.post('/login', passport.authenticate('local'), (req, res) => {
    res.redirect('/');  //on success, redirect with req.user set
});
```

###### Kolla om en användare är inloggad

Vi kan nu kolla om en användare är inloggad med en egen middleware-funktion som kollar om `req.isAuthenticated()`. Om användare finns fortsätter vi till den route vi skulle gå till med `next()`. Om inte användaren finns blir vi omdirigerade till `index` i detta fall.

```javascript
//middleware function
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next(); //go through
    res.redirect('/'); //if not, redirect to index
}
```

```js
//Usage
app.get('/userArea', isLoggedIn ,(req,res) => {
    res.render('userArea'); //will reach 'userArea' if req.user
});
```


### Filstruktur

* `models`  - Mongoose-modeller
  - `Account.js` - Användarmodellen
* `public`  - Statiska resurser
  - `css`
  - `js`
* `routes`  - `Express.Router()`-routes
  - `index.js` - `/`
  - `users.js` - `/users`
* `views`   - Template engine views
* `app.js`  - Server-filen
* `.env`    - Våra **environment variables**
