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
			firebase.outcome();
		} else if (!playerOneReady || !playerTwoReady) {
			pageBuilder.waiting();
		}	
	},
	outcome : function(){
		console.log('heck ya')
	}

}
//DOM CONSTRUCTOR
//==============================================//
var pageBuilder = {
	choiceBuild : function(snapshot){
		console.log(refSnapshot.val())
		choices = $('<div id="choiceContainer"><ul><li class="choice">Rock</li><li class="choice">Paper</li><li class="choice">Scissors</li></ul>');
		if (playerOne) {
			$('#playerOne').append(choices);
		} else if (!playerOne) {
			$('#playerTwo').append(choices);
		}
	},
	waiting : function(){
		console.log('works')
		var waitingScreen = $('<div id="waitingContainer><h2>Waiting for ' + enemy + ' to pick.</h2></div>')
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
		$('#choiceContainer').remove();

		playerRef.once("value", firebase.updateChoice)

		// ref.on("value", areWeReady)
	})
// }

refFunction.on("value", function(snapshot){
	if (snapshot.val() == "choiceBuild") {
		pageBuilder.choiceBuild()
	}
})



