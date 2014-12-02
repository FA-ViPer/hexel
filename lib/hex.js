//This contains the underlying hex math and helpers
//The entire game is coded one-dimensionally, giving each hex an id  1 - the total
//number of sub-hexes. Redoing this in 2-d is the obvious next step
get_row_length= function (rid, d) {
	if (0 > rid || rid > d) {
		return "failure";
	}
	var a = Math.ceil(d / 2);
	var offset = 0;
	var walkingR = 1;
	while (walkingR != rid) {
		if (walkingR < d / 2) {
			offset++;
		} else {
			offset--;
		}
		walkingR++;
	}
	return a + offset;
}

max_id = function (rid, d) {
	var a = Math.ceil(d / 2);
	for (var i = 2; i <= rid; i++) {
		a += get_row_length(i, d);
	}
  return a;
}

min_id = function (rid,d) {
  return max_id(rid,d) - get_row_length(rid,d) + 1;
}

get_row_ids = function (rid,d) {
  var list = [];
  for (var i=min_id(rid,d); i < max_id(rid,d) + 1; i++){
    list.push(i);
  }
  return list;
}

get_row = function (id, d) {
	var rid = 1;
	var maxId = max_id(rid, d);
	while (maxId < id) {
		rid++;
		maxId = max_id(rid, d)
	}
	return rid;
}

hex_board = function(d) {
  var self = {};
  self.d = d;
  self.a = Math.ceil(d / 2);
  self.c = max_id(self.a,d) - self.a + 1;
  self.corners = {
    c330  : 1,
    c30   : self.a,
    c90   : max_id(self.a,d),
    c270  : max_id(self.a,d) - self.d + 1,
    c150  : max_id(self.d,d),
    c210  : max_id(self.d,d) - self.a + 1,
  };
  self.border = {
    top : get_row_ids(1,d),
    bot : get_row_ids(d,d),
    //corners to start diagonal borders
    topL: [self.corners.c270, self.corners.c330],
    topR: [self.corners.c30, self.corners.c90],
    botL: [self.corners.c210, self.corners.c270],
    botR: [self.corners.c90, self.corners.c150]
  };
  for (var i = 2; i < d; i++) {
    if (i < self.a) {
      self.border.topL.push(min_id(i,self.d));
      self.border.topR.push(max_id(i,self.d));
    } else if (i > self.a) {
      self.border.botL.push(min_id(i,self.d));
      self.border.botR.push(max_id(i,self.d));
    }
  }
  self.border.left = self.border.topL.concat(self.border.botL);
  self.border.right = self.border.topR.concat(self.border.botR);
  self.rows = []
  for (i = 1; i < d + 1; i ++) {
    self.rows.push({rid : i, hexs : get_row_ids(i,self.d), r: self.a - i});
  }
  return self;
}