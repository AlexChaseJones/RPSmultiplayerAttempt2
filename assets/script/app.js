//GLOBAL LOCAL VARIABLES//
//==============================================//
var ref = new Firebase("https://intense-torch-3574.firebaseio.com/");
var refFunction = new Firebase("https://intense-torch-3574.firebaseio.com/function")
var refComments = new Firebase("https://intense-torch-3574.firebaseio.com/comments")
var user = undefined;
var enemy = undefined;
var wins = 0;
var loses = 0;

$("#submitComment :input").prop("disabled", true);
//FIREBASE METHOD OBJECT
//==============================================//
var firebase = {
	playerBuild : function(snapshot){
		userOneExists = snapshot.child('one').exists();
		userTwoExists = snapshot.child('two').exists();
		if ((!userOneExists && !userTwoExists) || (!userOneExists && userTwoExists)) {
			playerRef = ref.child('one');
			enemyRef = ref.child('two');
			playerRef.set({
				'name': user
			})
			userOneExists = true;
			playerOne = true;
			disconnectRef = new Firebase('https://intense-torch-3574.firebaseio.com/one');

		} else if (userOneExists && !userTwoExists) {
			playerRef = ref.child('two');
			enemyRef = ref.child('one');
			playerRef.set({
				'name': user
			})
			userTwoExists = true;
			playerOne = false;
			disconnectRef = new Firebase('https://intense-torch-3574.firebaseio.com/two');
		}
		disconnectRef.onDisconnect().remove();


		if (userOneExists && userTwoExists) {
			refFunction.set("choiceBuild")
		} else {
			pageBuilder.anotherPlayer();
		}
	},
	updateChoice : function(snapshot){
		playerRef.update({
			'choice': playerChoice
		})
		ref.on("value", firebase.ready);
	},
	ready : function(snapshot){
		playerOneReady = snapshot.child('one/choice').exists();
		playerTwoReady = snapshot.child('two/choice').exists();
		if (playerOneReady && playerTwoReady) {
			enemyRef.once("value", function(enemyData){
				enemyChoice = enemyData.val().choice;
			})

			ref.off("value", firebase.ready);
			refFunction.set("outcome");
		} else if (!playerOneReady || !playerTwoReady) {
			pageBuilder.waiting();
		}	
	},
	outcome : function(){
		if (playerChoice == enemyChoice) {
			var message = "<h2>It's a tie! You both chose " + playerChoice + "!</h2>"
		} else if ((playerChoice == "Scissors" && enemyChoice == "Rock") || (playerChoice == "Rock" && enemyChoice == "Paper") || (playerChoice == "Paper" && enemyChoice == "Scissors")) {
			var message = "<h2>You Lose! " + playerChoice + " loses to " + enemyChoice + "!</h2>"
			loses++;
				playerRef.update({
					'loses': loses
				})
		} else {
			var message = "<h2>You Win! " + playerChoice + " beats " + enemyChoice + "!</h2>"
			wins++;
				playerRef.update({
					'wins': wins
				})
		}
		pageBuilder.updateScore();
		pageBuilder.results(message);
		setTimeout(firebase.resetGame,2000) //So the lag in firebase doesn't screw up my life and cost me a literal dozen hours searching for a bug
	},
	resetGame : function(resetAll){
		playerRef.once("value", function(){
			playerRef.update({'choice':null})
		})
		refFunction.set(null);
		if (resetAll) {
			playerRef.update({wins:null,loses:null})
			wins=0;
			loses=0;
			setTimeout(pageBuilder.anotherPlayer,4000);
		} else{
			setTimeout(pageBuilder.choiceBuild,3000);
		}	
	}
}

//DOM CONSTRUCTOR
//==============================================//
var pageBuilder = {
	choiceBuild : function(){
		$('#playerOne').empty()
		$('#playerTwo').empty()
		
		$('#messageboard').html('<h2>Make a choice!</h2>');
		if (playerOne) {
			choices = $('<div id="choiceContainer"><ul><li class="choice" data-location="left">Rock</li><li class="choice" data-location="center">Paper</li><li class="choice" data-location="right">Scissors</li></ul>');
			sprite = $('<div class="imageHolder"><div id="leftImageDiv"></div></div>');
			$('#playerOne').append(choices).append(sprite);
		} else if (!playerOne) {
			choices = $('<div id="choiceContainer"><ul><li class="choice" data-location="right">Rock</li><li class="choice" data-location="center">Paper</li><li class="choice" data-location="left">Scissors</li></ul>');
			sprite = $('<div class="imageHolder"><div id="rightImageDiv"></div></div>');
			$('#playerTwo').append(choices).append(sprite);
		}
	},
	anotherPlayer : function(){
		$('#messageboard').html('<h2>Waiting for another player</h2>');
	},
	waiting : function(){
		$('#messageboard').empty().append('<h2>Waiting for ' + enemy + ' to pick.</h2>');
	},
	results : function(msg){
		$('#messageboard').html(msg);
		// $('#playerOne').empty();
		// $('#playerTwo').empty();	//SDFKLKASJFLKADSKJFASLFJDSAKFJSDFJSDLFJSDKFJDSFJ RIGHT HERE
	},
	updateScore : function(){
		scoreboard = $('<h2 id="wins">Wins: ' + wins + '</h2><h1>' + user + '</h1><h2 id="loses">loses: ' + loses + '</h2>')
		$('#user').empty()
		$('#user').append(scoreboard);
	}
}

//MAIN PROCESSES
//==============================================//
$('#user').submit(function(e){
	user = $('#newUser').val();
	pageBuilder.updateScore();
	e.preventDefault();

	ref.once("value", firebase.playerBuild)
});

$(document).on('click', '.choice', function(){
		$(target).css('background-color', 'rgba(0,0,0,.5')
		playerChoice = $(this).text();
		console.log("your choice was " + playerChoice)	
		playerRef.once("value", firebase.updateChoice)
	})

$('#submitComment').submit(function(e) {
	newComment = $('#newComment').val();
	$('#newComment').val('');
	e.preventDefault();
	refComments.once("value", function(){
		refComments.push({
			comment: newComment
		})
	})
})

refComments.on("child_added", function(childSnapshot){
	userComment = childSnapshot.val().comment;
	commentParagraph = $('<p>').append(userComment);
	$('#comments').append(commentParagraph);
})

refFunction.on("value", function(functionData){
	if (functionData.val() == "choiceBuild") {
		$("#submitComment :input").prop("disabled", false);
		ref.once("value", function(snapshot){
			if (playerOne) {
				enemy = snapshot.val().two.name;
			} else if (!playerOne) {
				enemy = snapshot.val().one.name;
			}
			enemyRef.on("child_added", function(enemySnapshot){
				if (enemy == enemySnapshot.val()) {
					$('#comments').empty();
					$('#comments').append("<h3 class='systemInfo'>" + enemySnapshot.val() + " has joined the Game</h3>")
				}
			})
		})
		pageBuilder.choiceBuild();
		refFunction.set(null)
	} else if (functionData.val() == "outcome") {
		firebase.outcome();
	}
})

ref.on("child_removed", function(oldChildSnapshot){
	if (oldChildSnapshot.val().name == enemy) {
		$("#submitComment :input").prop("disabled", true);
		$('#playerOne').empty();
		$('#playerTwo').empty();
		$('#comments').append("<h3 class='systemInfo'>" + enemy + " has disconnected.</h3>");
		refComments.set(null);
		$('#messageboard').html("<h2>" + enemy + " left the game!")
		firebase.resetGame(true)
	}
})

//JQUERY LISTENERS FOR CSS CHANGES
//==============================================//

$(document).on('mouseover', '.choice', function(){
	move = $(this).data('location');
	if (move == "left") {
		$('#leftImageDiv').css('background-position', '-10px 0px');
		$('#rightImageDiv').css('background-position', '-10px -197px');
	} else if (move == "right") {
		$('#leftImageDiv').css('background-position', '-426px 0px');
		$('#rightImageDiv').css('background-position', '-426px -197px');
	} else if (move == "center") {
		$('#leftImageDiv').css('background-position', '-218px 0px');
		$('#rightImageDiv').css('background-position', '-218px -197px');
	}

	potentialChoice = $(this).text();

	if (playerOne) {
		target = $('#playerOne')
	} else if (!playerOne) {
		target = $('#playerTwo')
	}

	if (potentialChoice == "Rock") {
		(target).css('background-color', 'rgba(26,159,255,.5');
	} else if (potentialChoice == "Paper") {
		(target).css('background-color', 'rgba(255,255,24,.5');
	} else if (potentialChoice == "Scissors") {
		(target).css('background-color', 'rgba(204,43,40,.5');
	}
})

$(document).on('mouseleave', '.choice', function(){
	$(target).css('background-color', 'rgba(0,0,0,.5')
})

var time = 3
backgroundChange = setInterval(function(){
	if (time==3) {
		$('body').css('background-color', 'rgba(255,0,0,.1)');
	} else if (time==2) {
		$('body').css('background-color', 'rgba(0,255,0,.1)');
	} else if (time==1) {
		$('body').css('background-color', 'rgba(0,0,255,.1)');
		time=4
	}
	time--
},700)








