
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const port = process.env.PORT || 4000
const path = require('path')
const io = require('socket.io')(http)

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(port, function () {
    console.log(`server running on port ${port}`);
});


var players = {},
    unmatched;


function joinGame(socket) { 
    players[socket.id] = {
        opponent: unmatched,
        symbol: 'X',
        socket: socket
    };
    if (unmatched) {
        players[socket.id].symbol = 'O';
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {
        unmatched = socket.id;
    }
}

function getOpponent(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[
        players[socket.id].opponent
    ].socket;
}

io.on('connection', function (socket) {
    console.log("Connection established...", socket.id);
    joinGame(socket);
    // Once the socket has an opponent, we can begin the game
    if (getOpponent(socket)) {
        socket.emit('game.begin', {
            symbol: players[socket.id].symbol
        });
        getOpponent(socket).emit('game.begin', {
            symbol: players[getOpponent(socket).id].symbol
        });
    }

    // Listens for a move to be made and emits an event to both
    // players after the move is completed
    socket.on('make.move', function (data) {
        if (!getOpponent(socket)) {
            return;
        }
        console.log("Move made by : ", data);
        socket.emit('move.made', data);
        getOpponent(socket).emit('move.made', data);
    });

    // Emit an event to the opponent when the player leaves
    socket.on('disconnect', function () {
        if (getOpponent(socket)) {
            getOpponent(socket).emit('opponent.left');
        }
    });
});