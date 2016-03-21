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
			selfIndex = 1;
			userOneExists = true;
			playerOne = true;

		} else if (userOneExists && !userTwoExists) {
			playerRef = ref.child('two');
			enemyRef = ref.child('one');
			playerRef.set({
				'name': user
			})
			selfIndex = 2;
			userTwoExists = true;
			playerOne = false;
		}

		if (userOneExists && userTwoExists) {
			refFunction.set("choiceBuild")
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
		} else if (!playerOneReady || !playerTwoReady) {
			pageBuilder.waiting();
		}	
	},
	outcome : function(){
		if (playerChoice == enemyChoice) {
			console.log("tie!")
		} else if ((playerChoice == "Scissors" && enemyChoice == "Rock") || (playerChoice == "Rock" && enemyChoice == "Paper") || (playerChoice == "Paper" && enemyChoice == "Scissors")) {
			console.log("You Lose! " + playerChoice + " loses to " + enemyChoice)
			loses++;
				playerRef.update({
					'loses': loses
				})
		} else {
			console.log("You Win! " + playerChoice + " beats " + enemyChoice)
			wins++;
				playerRef.update({
					'wins': wins
				})
		}
		setTimeout(firebase.resetGame,5000)
	},
	resetGame : function(){
		playerRef.once("value", function(playerSnapshot){
			playerRef.update({'choice':null})
		})
		refFunction.set(null)
		pageBuilder.choiceBuild();
	}
}

//TIMER OBJECT
//==============================================//
var timer = {

}
//DOM CONSTRUCTOR
//==============================================//
var pageBuilder = {
	choiceBuild : function(snapshot){
		choices = $('<div id="choiceContainer"><ul><li class="choice">Rock</li><li class="choice">Paper</li><li class="choice">Scissors</li></ul>');
		if (playerOne) {
			$('#playerOne').append(choices);
		} else if (!playerOne) {
			$('#playerTwo').append(choices);
		}
	},
	waiting : function(){
		console.log('waiting screen line 76')
		var waitingScreen = $('<div id="waitingContainer"><h2>Waiting for ' + enemy + ' to pick.</h2></div>')
		if (playerOne) {
			$('#playerTwo').append(waitingScreen);
		} else if (!playerOne) {
			$('#playerOne').append(waitingScreen);
		}
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
		pageBuilder.choiceBuild()
	} else if (functionData.val() == "outcome") {
		console.log("getting there.")
		firebase.outcome();
	}
})



