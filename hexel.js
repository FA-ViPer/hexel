//in a 2-d version of the game, the below would be much easier, but generating the
//board becomes very tedious
get_surr = function(id, board) {
	var d = board.d;
	var list = [];
	var rid = get_row(id, d);
	list.push(
		id + 1,
		id - 1,
		id + get_row_length(rid, d),
		id - get_row_length(rid, d)
	);
	var a = Math.ceil(d / 2);
	if (rid == a) {
		list.push(id + get_row_length(rid, d) - 1,
			id - get_row_length(rid, d) + 1
		)
	} else if (rid > a) {
		list.push(id + get_row_length(rid, d) - 1,
			id - get_row_length(rid, d) - 1
		)
	} else {
		list.push(id + get_row_length(rid, d) + 1,
			id - get_row_length(rid, d) + 1
		)
	}
	//check out of bounds
	list = list.filter(function(el) {
		return (el <= max_id(d, d) && el > 0);
	});

	//check opposite side; so groossss
	if (board.border.left.indexOf(id) >= 0) {
		list = list.filter(function(el) {
			return (board.border.right.indexOf(el) < 0);
		});
	} else if (board.border.right.indexOf(id) >= 0) {
		list = list.filter(function(el) {
			return (board.border.left.indexOf(el) < 0);
		});
	}
	return list;
}

if (Meteor.isClient) {
	Session.setDefault("selected_hex", "");
	Session.setDefault("surrounding_hexes", "");
	Session.setDefault("game", "");
	Session.setDefault("activePlayer", 1);
  Session.setDefault("unselectable_hexes", "");
	Template.hexagon.helpers({
		selected: function() {
      if (Session.get("unselectable_hexes").indexOf(this.id) >= 0) {
        return "unselectable";
      }
			return Session.equals("selected_hex", this.id) ? "selected" : 'notselected';
		},
		status: function(x) {
			var players = Games.findOne(Session.get("game")).players;
			for (var player in players) {
				if (players[player].hexIds.indexOf(x) >= 0) {
					return "player-" + players[player].id;
				}
			}
			return "free";
		}
	});
	Template.tile.helpers({
		active: function() {
			return (Session.get("game") === "" ? 0 : 1);
		},
    valid: function() {
      return (Session.get("selected_hex") === "" ? 0 : 1);
    }
	});
	Template.board.helpers({
		rows: function() {
			var game = Games.findOne(Session.get("game"));
			var board = game.board;
			return board.rows;
		},
		offset: function(x) {
			return 72 * Math.abs(x);
		}
	});
	Template.hexagon.events({
		'click': function() {
        if (Session.get("unselectable_hexes").indexOf(this.id) < 0) {
        $(".hexagon").removeClass("surrounding");
        Session.set("selected_hex", this.id);
       // console.log(Session.get("activePlayer"));
      }
    },
		'dblclick': function() {
      if (Session.get("unselectable_hexes").indexOf(this.id) < 0) {
        var board = Games.findOne(Session.get("game")).board;
        Session.set("surrounding_hexes", get_surr(this.id, board));
        var surrounding = Session.get("surrounding_hexes");
        for (var i in surrounding) {
          $("#" + surrounding[i]).addClass("surrounding");
        }
      }
			return 0;
		}
	});
	// 	Template.controls.events({
	// 		'click #border': function() {
	//       $(".hexagon").removeClass("surrounding");
	//       for (var edge in board.border) {
	//         for (var i in board.border[edge]) {
	//           $("#" + board.border[edge][i]).addClass("surrounding");
	//         }
	//       }
	// 		}
	// 	});
	Template.create.events({
		'click #create': function() {
			Session.set(
				"game",
				Games.insert({
					board: hex_board(7),
					players: [{
						id: 0,
						hexIds: []
					}, {
						id: 1,
						hexIds: []
					}],
				}));
			//console.log(Session.get("game"));
      Meteor.call('gameCreated');
		}
	});
	Template.turnIndicator.helpers({
		'activePlayer': function() {
			return Session.get("activePlayer");
		}
	});
  Template.endTurn.events({
		'click': function() {
      Meteor.call('addHexIds', Session.get("selected_hex"), Session.get("activePlayer"), Session.get("game"),
                       function (error,result) {
                         if (error) {

                         } else{
                           var unselect = Games.findOne(Session.get("game"), {fields : {'players.hexIds' : 1}});
                           var hexes = [];
                           for (var player in unselect.players) {
                             hexes = hexes.concat(unselect.players[player].hexIds);
                           }
                           Session.set("unselectable_hexes",hexes);
                         }
                       }
                     );
      Session.set("surrounding_hexes", "");
      Session.set("selected_hex", "");
			Session.set("activePlayer", (Session.get("activePlayer") + 1) % 2);
			return 0;
		}
	});
  Template.score.helpers({
    scores :  function(){
      return Games.findOne(Session.get("game")).players;
    },
    score :  function() {
      return this.hexIds.length;
  }
  });
}
if (Meteor.isServer) {
	Meteor.startup(function() {
		// code to run on server at startup
	});
	Meteor.methods({
		addHexIds: function(hexId, playerId, gameId) {
			var game = Games.findOne(gameId);
			var hexIds = get_surr(hexId, game.board).concat(hexId);
			for (var player in game.players) {
				Games.update({
					_id: gameId,
					"players.id": game.players[player].id
				}, {
					$pullAll: {
						"players.$.hexIds": hexIds
					}
				});
			}
			Games.update({
				_id: gameId,
				"players.id": playerId
			}, {
				$addToSet: {
					"players.$.hexIds": {
						$each: hexIds
					}
				}
			});
    },
    gameCreated : function(){
      console.log("Created " +  Games.find().count());
    }
	});
}