// can be edited at the user's disposal
// var setOfStates = [];
// var alphabet = [];
// var startState = "";
// var finalStates = [];
// var transitions = [];

var minimizedDFA = DFAminimization(setOfStates, alphabet, startState, finalStates, transitions);
printDFA(minimizedDFA);


function StateNode(name, isStartState, isFinalState, transitions){
	this.name = name;
	this.isStartState = isStartState;
	this.isFinalState = isFinalState;
	this.transitions = transitions;

	this.searchTransition = function (symbol) {
		for(var i = 0; i < this.transitions.length; i++){
			if(this.transitions[i][1] == symbol){
				return this.transitions[i][2];
			}
		}

		return null;
	}
}

function Node(row, column){
	this.row = row;
	this.column = column;
	this.marked = false;
}

function DFAminimization(setOfStates, alphabet, startState, finalStates, transitions) {
	
	var nodes = [];
	var stateNodes = [];
	var i, j, k;
	var minimizedDFA = [];

	var newSetOfStates = [];
	var newStartState = "";
	var newFinalStates = [];
	var newTransitions = [];

	//loop for initializing the state nodes (which is basically the setOfStates,
	//but with additional information stored such as if it is a start state and/or a final state, as 
	//well as its transitions)
	for(i = 0; i < setOfStates.length; i++){
		var stateTransitions = [];
		var isStartState = false;
		var isFinalState = false;

		//if state is equal to the startState, then isStartState = true
		if(setOfStates[i] == startState){
			isStartState = true;
		}

		//if state is found in the set of final states, then isFinalState = true
		if(finalStates.indexOf(setOfStates[i]) > -1){ 
			isFinalState = true;
		}

		//looping through the set of all transitions in order to find 
		//the transitions that are specific to the current state
		for(j = 0; j < transitions.length; j++){
			if(transitions[j][0] == setOfStates[i]){
				stateTransitions.push(transitions[j]);
			}
		}

		//state node with properties: name, isStartState, isFinalState, and its transitions
		var newStateNode = new StateNode(setOfStates[i], isStartState, isFinalState, stateTransitions);
		stateNodes.push(newStateNode);

	}


	//loop that creates a list for all pairs of states (Step 1 for Myhill-Nerode Theorem)
	for(i = 1; i < setOfStates.length; i++){ 
		for(j = 0; j < i; j++){
			//node with properties row and column, which is a combination of 2 state names, 
			//as well as a boolean value which indicates if 
			//it is marked or not (part of the DFA minimization algorithm)
			//all pair nodes start unmarked (marked = false)
			var newNode = new Node(setOfStates[i], setOfStates[j]); 
			nodes.push(newNode);
		}
	}

	//Set property marked to true for a node if and only if ONE of its two properties (row, column) 
	//is a state node that is also a FINAL STATE (Step 2 for Myhill-Nerode Theorem)
	for(i = 1; i < stateNodes.length; i++){
		for(j = 0; j < i; j++){
			//find the node from the node array based on stateNodes[i] as the row and
			//stateNodes[j] as the column
			var accessedNode = findNode(nodes, stateNodes[i].name, stateNodes[j].name);

			if(accessedNode){
				if(!accessedNode.marked && ((stateNodes[i].isFinalState == true && stateNodes[j].isFinalState == false) ||
					(stateNodes[i].isFinalState == false && stateNodes[j].isFinalState == true))){
					accessedNode.marked = true;
				}
			}
		}
	}

	//(Step 3 of Myhill-Nerode Theorem)
	//If there are any unmarked pairs (R,C)
	//check the transitions of R and C states on every alphabet [t(R,x), t(C,x)]
	//such that if at least one of the pair node resulting from [t(R,x), t(C,x)] 
	//is already marked, then mark the unmarked pair (R,C)
	var flag = false;

	do{
		flag = false;
		for(i = 1; i < stateNodes.length; i++){
			for(j = 0; j < i; j++){

				var accessedNode = findNode(nodes, stateNodes[i].name, stateNodes[j].name);
				if(accessedNode && accessedNode.marked == false){
					for(k = 0; k < alphabet.length; k++){
						var row = stateNodes[i].searchTransition(alphabet[k]);
						var col = stateNodes[j].searchTransition(alphabet[k]);

						if((findNode(nodes, row, col) && findNode(nodes, row, col).marked) || 
							(findNode(nodes, col, row) && findNode(nodes, col, row).marked)){
								accessedNode.marked = true;
								flag = true;
								break;
						}
					}
				}
			}
		}
	}while(flag);//REPEAT THIS STEP UNTIL NO MORE NEW MARKINGS CAN BE MADE IN THE ITERATION


	//(Step 4 of Myhill-Nerode Theorem)
	//Combine UNMARKED node pairs and make them a single state in the
	//minimized DFA if and only if the row or column properties are the same
	//e.x: (C,D) and (D,E) are both unmarked pairs; they can be combined to 
	//a single state since they have a common property which is the D state

	for(i = 0; i < nodes.length; i++){
		if(nodes[i].marked == false){
			var combinedStates = [];
			var ii = setOfStates.indexOf(nodes[i].row);
			combinedStates.push(nodes[i].column);
			combinedStates.push(nodes[i].row);

			if(ii > -1){
				setOfStates.splice(ii, 1);
			}

			ii = setOfStates.indexOf(nodes[i].column);

			if(ii > -1){
				setOfStates.splice(ii, 1);
			}

			nodes.splice(i, 1);

			for(j = i; j < nodes.length;){
				if(nodes[j].marked == false && 
					(combinedStates.indexOf(nodes[j].row) > -1 || 
						combinedStates.indexOf(nodes[j].column) > -1)){
					if(combinedStates.indexOf(nodes[j].column) == -1){
						combinedStates.push(nodes[j].column);
						ii = setOfStates.indexOf(nodes[j].column);
						if(ii > -1){
							setOfStates.splice(ii, 1);
						}
					}
					if(combinedStates.indexOf(nodes[j].row) == -1){
						combinedStates.push(nodes[j].row);
						ii = setOfStates.indexOf(nodes[j].row);
						if(ii > -1){
							setOfStates.splice(ii, 1);
						}
					}

					nodes.splice(j, 1);
				}
				else{
					j++;
				}
			}
			setOfStates.push(combinedStates);
		}
	}

	
	// finalizing the names of the new set of states, 
	// the new start state (in case it got combined with other states),
	// the new set of final states
	// and the new set of transitions

	for(i = 0; i < setOfStates.length; i++){
		newSetOfStates.push(setOfStates[i].toString().replace(/,/g , "/"));
		var stateNodeObj;

		if(setOfStates[i] instanceof Array){ //if it's a combined state
			stateNodeObj = getStateNodeProperties(setOfStates[i][0], stateNodes);

			for(j = 0; j < setOfStates[i].length; j++){
				if(setOfStates[i][j] == startState || finalStates.indexOf(setOfStates[i][j]) > -1){
					
					if(setOfStates[i][j] == startState){
						newStartState = setOfStates[i].toString().replace(/,/g , "/");
					}

					if(finalStates.indexOf(setOfStates[i][j]) > -1){
						newFinalStates.push(setOfStates[i].toString().replace(/,/g , "/"));
					}

					break;
				}

			}			
		}
		else{//if it's a state that did not get combined with other states
			stateNodeObj = getStateNodeProperties(setOfStates[i], stateNodes);

			if(setOfStates[i] == startState){
				newStartState = setOfStates[i];
			}

			if(finalStates.indexOf(setOfStates[i]) > -1){
				newFinalStates.push(setOfStates[i]);
			}			
		}

	
		for(j = 0; j < alphabet.length; j++){
			var transition = [setOfStates[i].toString().replace(/,/g , "/"), alphabet[j]];

			var nextState = stateNodeObj.searchTransition(alphabet[j]);

			if(setOfStates.indexOf(nextState) > -1){
				transition.push(nextState);
			}
			else{
				for(k = 0; k < setOfStates.length; k++){
					if(setOfStates[k] instanceof Array){
						if(setOfStates[k].indexOf(nextState) > -1){
							transition.push(setOfStates[k].toString().replace(/,/g , "/"));
							break;
						}
					}
				}
			}

			newTransitions.push(transition);
			
		}
	}

	minimizedDFA.push(newSetOfStates, alphabet, newStartState, newFinalStates, newTransitions);
	return minimizedDFA;
	
}

function findNode(array, row, column) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].row === row && array[i].column === column) {
            return array[i];
        }
    }
    return null;
}


function getStateNodeProperties(name, stateNodes){
	for(var i = 0; i < stateNodes.length; i++){
		if(stateNodes[i].name == name){
			return stateNodes[i];
		}
	}

	return null;
}


function printDFA(dfa){
	console.log("Minimized Set of States: " + dfa[0]);
	console.log("Alphabet: " + dfa[1])
	console.log("New Start State: " + dfa[2]);
	console.log("New Final States: " + dfa[3]);
	console.log("New Transitions: ");

	for(var i = 0; i < dfa[4].length; i++){
		console.log(dfa[4][i]);
	}

	console.log("\n");

}