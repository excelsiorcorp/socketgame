$(document).ready(function(){


	var socket = io();
	var game = {
		players:{},
	};
	
	$("#inputsubmit").on("click", function(){
		var psedo = $("#psedoinput").val();
		var reg = /[^A-Za-z0-9 ]/;
		if(psedo.length < 3){
			return alert("psedo is too short");
		};
		if(reg.test(psedo) == true){
			return alert("forbiden characters");
		};
		$("#inputsubmit").off("click");
		game.client = psedo;
		socket.emit("psedoOk", {psedo:psedo});
	});

	socket.on("gamestart", function(data){
		for(user in data.game.players){
			game.players[user] = {
				score:0,
			}
		};
		game.id = data.game.gameId;

		$("#inscription").remove();
		var gamediv = $("<div></div>").addClass('gameDiv');
		gamediv.append($("<p>Click The Grey Box</p>"));
		gamediv.append($("<p>First to 20 win</p>"));
		for(let i = 0; i< 24; i++){
			gamediv.append($("<div></div>").attr("id", "cell"+ i).addClass("cells"));
		}
		for(var user in game.players){
			gamediv.append($("<div>"+ user + ": </div>").attr("id", "cell"+user).addClass("usercell").append($("<span>0</span>")));
		}
		$("#maindiv").append(gamediv);

		socket.emit("userReady", {gameId: game.id, user:game.client});
	});

	socket.on("start", function(data){
		var cell = "#cell"+data.cell;
		game.goodcell = "cell"+data.cell;
		$(cell).css("background-color", "grey");

		$(".cells").on("click", function(evt){
			if(evt.target.id == game.goodcell){
				socket.emit("userupdate", {gameId:game.id ,user:game.client, cell:evt.target.id})
			};
		});
	})

	socket.on("serverupdate", function(data){
		var oldcell = "#"+game.goodcell;
		$(oldcell).css("background-color", "transparent");

		var userpoint = "#cell"+data.user+" span";
		game.players[data.user].score++
		$(userpoint).text(game.players[data.user].score);

		game.goodcell = "cell"+data.cell;
		var newcell = "#"+ game.goodcell;
		$(newcell).css("background-color", "grey");

	});
		
	socket.on("gameend", function(data){
		$(".gameDiv").remove();
		var finaldiv = $("<div>"+ data.user +" WIN</div>").addClass('finaldiv');
		$("#maindiv").append(finaldiv)
	});
});