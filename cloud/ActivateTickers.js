Parse.Cloud.define("activateTickers", function(request, response) {

	var tickerobjs = request.params.addtickers;

	var addray = [];
	for (var i = 0; i < tickerobjs.length; i++) {

		addray.push(tickerobjs[i].tickercode);
	
		if (i == tickerobjs.length-1) {
								
			var Ticker = Parse.Object.extend('Ticker');
			var addquery = new Parse.Query(Ticker);
			addquery.containedIn('TickerCode', addray);
			addquery.notEqualTo('isActivated', true);
			addquery.first({
				success: function(res) {

					if (res) {
						
						res.set('isActivated', true);
						res.set('LevelTrigger', true);

						res.save({
							success: function(res) {
								response.success('save success');
							},
							error: function(res, error) {
								console.error(error);
								response.error(res, error);
							}
						});

					} else {
						response.success('already isactivated');
					};

				},
				error: function(err) {
					console.error(err);
					response.error(err);
				}
			})

		};

	};

});


