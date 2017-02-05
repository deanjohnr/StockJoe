var moment = require('moment');

Parse.Cloud.define("ADactivateTickers", function(request, response) {

	var momit = moment.utc().startOf('day').toDate();

	var theray = ['VBR',
'VEA',
'TFI',
'XLE',
'RIG',
'USO',
'WDAY',
'TASR',
'TRGT',
'WFC',
'SBUX',
'VOO',
'SLB',
'UVXY',
'SVXY',
'SPXL',
'SPLS',
'TBBK',
'ZNGA',
'HERO'];

	var Ticker = Parse.Object.extend('Ticker');
	var tickquery = new Parse.Query(Ticker);
	tickquery.notEqualTo('isActivated', true);
	tickquery.containedIn('TickerCode',theray);
	tickquery.limit(1000);
	tickquery.find({
		success: function(res2) {
			
			for (var i = 0; i < res2.length; i++) {
				res2[i].set('isActivated', true);
				res2[i].set('LevelTrigger', true);

				if (i == res2.length-1) {

					res2[i].save({
						success: function(res) {
							response.success('save success');
						},
						error: function(res, error) {
							console.error(error);
							response.error(res, error);
						}
					});

				} else {

					res2[i].save({
						success: function(res) {
							console.log('saved');
						},
						error: function(res, error) {
							console.error(error);
						}
					});

				};

			};

		},
		error: function(err) {
			console.error(err);
			response.error(err);
		}
	})

});