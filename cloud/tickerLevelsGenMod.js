var moment = require('moment');

Parse.Cloud.job("tickerLevelsGenMod", function(request, response) {

	var dayoweek = moment.utc().format('dddd');
	var weekRay = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

	var thehour = moment.utc().format('H'); 

	console.log(dayoweek);
	console.log(thehour);

	if (weekRay.indexOf(dayoweek) >= 0 && thehour <= 18) {

		var tickers = [];

		var pmom = moment.utc().startOf('day').subtract(7, 'd').toDate();

		// Pull Active Tickers
		var Ticker = Parse.Object.extend('Ticker');
		var timequery = new Parse.Query(Ticker);
		timequery.lessThan('LevelRefreshDate', pmom);
		var trigquery = new Parse.Query(Ticker);
		trigquery.notEqualTo('LevelTrigger',false);
		var tickquery = Parse.Query.or(trigquery,timequery);
		tickquery.equalTo('isActive', true);
		tickquery.equalTo('isCompany', true);
		tickquery.greaterThan('MarketCapitalization', 250000000);
		//tickquery.doesNotExist('LevelRefreshDate');
		tickquery.ascending('MarketCapitalization');
		tickquery.limit(1000);
		//tickquery.equalTo('TickerCode','DVA');
		tickquery.find({
			success: function(tickers) {

				if (tickers.length > 0){

					console.log(tickers[0].get('TickerCode'));
					console.log(tickers.length);

					var j = 0;
					levelsftn(tickers,j,response);

				} else {
					response.success('no tickers');
				}

			},
			error: function(error) {
		    	response.error('Failed to Get currtickers');
		    }
		});

	} else {
		response.success('Not Today!');
	};

});

function levelsftn(theres,j,response) {

	var newres = theres;
	var ticker = newres[j];

	// URL CREATION
	var tickercode = ticker.get('TickerCode');
	var month = '1';
	var day = '1';
	var year = '2013';

	var mom = new Date();

	var pmonth = mom.getMonth();
	var pday = mom.getDate();
	var pyear = mom.getFullYear();

	pmonth = pmonth + 1;

	var mday = 15;
	var oday = mday - 1;
	var mmonth = pmonth + 1;
	if (mmonth == 13) {
		mmonth == '01'
	};
	var myear = pyear - 1;
	var oyear = myear - 1;

	if (pday < 10) {pday = '0' + pday};
	if (pmonth < 10) {pmonth = '0' + pmonth};
	if (mday < 10) {mday = '0' + mday};
	if (mmonth < 10) {mmonth = '0' + mmonth};
	if (oday < 10) {oday = '0' + oday};

	var tickurl1 = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22'+tickercode+'%22%20and%20startDate%20%3D%20%22'+myear+'-'+mmonth+'-'+mday+'%22%20and%20endDate%20%3D%20%22'+pyear+'-'+pmonth+'-'+pday+'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
	var tickurl2 = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22'+tickercode+'%22%20and%20startDate%20%3D%20%22'+oyear+'-'+mmonth+'-'+oday+'%22%20and%20endDate%20%3D%20%22'+myear+'-'+mmonth+'-'+oday+'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

	Parse.Cloud.httpRequest(
		{
			url: tickurl1,
			datatype: 'jsonp',
			jsonp: "callback",
    		jsonpCallback: "quote",
		})
		.then(function (res1) {

			Parse.Cloud.httpRequest(
				{
					url: tickurl2,
					datatype: 'jsonp',
					jsonp: "callback",
		    		jsonpCallback: "quote",
				})
				.then(function (res2) {

					levelsgen(res1,res2,ticker,j,response,newres);
			    	
				},
				function(err) {
					console.error(err);
					levelsgen(res1,null,ticker,j,response,newres);
				});	
		},
		function(err) {
			console.error(err);
			levelsftn(newres,j+1,response);
		});

};

levelsgen = function(res1,res2,ticker,j,response,newres) {

	if (res1.data.query.results) {

		if (res2.data.query.results) {
			var sh = res1.data.query.results.quote.concat(res2.data.query.results.quote);
		} else {
			var sh = res1.data.query.results.quote;
		};

		var adjclose = [];
		var valleyray = [];
		var peakray = [];

		// ANALYSIS LOOP
		for (var i = sh.length-1; i >= 0; i--) {

			adjclose.push(Number(sh[i].Adj_Close).toFixed(2));

			if (i > 0 && i < sh.length-1 && Number(sh[i].Adj_Close).toFixed(2) < Number(sh[i-1].Adj_Close).toFixed(2) && Number(sh[i].Adj_Close).toFixed(2) < Number(sh[i+1].Adj_Close).toFixed(2)) {
				valleyray.push({
					price: Number(sh[i].Adj_Close).toFixed(2),
					ndx: sh.length-1 - i
				})
			} else if (i > 0 && i < sh.length-1 && Number(sh[i].Adj_Close).toFixed(2) > Number(sh[i-1].Adj_Close).toFixed(2) && Number(sh[i].Adj_Close).toFixed(2) > Number(sh[i+1].Adj_Close).toFixed(2)) {
				peakray.push({
					price: Number(sh[i].Adj_Close).toFixed(2),
					ndx: sh.length-1 - i
				})
			};

			if (i == 0) {
				console.log(adjclose[adjclose.length-1]);
				var suppjoins = [];
				var resjoins = [];
				var suppprices = [];
				var resprices = [];

				for (var k = 0; k < valleyray.length; k++) {

					var suppjoin = getsupptrendpoints(valleyray, valleyray[k]);
					console.log(suppjoin);
					if (suppjoin) {
						suppjoins.push(suppjoin);
						suppprices.push(suppjoin.price);
					};

					if (k == valleyray.length-1) {
						console.log(suppprices);
						var suppresult = cleansuppjoins(suppjoins,0);

						for (var m = 0; m < peakray.length; m++) {

							var resjoin = getrestrendpoints(peakray, peakray[m]);

							if (resjoin) {
								resjoins.push(resjoin);
								resprices.push(resjoin.price);
							};

							if (m == peakray.length-1) {
								console.log(resprices);
								var resresult = cleanresjoins(resjoins,0);

								ticker.set('Support', suppresult);
								ticker.set('Resist', resresult);

								// S/R Alerts
								var suppray = suppresult;
								var resray = resresult;
								var suppres = getsuppres(adjclose[sh.length-1],suppray,resray);

								var mom = moment.utc().toDate();
								ticker.set('LevelRefreshDate', mom);
								ticker.set('LevelTrigger', false);

								if (suppres) {
									ticker.set('SupportVal', +(suppres.support));
								};
								if (suppres) {
									ticker.set('ResistVal', +(suppres.resist));
								}

								if (j == newres.length-1) {
									ticker.save({
										success: function(result) {
											response.success('SUCCESS');
										},
										error: function(error) {
											response.error(error);
										}
									});
								} else {
									ticker.save({
										success: function(result) {
											levelsftn(newres,j+1,response);
										},
										error: function(error) {
											console.log('error: could not save ' + ticker.get('TickerCode'));
											levelsftn(newres,j+1,response);
										}
									});
								};

							};
							
						};

					};
					
				};

			};

		};

	} else {

		if (ticker.get('TickerCode')) {
			console.log('FAILED TICKER HistData: ' + ticker.get('TickerCode'));
			ticker.set('LevelTrigger', false);
			ticker.save({
				success: function(result) {
					levelsftn(newres,j+1,response);
				},
				error: function(error) {
					console.log('error: could not save ' + ticker.get('TickerCode'));
					levelsftn(newres,j+1,response);
				}
			});
		} else {
			levelsftn(newres,j+1,response);
		};
		
	};

};

function getsuppres(price,suppray,resray) {

	if (suppray.length > 3) {
		suppray = suppray.slice(suppray.length-3,suppray.length)
	}

	if (resray.length > 3) {
		resray = resray.slice(resray.length-3,resray.length)
	}

	var levels = suppray.concat(resray);

	var resist = null;
	var support = null;

	for (var i = 0; i < levels.length; i++) {

		var level = levels[i];
		
		if (support && level.price < price && level.price > support) {

			support = level.price;

		} else if (!support && level.price < price) {

			support = level.price;

		} else if (resist && level.price > price && level.price < resist) {

			resist = level.price;
		
		} else if (!resist && level.price > price) {

			resist = level.price;
		
		};

		if (i == levels.length-1) {

			if (resist == 0) {
				resist = null
			};
			if (support == 0) {
				support = null
			};
			
			return {resist: resist, support: support}

		};

	};

};

function getsupptrendpoints(points, point) {

	var isAlive = true;
	var joins = [point];
	var minjoin = point;
	var tjoin = null;

	if (points[0]) {

		for (var i = 0; i < points.length; i++) {

			if (points[i].ndx > point.ndx) {

				if (isAlive) {

					if (points[i].price/point.price < 0.99) {

						isAlive = false;

					} else if (points[i].price/point.price < 1.01 && points[i].price/point.price > 0.99 && (points[i].ndx - point.ndx) > 10) {

						joins.push(points[i]);

						if (points[i].price < minjoin.price) {
							minjoin = points[i];
						};

					} else if (points[i].price/point.price < 1.01 && points[i].price/point.price > 0.99 && (points[i].ndx - point.ndx) <= 10) {

						if (tjoin && points[i].price < tjoin.price) {
							
							tjoin = points[i];
							if (tjoin.price < minjoin.price) {
								minjoin = tjoin;
							};

						} else if (!tjoin) {

							tjoin = points[i];
							if (tjoin.price < minjoin.price) {
								minjoin = tjoin;
							};

						};

					};

				};

				if (i == points.length-1 && joins.length > 1) {
					console.log(minjoin);
					return minjoin;

				} else if (i == points.length-1) {

					return null;

				};

			} else {

				if (i == points.length-1 && joins.length > 1) {
					console.log(minjoin);
					return minjoin;

				} else if (i == points.length-1) {

					return null;

				};

			};
		
		};

	} else {

		return null;

	};

};

function getrestrendpoints(points, point) {

	var isAlive = true;
	var joins = [point];
	var maxjoin = point;
	var tjoin = null;

	if (points[0]) {

		for (var i = 0; i < points.length; i++) {

			if (points[i].ndx > point.ndx) {

				if (isAlive) {

					if (points[i].price/point.price > 1.01) {

						isAlive = false;

					} else if (points[i].price/point.price < 1.01 && points[i].price/point.price > 0.99 && (points[i].ndx - point.ndx) > 10) {

						joins.push(points[i]);

						if (points[i].price > maxjoin.price) {
							maxjoin = points[i];
						};

					} else if (points[i].price/point.price < 1.01 && points[i].price/point.price > 0.99 && (points[i].ndx - point.ndx) <= 10) {

						if (tjoin && points[i].price < tjoin.price) {
							
							tjoin = points[i];
							if (tjoin.price > maxjoin.price) {
								maxjoin = tjoin;
							};

						} else if (!tjoin) {

							tjoin = points[i];
							if (tjoin.price > maxjoin.price) {
								maxjoin = tjoin;
							};

						};

					};

				};

				if (i == points.length-1 && joins.length > 1) {

					return maxjoin;

				};

			} else {

				if (i == points.length-1 && joins.length > 1) {

					return maxjoin;

				} else if (i == points.length-1) {

					return null;

				};

			};
		
		};

	} else {

		return null;

	};

};

function cleansuppjoins(alljoins, start) {

	if (alljoins[start] && start < alljoins.length-1) {
									
		if (alljoins[start+1].price/alljoins[start].price < 1.08 && alljoins[start+1].price/alljoins[start].price > 0.92) {

			if (alljoins[start+1].price/alljoins[start].price >= 1) {
				alljoins.splice(start+1, 1);
				return cleansuppjoins(alljoins,start);
			} else {
				alljoins.splice(start, 1);
				return cleansuppjoins(alljoins,start);
			};

		} else {

			return cleansuppjoins(alljoins,start + 1);
		
		}

	} else if (!alljoins[start] && start <= alljoins.length-1) {
		console.log('in badland supp');
		alljoins.splice(start, 1);
		cleansuppjoins(alljoins,start);

	// } else if (!alljoins[start] && start < alljoins.length-1) {

	// 	alljoins.splice(start, 1);
	// 	cleansuppjoins(alljoins,start);
	
	} else if (start >= alljoins.length-1) {

		return alljoins
	
	};

};

function cleanresjoins(alljoins, start) {

	if (alljoins[start] && start < alljoins.length-1) {
									
		if (alljoins[start+1].price/alljoins[start].price < 1.08 && alljoins[start+1].price/alljoins[start].price > 0.92) {

			if (alljoins[start+1].price/alljoins[start].price <= 1) {
				alljoins.splice(start+1, 1);
				return cleanresjoins(alljoins,start);
			} else {
				alljoins.splice(start, 1);
				return cleanresjoins(alljoins,start);
			};

		} else {

			return cleanresjoins(alljoins,start + 1);
		
		}

	} else if (!alljoins[start] && start <= alljoins.length-1) {
		console.log('in badland res');
		alljoins.splice(start, 1);
		return cleanresjoins(alljoins,start);

	// } else if (!alljoins[start] && start < alljoins.length-1) {

	// 	alljoins.splice(start, 1);
	// 	return cleanresjoins(alljoins,start);
	
	} else if (start >= alljoins.length-1) {

		return alljoins
	
	};

};