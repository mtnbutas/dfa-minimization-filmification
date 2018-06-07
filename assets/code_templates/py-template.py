# can be edited at the user's disposal
# set_of_states = []
# alphabet = []
# start_state = ""
# final_states = []
# transitions = []


class StateNode:
	def __init__(self, name, is_start_state, is_final_state, transitions):
		self.name = name
		self.is_start_state = is_start_state
		self.is_final_state = is_final_state
		self.transitions = transitions

	def search_transition(self, symbol):
		for transition in self.transitions:
			if transition[1] == symbol:
				return transition[2]

		return None


class Node:
	def __init__(self, row, column):
		self.row = row
		self.column = column
		self.marked = False



def find_node(array, row, column):
	for node in array:
		if node.row == row and node.column == column:
			return node


	return None



def get_state_node_properties(name, state_nodes):
	for state_node in state_nodes:
		if state_node.name == name:
			return state_node


	return None



def DFA_minimization(set_of_states, alphabet, start_state, final_states, transitions):

	nodes = []
	state_nodes = []
	minimized_dfa = []

	new_set_of_states = []
	new_start_state = ""
	new_final_states = []
	new_transitions = []


	# loop for initializing the state nodes (which is basically the set_of_states,
	# but with additional information stored such as if it is a start state and/or a final state, as 
	# well as its transitions)
	for state in set_of_states:
		state_transitions = []
		is_start_state = False
		is_final_state = False

		# if state is equal to the start_state, then is_start_state = true
		if state == start_state:
			is_start_state = True

		# if state is found in the set of final states, then is_final_state = true
		if state in final_states:
			is_final_state = True

		# looping through the set of all transitions in order to find 
		# the transitions that are specific to the current state
		for transition in transitions:
			if transition[0] == state:
				state_transitions.append(transition)


		# state node with properties: name, is_start_state, is_final_state, and its transitions
		state_nodes.append(StateNode(state, is_start_state, is_final_state, state_transitions))


	# loop that creates a list for all pairs of states (Step 1 for Myhill-Nerode Theorem)
	for i in range(1, len(set_of_states)):
		for j in range(0, i):
			# node with properties row and column, which is a combination of 2 state names, 
			# as well as a boolean value which indicates if 
			# it is marked or not (part of the DFA minimization algorithm)
			# all pair nodes start unmarked (marked = false)
			nodes.append(Node(set_of_states[i], set_of_states[j]))


	# Set property marked to true for a node if and only if ONE of its two properties (row, column) 
	# is a state node that is also a FINAL STATE (Step 2 for Myhill-Nerode Theorem)
	for i in range(1, len(state_nodes)):
		for j in range(0, i):
			accessed_node = find_node(nodes, state_nodes[i].name, state_nodes[j].name)

			if accessed_node != None:
				if accessed_node.marked == False and ( (state_nodes[i].is_final_state == True and state_nodes[j].is_final_state == False) or (state_nodes[i].is_final_state == False and state_nodes[j].is_final_state == True) ):
					accessed_node.marked = True


	# (Step 3 of Myhill-Nerode Theorem)
	# If there are any unmarked pairs (R,C)
	# check the transitions of R and C states on every alphabet [t(R,x), t(C,x)]
	# such that if at least one of the pair node resulting from [t(R,x), t(C,x)] 
	# is already marked, then mark the unmarked pair (R,C)
	# REPEAT THIS STEP UNTIL NO MORE NEW MARKINGS CAN BE MADE IN THE ITERATION
	flag = True

	while flag:
		flag = False

		for i in range(1, len(state_nodes)):
			for j in range(0, i):
				accessed_node = find_node(nodes, state_nodes[i].name, state_nodes[j].name)

				if accessed_node and accessed_node.marked == False:
					for symbol in alphabet:
						row = state_nodes[i].search_transition(symbol)
						col = state_nodes[j].search_transition(symbol)

						if ((find_node(nodes, row, col) and find_node(nodes, row, col).marked) or (find_node(nodes, col, row) and find_node(nodes, col, row).marked)):
							accessed_node.marked = True
							flag = True
							break



	# (Step 4 of Myhill-Nerode Theorem)
	# Combine UNMARKED node pairs and make them a single state in the
	# minimized DFA if and only if the row or column properties are the same
	# e.x: (C,D) and (D,E) are both unmarked pairs; they can be combined to 
	# a single state since they have a common property which is the D state

	i = 0

	while i < len(nodes):
		if nodes[i].marked == False:
			combined_states = []
			combined_states.append(nodes[i].column)
			combined_states.append(nodes[i].row)
			


			if nodes[i].row in set_of_states:
				set_of_states.remove(nodes[i].row)


			if nodes[i].column in set_of_states:
				set_of_states.remove(nodes[i].column)


			nodes.remove(nodes[i])


			j = i

			while j < len(nodes):
				if nodes[j].marked == False and (nodes[j].row in combined_states or nodes[j].column in combined_states):
					
					if nodes[j].column not in combined_states:
						combined_states.append(nodes[j].column)
						if nodes[j].column in set_of_states:
							set_of_states.remove(nodes[j].column)

					if nodes[j].row not in combined_states:
						combined_states.append(nodes[j].row)
						if nodes[j].row in set_of_states:
							set_of_states.remove(nodes[j].row)



					nodes.remove(nodes[j])

				else:
					j += 1


			set_of_states.append(combined_states)


		i += 1


	# finalizing the names of the new set of states, 
	# the new start state (in case it got combined with other states),
	# the new set of final states
	# and the new set of transitions
	for i in range(0, len(set_of_states)):
		if isinstance((set_of_states[i]), list):
			new_set_of_states.append('/'.join(set_of_states[i]));
		
		else:
			new_set_of_states.append(set_of_states[i]);
		

		state_node_obj = ""


		if isinstance(set_of_states[i], list): #if it's a combined state
			state_node_obj = get_state_node_properties(set_of_states[i][0], state_nodes)


			for j in range(0, len(set_of_states[i])):
				if set_of_states[i][j] == start_state or set_of_states[i][j] in final_states:
					if set_of_states[i][j] == start_state:
						new_start_state = '/'.join(set_of_states[i])

					if set_of_states[i][j] in final_states:
						new_final_states.append('/'.join(set_of_states[i]))

					break

		else: #if it's a state that did not get combined with other states
			state_node_obj = get_state_node_properties(set_of_states[i], state_nodes)

			if set_of_states[i] == start_state:
				new_start_state = set_of_states[i]

			if set_of_states[i] in final_states:
				new_final_states.append(set_of_states[i])



		for symbol in alphabet:
			if isinstance((set_of_states[i]), list):
				transition = ['/'.join(set_of_states[i]), symbol]
			else:
				transition = [set_of_states[i], symbol]

			next_state = state_node_obj.search_transition(symbol)

			if next_state in set_of_states:
				transition.append(next_state)
			else:
				for k in range(0, len(set_of_states)):
					if isinstance(set_of_states[k], list):
						if next_state in set_of_states[k]:
							transition.append('/'.join(set_of_states[k]))
							break


			new_transitions.append(transition)


		

	minimized_dfa.append(new_set_of_states)
	minimized_dfa.append(alphabet)
	minimized_dfa.append(new_start_state)
	minimized_dfa.append(new_final_states)
	minimized_dfa.append(new_transitions)

	return minimized_dfa



def print_DFA(dfa):

	print "Minimized Set of States: " + ', '.join(dfa[0])
	print "Alphabet: " + ', '.join(dfa[1])
	print "New Start State: " + dfa[2]
	print "New Final States: " + ', '.join(dfa[3])
	print "New Transitions: "
	for transition in dfa[4]:
		print transition

	print "\n"


minimized_dfa = DFA_minimization(set_of_states, alphabet, start_state, final_states, transitions)
print_DFA(minimized_dfa)