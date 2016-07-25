var express = require("express");
var path = require("path");
var jade = require("jade");
var fs = require("fs");

var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.set("views", path.resolve(__dirname, "./views"));
app.set("view engine", "jade");
app.use(express.static(path.resolve(__dirname, "./public")))

app.get("/", function(req, res){
	fs.readFile("score.txt", function(err, data){
		var score = JSON.parse(data);
		res.render("home",{
			score:score
		});
	});
});

var games = {};
var pendingGames = {};
var time;

io.on("connection", function(socket){
	socket.on("psedoOk", function(data){

		if(pendingGames.game){
			pendingGames.game[data.psedo] = {
				psedo: data.psedo,
				socket: socket
			};

			var roomId = Math.floor(Math.random() * 10000000000000000) + 1;  
			games[roomId] = {
				gameId : roomId,
				players:{},
				ready:0
			};

			for(var user in pendingGames.game){
				pendingGames.game[user].socket.join(roomId);
				games[roomId].players[user] = {
					psedo:user,
					score: 0
				};
			};

			pendingGames = {};
			io.to(roomId).emit("gamestart", {game: games[roomId]})

		}else{
			pendingGames.game = {};
			pendingGames.game[data.psedo] = {
				psedo:data.psedo,
				socket:socket
			};
		}
	});

	socket.on("userReady", function(data){
		games[data.gameId].ready++;
		if(games[data.gameId].ready == 2){
			games[data.gameId].cell = Math.floor(Math.random() * 23) + 0; 
			io.to(data.gameId).emit("start", {cell:games[data.gameId].cell});
			time = new Date();
		}
	});

	socket.on("userupdate", function(data){
		var cellverif = "cell"+games[data.gameId].cell
		if(cellverif == data.cell){
			games[data.gameId].cell = Math.floor(Math.random() * 23) + 0;
			games[data.gameId].players[data.user].score++;
			if(games[data.gameId].players[data.user].score == 20){
				 io.to(data.gameId).emit("gameend",{user:data.user});
				 fs.readFile("score.txt", function(err, score){
				 	var scoreuser = JSON.parse(score);
				 	time = new Date() - time;
				 	scoreuser[data.user] = {}
				 	scoreuser[data.user].time = time/1000;
				 	scoreuser[data.user].psedo = data.user;
				 	scoreuser = JSON.stringify(scoreuser);
				 	fs.writeFile("./score.txt", scoreuser ,function(err){});
				 });
			}else{
				io.to(data.gameId).emit("serverupdate", {cell:games[data.gameId].cell, user:data.user});
			}
		}
	});

});

http.listen(8080);