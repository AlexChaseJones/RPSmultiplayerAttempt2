//GLOBAL LOCAL VARIABLES//
//==============================================//
var ref = new Firebase("https://intense-torch-3574.firebaseio.com/");
var refFunction = new Firebase("https://intense-torch-3574.firebaseio.com/function")
var user = undefined;
var enemy = undefined;
var wins = 0;
var loses = 0;

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
				console.log("Enemy choice was " + enemyChoice)
			})

			ref.off("value", firebase.ready);
			refFunction.set("outcome");
			console.log('did it once')
		} else if (!playerOneReady || !playerTwoReady) {
			pageBuilder.waiting();
		}	
	},
	outcome : function(){
		if (playerChoice == enemyChoice) {
			var message = "It's a tie! You both chose " + playerChoice + "!"
		} else if ((playerChoice == "Scissors" && enemyChoice == "Rock") || (playerChoice == "Rock" && enemyChoice == "Paper") || (playerChoice == "Paper" && enemyChoice == "Scissors")) {
			var message = "You Lose! " + playerChoice + " loses to " + enemyChoice + "!"
			loses++;
			debugger;
				playerRef.update({
					'loses': loses
				})
		} else {
			var message = "You Win! " + playerChoice + " beats " + enemyChoice + "!"
			wins++;
				playerRef.update({
					'wins': wins
				})
		}
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
			setTimeout(pageBuilder.anotherPlayer,5000);
		} else{
			setTimeout(pageBuilder.choiceBuild,3000);
		}	
	},
	disconnect : function(){

	}
}

//DOM CONSTRUCTOR
//==============================================//
var pageBuilder = {
	choiceBuild : function(){
		$('#playerOne').empty()
		$('#playerTwo').empty()
		choices = $('<div id="choiceContainer"><ul><li class="choice">Rock</li><li class="choice">Paper</li><li class="choice">Scissors</li></ul>');
		$('#messageboard').html('<h2>Make a choice!</h2>');
		if (playerOne) {
			$('#playerOne').append(choices);
		} else if (!playerOne) {
			$('#playerTwo').append(choices);
		}
	},
	anotherPlayer : function(){
		$('#messageboard').html('<h2>Waiting for another player');
	},
	waiting : function(){
		console.log('waiting screen line 76')
		var waitingScreen = $('<div id="waitingContainer"><h2>Waiting for ' + enemy + ' to pick.</h2></div>')
		if (playerOne) {
			$('#playerTwo').append(waitingScreen);
		} else if (!playerOne) {
			$('#playerOne').append(waitingScreen);
		}
	},
	results : function(msg){
		$('#messageboard').html(msg);
		$('#playerOne').empty();
		$('#playerTwo').empty();
	}
}

//MAIN PROCESSES
//==============================================//
$('#submitUser').submit(function(e){
	user = $('#newUser').val();
	$('#submitUser').remove();
	e.preventDefault();

	ref.once("value", firebase.playerBuild)
});

$(document).on('click', '.choice', function(){
		playerChoice = $(this).text();
		console.log("your choice was " + playerChoice)
		$('#choiceContainer').remove();

		playerRef.once("value", firebase.updateChoice)
	})

refFunction.on("value", function(functionData){
	if (functionData.val() == "choiceBuild") {
		ref.once("value", function(snapshot){
			if (playerOne) {
				enemy = snapshot.val().two.name;
			} else if (!playerOne) {
				enemy = snapshot.val().one.name;
			}
		})
		pageBuilder.choiceBuild();
		refFunction.set(null)
	} else if (functionData.val() == "outcome") {
		console.log("getting there.")
		firebase.outcome();
	}
})

ref.on("child_removed", function(oldChildSnapshot){
	if (oldChildSnapshot.val().name == enemy) {
		$('#playerOne').empty();
		$('#playerTwo').empty();
		$('#messageboard').html("<h2>" + enemy + " left the game!")
		firebase.resetGame(true)
	}
})




