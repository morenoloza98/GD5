// Imports
const express = require('express');
const webRoutes = require('./routes/web');

// Session imports
let cookieParser = require('cookie-parser');
let session = require('express-session');
let flash = require('express-flash');
let passport = require('passport');

// Express app creation
const app = express();

//Socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Configurations
const appConfig = require('./configs/app');

// View engine configs
const exphbs = require('express-handlebars');
const hbshelpers = require("handlebars-helpers");
const { index } = require('./controllers/HomepageController');
const multihelpers = hbshelpers();
const extNameHbs = 'hbs';
const hbs = exphbs.create({
  extname: extNameHbs,
  helpers: multihelpers
});
app.engine(extNameHbs, hbs.engine);
app.set('view engine', extNameHbs);

// Session configurations
let sessionStore = new session.MemoryStore;
app.use(cookieParser());
app.use(session({
  cookie: { maxAge: 60000 },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: appConfig.secret
}));
app.use(flash());

// Configuraciones de passport
require('./configs/passport');
app.use(passport.initialize());
app.use(passport.session());

// Receive parameters from the Form requests
app.use(express.urlencoded({ extended: true }))

app.use('/', express.static(__dirname + '/public'));
// Routes
app.use('/', webRoutes);

// Socket.io server side

class Player {
  constructor(name, socket) {
    this.name = name;
    this.score = 0;
    this.a1 = '';
    this.a2 = '';
    this.a3 = '';
    this.socket = socket;
  }
  
  writePlayer() {
    document.write(this.name);
  }
}

class Board {
  constructor() {
    this.players = [];
  }
  
  addPlayer(player) {
    this.players.push(player);
  }
  
  showPlayers() {
    for(let i = 0; i < this.players.length; i++) {
      this.players[i].writePlayer();
    }
  }
}

let letterToCheck;
let players = [];

let board = new Board();

io.on("connection", function(socket) {
  let player = new Player("Player " + (board.players.length + 1), socket);
  board.addPlayer(player);
  socket.emit("playerName", {
    name: player.name
  });

  socket.on("disconnect", () => {
    let indexToDelete;
    board.players.forEach(player => {
      if(player.socket.id === socket.id){
        indexToDelete = board.players.indexOf(player);
        if(indexToDelete > -1){
          console.log("Client " + board.players[indexToDelete].name + " disconnected");
          board.players.splice(indexToDelete, 1);
          console.log(board.players);
        }
      }
    })
    io.sockets.emit("opponent.left");
  });

  if(board.players.length >= 2){
    chooseLetter();
    io.sockets.emit("game.begin", {
      letter: letterToCheck
    });
  }

  socket.on("basta.received", function(data) {
    socket.broadcast.emit("timer.running", {
      msg: data.msg
    });
    io.sockets.emit("time.over");
  });

  socket.on("click.button", function(data) {
    console.log(letterToCheck);
    let player = board.players.find((player) => player.socket.id == socket.id);
    player.a1 = data.answerOne;
    player.a2 = data.answerTwo;
    player.a3 = data.answerThree;
    if(player.a1 !== "" && player.a2 !== "" && player.a3 !== "" && player.name === data.name){
      if(player.a1[0].toLowerCase === letterToCheck.toLowerCase){
        player.score += 100;
      }
      if(player.a2[0].toLowerCase === letterToCheck.toLowerCase){
        player.score += 100;
      }
      if(player.a3[0].toLowerCase === letterToCheck.toLowerCase){
        player.score += 100;
      }
      if(player.a1 === "-"){
        player.score -=100;
      }
      if(player.a2 === "-"){
        player.score -=100;
      }
      if(player.a3 === "-"){
        player.score -=100;
      }
    }
    
    if(!socket.sentMyData){
      players = board.players.map((player, i) => {
        return {name: player.name, score: player.score}
      });
      io.sockets.emit("end.game", {
        scorePlayers: players
      });
      socket.sentMyData = true;
    }
    
  });

});

function chooseLetter(){
  let alphabet = "abcdefghijklmnopqrstuvwxyz";
  let randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
  letterToCheck = randomLetter;
}
// App init
server.listen(appConfig.expressPort, () => {
  console.log(`Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`);
});
