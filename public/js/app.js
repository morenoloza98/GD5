const url = window.location.origin;
let socket = io.connect(url);

let city;
let color;
let animal;
let playerName;
//Cuando el conteo se acabe se manda a llamar esta función para contabilizar los puntos
//Mostrar el puntaje hasta que se termine el juego 
function receivedBasta(){
    if($("#firstField")[0].value !== "" && $("#secondField")[0].value !== "" && $("#thirdField")[0].value !== ""){
        socket.emit("basta.received", {
            msg: "Basta! Tienes 10 segundos para terminar"
        });
        $(".board button").attr("disabled", true);
    } else {
        $("#message").text("Llena todos los campos!")
    }
}

socket.on("timer.running", function(data){
    $.toast({
        text: data.msg,
        position: "bottom-left"
    });
})

socket.on("time.over", function(){
    setInterval(() => {
        savePlayersEntries();
    }, 10000)
});

function savePlayersEntries() {
    city = $("#firstField")[0].value;
    color = $("#secondField")[0].value;
    animal = $("#thirdField")[0].value;
    endGame();
    socket.emit("click.button", {
        answerOne: city,
        answerTwo: color,
        answerThree: animal,
        name: playerName
    });
    $(".board button").attr("disabled", true);
}

function endGame() {
    if(city === ""){
        city = "-";
    } 
    if(color === ""){
        color = "-";
    } 
    if(animal === ""){
        animal = "-";
    } 
}

function renderMessage() {
    $("#message").text("Se el primero en apretar el botón!")
}

socket.on("playerName", function(data) {
    $.toast({
        text: "Hola " + data.name,
        position: "bottom-right"
    })
    $("#player").text("Hola " + data.name);
    playerName = data.name;
});

socket.on("game.begin", function(data) {
    $(".board button").removeAttr("disabled");
    $("#firstField").removeAttr("disabled");
    $("#secondField").removeAttr("disabled");
    $("#thirdField").removeAttr("disabled");
    $("#displayLetter").text("La letra a utilizar es: " + data.letter);
    renderMessage();
});

socket.on("opponent.left", function() {
    $("#message").text("Your opponent left the game.");
    $(".board button").attr("disabled", true);
});

socket.on("end.game", function(data) {
    data.scorePlayers.forEach(player => {
        $("#winner").append("<p>" + player.name + "</p>");
        $("#winner").append("<p>" + player.score + "</p>");
    });
    $(".board").attr("disabled", true);
    $("#firstField").attr("disabled", true);
    $("#secondField").attr("disabled", true);
    $("#thirdField").attr("disabled", true);
});

$(function() {
    $(".board button").attr("disabled", true);
    $("#firstField").attr("disabled", true);
    $("#secondField").attr("disabled", true);
    $("#thirdField").attr("disabled", true);
});
