InformedSearch = Backbone.Model.extend({

    initialize: function(attributes, options) {

        this.closedCount = 0;

        // Callback functions
        this.isGoalState = options.isGoalState;
        this.onDiscover = options.onDiscover;
        this.heuristicFunction = options.heuristicFunction;

        // Function that compares the estimated cost 'f' of a path
        var compareEntries = _.bind(function(a, b) {
            if (a.f > b.f) {
                return -1;
            } else if (a.f < b.f) {
                return 1;
            }
            return 0;
        }, this);

        this.frontier = new buckets.PriorityQueue(compareEntries);

        // Prepare initial state for discovery
        var augmentedInitialState = {
            originalState: options.initialState,
            depth: 0,
            kind: 'normal'
        };

        options.initialState.setHeuristicValue(
            options.heuristicFunction(options.initialState));

        this.frontier.enqueue({
            f: this.fScoreFunction(options.initialState),
            state: options.initialState
        });

        // Discover initial state
        options.onDiscover([augmentedInitialState], null);
    },

    getStatistics: function() {
        return [
            {
                name: 'Open list',
                value: this.frontier.size()
            },
            {
                name: 'Closed list',
                value: this.closedCount
            }
        ];
    },

    iterate: function() {

        if (this.goalFound) {
            return true;
        }

        this.closedCount++;

        var state = this.frontier.dequeue().state;
        if (this.isGoalState(state)) {
            // Let the application know that the goal has been discovered
            this.goalFound = true;
            this.onDiscover([{
                originalState: state,
                kind: 'goal'
            }], state.getParent());
            return true;
        }

        var successors = state.generateSuccessors();
        var numSuccessors = successors.length;
        var augmentedSuccessors = [];

        // Add states to the frontier
        for (var i = 0; i < numSuccessors; i++) {
            var successor = successors[i];
            successor.setHeuristicValue(this.heuristicFunction(successor));
            var successorStr = successor.toString();

            var augmentedState = {
                originalState: successor,
                kind: 'normal'
            }

            this.frontier.enqueue({
                f: this.fScoreFunction(successor),
                state: successor
            });

            augmentedSuccessors.push(augmentedState);
        }

        // Let application know that states have been discovered
        this.onDiscover(augmentedSuccessors, state);

        return false;
    },

    wasGoalFound: function() {
        return this.goalFound;
    }

});