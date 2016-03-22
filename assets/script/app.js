//GLOBAL LOCAL VARIABLES//
//==============================================//
var ref = new Firebase("https://intense-torch-3574.firebaseio.com/");
var refFunction = new Firebase("https://intense-torch-3574.firebaseio.com/function"); //Reference to the function key, used for communication between player systems
var refComments = new Firebase("https://intense-torch-3574.firebaseio.com/comments");
var user = undefined;
var enemy = undefined;
var wins = 0;
var loses = 0;

$("#submitComment :input").prop("disabled", true); //Disables adding a comment until player joins game
$("#user :input").prop("disabled", true) //Disables Joining the game, eneabled after sytem checks if there is a spot open
//FIREBASE METHOD OBJECT
//==============================================//
var firebase = {
	playerBuild : function(snapshot){
		userOneExists = snapshot.child('one').exists();
		userTwoExists = snapshot.child('two').exists();
		if (!userOneExists) { //Player One build
			playerRef = ref.child('one');
			enemyRef = ref.child('two');
			playerRef.set({
				'name': user
			})
			userOneExists = true;
			playerOne = true;
			target = $('#playerOne');
			enemyTarget = $('#playerTwo');
			disconnectRef = new Firebase('https://intense-torch-3574.firebaseio.com/one');

		} else if (userOneExists && !userTwoExists) { //Player Two build
			playerRef = ref.child('two');
			enemyRef = ref.child('one');
			playerRef.set({
				'name': user
			})
			userTwoExists = true;
			playerOne = false;
			target = $('#playerTwo');
			enemyTarget = $('#playerOne');
			disconnectRef = new Firebase('https://intense-torch-3574.firebaseio.com/two');
		}
		disconnectRef.onDisconnect().remove();


		if (userOneExists && userTwoExists) {
			refFunction.set("choiceBuild")	//Updates function key in Firebase. See Main Processes section for info.
		} else {
			pageBuilder.anotherPlayer();
		}
	},
	ready : function(snapshot){
		playerOneReady = snapshot.child('one/choice').exists();
		playerTwoReady = snapshot.child('two/choice').exists();
		if (playerOneReady && playerTwoReady) { //If players are both ready
			enemyRef.once("value", function(enemyData){
				enemyChoice = enemyData.val().choice;	//Get enemy choice
			})
			ref.off("value", firebase.ready);
			refFunction.set("outcome"); //Updates function key, see Main processes.
		} else if (!playerOneReady || !playerTwoReady) { //If either player isnt ready, build a waiting screen.
			pageBuilder.waiting();
		}	
	},
	outcome : function(){
		if (playerChoice == enemyChoice) {
			var message = "<h2>It's a tie!</h2>"
		} else if ((playerChoice == "Scissors" && enemyChoice == "Rock") || (playerChoice == "Rock" && enemyChoice == "Paper") || (playerChoice == "Paper" && enemyChoice == "Scissors")) {
			var message = "<h2>You Lose!</h2>"
			loses++;
				playerRef.update({
					'loses': loses
				})
		} else {
			var message = "<h2>You Win!</h2>"
			wins++;
				playerRef.update({
					'wins': wins
				})
		}

		pageBuilder.updateEnemy(); //Updates enemy Div
		pageBuilder.updateScore(); //Updates player score
		pageBuilder.results(message); //Shows correct message
		setTimeout(firebase.resetGame,2000) //This timeout is so the lag in firebase doesn't screw up my life and cost me a literal dozen hours searching for a bug
	},
	resetGame : function(resetAll){
		playerRef.once("value", function(){
			playerRef.update({'choice':null})
		})
		refFunction.set(null);
		if (resetAll) { //This is only called if a player disconnects from the game
			playerRef.update({wins:null,loses:null})
			wins=0;
			loses=0;
			setTimeout(pageBuilder.anotherPlayer,4000);
		} else{
			setTimeout(pageBuilder.choiceBuild,4000);
		}	
	}
}

//DOM CONSTRUCTOR
//==============================================//
var pageBuilder = {
	choiceBuild : function(){
		$(target).empty()
		$(enemyTarget).empty()
		$('#messageboard').html('<h2>Make a choice!</h2>');
		if (playerOne) { //This part is kind of confusing. I wanted to use a sprite image, but the image had all three choices on it, so when I flipped it, the order was flipped too, So (instead of just fixing the image) I gave each choice a data-location attribute to work with.
			choices = $('<div id="choiceContainer"><ul><li class="choice" data-location="left">Rock</li><li class="choice" data-location="center">Paper</li><li class="choice" data-location="right">Scissors</li></ul><div class="imageHolder"><div id="leftImageDiv"></div></div>');
		} else if (!playerOne) { //The classes "left" "right" and "center" correspond with the appropriate "leftImageDiv" or "rightImageDiv". See the 'jquery listeners for css changes' section for details.
			choices = $('<div id="choiceContainer"><ul><li class="choice" data-location="right">Rock</li><li class="choice" data-location="center">Paper</li><li class="choice" data-location="left">Scissors</li></ul><div class="imageHolder"><div id="rightImageDiv"></div></div>');
		}
		$(target).append(choices)
	},
	anotherPlayer : function(){
		$('#messageboard').html('<h2>Waiting for another player</h2>');
	},
	waiting : function(){
		$('#messageboard').empty().append('<h2>Waiting for ' + enemy + ' to pick.</h2>');
	},
	results : function(msg){
		$('#messageboard').html(msg);
	},
	updateScore : function(){
		scoreboard = $('<h2 id="wins">Wins: ' + wins + '</h2><h1>' + user + '</h1><h2 id="loses">loses: ' + loses + '</h2>')
		$('#user').empty()
		$('#user').append(scoreboard);
	},
	updateEnemy : function(){
		enemyImage = $('<div id="enemyMessage"><h4>' + enemy + ' chose ' + enemyChoice + '!</h4></div><div class="imageHolder"><div id="enemyImageDiv"></div></div>')
		$(enemyTarget).append(enemyImage);

		if (enemyChoice == "Rock") {
			$('#enemyImageDiv').css('background-position', '-10px 0px');
		} else if (enemyChoice == "Paper") {
			$('#enemyImageDiv').css('background-position', '-218px 0px');
		} else if (enemyChoice == "Scissors") {
			$('#enemyImageDiv').css('background-position', '-426px 0px');
		}
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
	playerChoice = $(this).text();
	$('.choice').html(playerChoice);
	$('.choice').removeClass('choice');
	$(target).css('background-color', 'rgba(0,0,0,.5')
	console.log("your choice was " + playerChoice)	
	playerRef.update({
		'choice': playerChoice //Updates player choice
	})
	ref.on("value", firebase.ready); //Checks if players are both ready
})

$('#submitComment').submit(function(e) {
	newComment = $('#newComment').val();
	newComment = user + ' : ' + newComment;
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
	$("#comments").scrollTop($("#comments")[0].scrollHeight);
})

refFunction.on("value", function(functionData){	//Listens for function updates. Used to tell all connected players what to do at the same time.
	if (functionData.val() == "choiceBuild") {
		$("#submitComment :input").prop("disabled", false); //Enables commenting button so the now connected players can talk.
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
		pageBuilder.choiceBuild();	//takes players to the next step so they can choose rock paper or scissors.
		refFunction.set(null)
	} else if (functionData.val() == "outcome") { //Once function key in database is updated with "outcome" run the outcome function
		firebase.outcome();
	}
})

ref.on("child_removed", function(oldChildSnapshot){
	if (oldChildSnapshot.val().name == enemy) { //This checks if the child removed was your enemy
		$("#submitComment :input").prop("disabled", true); //disables the chat button
		$(target).empty();//Clears player div and enemy div
		$(enemyTarget).empty();
		$('#comments').append("<h3 class='systemInfo'>" + enemy + " has disconnected.</h3>");//Logs what happened
		$("#comments").scrollTop($("#comments")[0].scrollHeight);
		refComments.set(null); //Erases firebase log of comments
		$('#messageboard').html("<h2>" + enemy + " left the game!")
		firebase.resetGame(true)//Resets all game parameters
	}
})

ref.once("value", function(snapshot){
	userOneExists = snapshot.child('one').exists();
	userTwoExists = snapshot.child('two').exists();

	if (userOneExists && userTwoExists) {
		$("#messageboard").html('<h2>Game is populated. Try again later</h2>')
	} else {
		$("#user :input").prop("disabled", false)

	}
})
//JQUERY LISTENERS FOR CSS CHANGES
//==============================================//

$(document).on('mouseover', '.choice', function(){ //Moves the image sprite around to show the right image. 
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

	if (potentialChoice == "Rock") {	//For choices background colors
		(target).css('background-color', 'rgba(26,159,255,.7');
	} else if (potentialChoice == "Paper") {
		(target).css('background-color', 'rgba(255,255,24,.7');
	} else if (potentialChoice == "Scissors") {
		(target).css('background-color', 'rgba(204,43,40,.7');
	}
})

$(document).on('mouseleave', '.choice', function(){ //Changes playerDiv to black after clicked
	$(target).css('background-color', 'rgba(0,0,0,.5')
})

var time = 3
backgroundChange = setInterval(function(){ //function for the trippy background
	if (time==3) {
		$('body, footer').css('background-color', 'rgba(26,159,255,.1)');
	} else if (time==2) {
		$('body, footer').css('background-color', 'rgba(255,255,24,.1)');
	} else if (time==1) {
		$('body, footer').css('background-color', 'rgba(204,43,40,.1)');
		time=4
	}
	time--
},700)







