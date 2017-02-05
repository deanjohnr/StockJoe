var moment = require('moment');

Parse.Cloud.job("tickerLevelsGen", function(request, response) {

	var tickers = [];

	// Pull Active Tickers
	var Ticker = Parse.Object.extend('Ticker');
	var etfquery = new Parse.Query(Ticker);
	etfquery.equalTo('isActivated', true);
	var compquery = new Parse.Query(Ticker);
	compquery.equalTo('isCompany', true);
	compquery.greaterThan('MarketCapitalization', 100000000);
	var tickquery = Parse.Query.or(compquery,etfquery);
	tickquery.equalTo('isActive', true);
	tickquery.notEqualTo('LevelTrigger', false);
	//tickquery.limit(1000);
	tickquery.each(function(res) {
		tickers.push(res);
	}).then(function() {

		if (tickers.length > 0){
			var j = 0;
			levelsftn(tickers,j,response);
		} else {
			response.success('no tickers');
		}

	}, function(error) {
	    // Set the job's error status
	    response.error('Failed to Get currtickers');
	});

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
					response.error(err);
				});	
		},
		function(err) {
			console.error(err);
			response.error(err);
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

		// ANALYSIS LOOP
		for (var i = sh.length-1; i >= 0; i--) {

			adjclose.push(Number(sh[i].Close).toFixed(2));

			if (i == 0) {

				var valleyray = [];
				var peakray = [];

				for (var jj = 0; jj < adjclose.length; jj++) {

					if (jj > 0 && jj < adjclose.length-1 && adjclose[jj] < adjclose[jj+1] && adjclose[jj] < adjclose[jj-1]) {
						valleyray.push({
							price: adjclose[jj],
							ndx: jj
						})
					} else if (jj > 0 && jj < adjclose.length-1 && adjclose[jj] > adjclose[jj+1] && adjclose[jj] > adjclose[jj-1]) {
						peakray.push({
							price: adjclose[jj],
							ndx: jj
						})
					};
					
					if (jj == adjclose.length-1) {
						
						var suppjoins = [];
						var resjoins = [];
						var suppprices = [];
						var resprices = [];

						for (var k = 0; k < valleyray.length; k++) {

							var suppjoin = getsupptrendpoints(valleyray, valleyray[k]);

							if (suppjoin) {
								//console.log(suppjoin);
								suppjoins.push(suppjoin);
								suppprices.push(suppjoin.price);
								//console.log(suppjoins);
							};

							if (k == valleyray.length-1) {

								//console.log(suppjoins);
								var suppresult = cleansuppjoins(suppjoins,0);

								for (var m = 0; m < peakray.length; m++) {

									var resjoin = getrestrendpoints(peakray, peakray[m]);

									if (resjoin) {
										//console.log(resjoin);
										resjoins.push(resjoin);
										resprices.push(resjoin.price);
										//console.log(resjoins);
									};

									if (m == peakray.length-1) {

										//console.log(resjoins);
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
			
			};

		};

	} else {

		if (ticker.get('TickerCode')) {
			console.log('FAILED TICKER HistData: ' + ticker.get('TickerCode'));
		};

		levelsftn(newres,j+1,response);
		
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

	for (var i = 0; i < points.length; i++) {

		if (points[i].ndx > point.ndx) {

			if (isAlive) {

				//console.log(points[i].price/point.price);

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

				//console.log(minjoin.price);
				return minjoin;

			};

		};
	
	};

};

function getrestrendpoints(points, point) {

	var isAlive = true;
	var joins = [point];
	var maxjoin = point;
	var tjoin = null;

	for (var i = 0; i < points.length; i++) {

		if (points[i].ndx > point.ndx) {

			if (isAlive) {

				//console.log(points[i].price/point.price);

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

				//console.log(maxjoin.price);
				return maxjoin;

			};

		};
	
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

		alljoins.splice(start, 1);
		cleansuppjoins(alljoins,start);
	
	} else if (start >= alljoins.length-1) {
		//console.log(alljoins);
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

		alljoins.splice(start, 1);
		return cleanresjoins(alljoins,start);
	
	} else if (start >= alljoins.length-1) {
		//console.log(alljoins);
		return alljoins
	
	};

};