var moment = require('moment');
var Mandrill = require('mandrill');
Mandrill.initialize('MANDRILL KEY');

// MASTER JOB
Parse.Cloud.job("MasterJob", function(request, response) {

	var dayoweek = moment.utc().format('dddd');
	var weekRay = ['Saturday','Tuesday','Wednesday','Thursday','Friday'];

	var thehour = moment.utc().format('H');
	var theminute = moment.utc().format('m'); 

	console.log(dayoweek);
	console.log(thehour);

	if (weekRay.indexOf(dayoweek) >= 0) {

		if (thehour == 12 && theminute <= 15) {

			var userRay = [];
			var tickerRay = [];
			var tickerAlerts = [];
			var lessons = [];

			// Get Lessons
			var Lesson = Parse.Object.extend('Lessons');
			var lessonquery = new Parse.Query(Lesson);
			lessonquery.ascending("LessonNumber");
			lessonquery.find({

				success: function(lessons) {

					// Pull Active Users
					var User = Parse.User
					var userquery = new Parse.Query(User);
					userquery.equalTo('isActivated',true);
					userquery.each(function(user) {
						userRay.push(user);
					},
					{
						success: function(users) {

							var momit = moment.utc().startOf('day').toDate();

							var Ticker = Parse.Object.extend('Ticker');
							var tickquery = new Parse.Query(Ticker);
							tickquery.equalTo('isActivated', true);
							tickquery.equalTo('isActive', true);
							tickquery.greaterThan('RefreshAlertDate',momit);
							tickquery.each(function(tick) {
								tickerRay.push(tick);
								var green = false;
								var red = false;
								if (tick.get('Change') > 0) {
									green = true;
								} else if (tick.get('Change') < 0) {
									red = true;
								};

								tickerAlerts.push(
								{
									tickercode: tick.get('TickerCode'),
									tickername: tick.get('TickerName'),
									maalerts: tick.get('maAlerts'),
									volalert: [tick.get('volAlert')],
									volialert: [tick.get('voliAlert')],
									close: tick.get('Close'),
									change: tick.get('Change'),
									pctchange: tick.get('pctChange'),
									tickervolume: tick.get('Volume'),
									tickeravgvolume: tick.get('avgVolume'),
									red: red,
									green: green
								})
							},
							{
								success: function(tickers) {

									var Index = Parse.Object.extend('Indices');
									var ndxquery = new Parse.Query(Index);
									ndxquery.equalTo('Ticker','^GSPC');
									ndxquery.first({
										success: function(ndx) {

											var green = false;
											var red = false;
											if (ndx.get('Change') > 0) {
												green = true;
											} else if (ndx.get('Change') < 0) {
												red = true;
											};

											var theindex = {
												tickercode: ndx.get('TickerAlt'),
												tickername: ndx.get('Name'),
												maalerts: ndx.get('maAlerts'),
												close: ndx.get('Close'),
												change: ndx.get('Change'),
												pctchange: ndx.get('pctChange'),
												tickervolume: ndx.get('Volume'),
												tickeravgvolume: ndx.get('avgVolume'),
												red: red,
												green: green
											}

											var momit = moment.utc().startOf('day').toDate();

											var Why = Parse.Object.extend('Whys');
											var whyquery = new Parse.Query(Why);
											whyquery.greaterThan('WhyDate',momit);
											whyquery.notEqualTo('isUsed',true);
											whyquery.descending('updatedAt');
											whyquery.first({
												success: function(why) {

													if (why) {
														var thewhy = {
															whytitle: why.get('WhyTitle'),
															whymess: why.get('WhyContent')
														}
													} else {
														var thewhy = null;
													};

													matchTickers(userRay,tickerAlerts,lessons,theindex,thewhy,why,response);

												},
												error: function(error) {
													response.error('Failed to get Fresh Brew');
												}
											});
											
										},
										error: function(error) {
											response.error('Failed to get Index');
										}
									})
								},
								error: function(error) {
									response.error('ERROR: Failed to get tickers');
								}
							})

						},
						error: function(error) {
							response.error(error);
						}
					});
				
				},
				error: function(error) {
					response.error(error)
				}

			});
		
		} else if (thehour == 13 && theminute >= 44) {

			var momit = moment.utc().startOf('day').toDate();

			var Why = Parse.Object.extend('Whys');
			var whyquery = new Parse.Query(Why);
			whyquery.greaterThan('WhyDate',momit);
			whyquery.equalTo('isUsed',true);
			whyquery.descending('updatedAt');
			whyquery.first({
				success: function(why) {

					if (why) {
						var thewhy = {
							whytitle: why.get('WhyTitle'),
							whymess: why.get('WhyContent'),
							whytickers: why.get('WhyTickers'),
							whyid: why.id
						}

						if (!thewhy.whytickers){
							thewhy.whytickers = ""
						}

						var bodystr = "<p>Today's Fresh Brew, " + thewhy.whytitle + " " + thewhy.whytickers + " http://www.stockjoe.com/#!/post/" + thewhy.whyid + "</p>"

						Mandrill.sendEmail({
							message: {
						        html: bodystr,
						        to: [
						            {
						                email: "trigger@recipe.ifttt.com",
						                name: "IFTT",
						                type: "to"
						            }
						        ],
								subject: '#alerttweet',
								from_email: "john@stockjoe.com",
								from_name: "Stock Joe",
								track_opens: true,
					        	track_clicks: true,
					        	view_content_link: true,
					        	merge_language: 'handlebars',
					        	tags: ['tweet']
							},
							async: true
							},{
							success: function(httpResponse) {
								response.success("IFTTT Email sent!");
							},
							error: function(httpResponse) {
								console.error(httpResponse);
								response.error("Uh oh, something went wrong");
							}
						});

					} else {
						response.error('No Fresh Brew Returned');
					}

				},
				error: function(error) {
					response.error('Failed to get Fresh Brew for Tweet');
				}
			});

		} else {

			var momit = moment.utc().startOf('day').toDate();
			var submom = moment.utc().subtract({ days: 2 }).toDate();

			var Index = Parse.Object.extend('Indices');
			var ndxquery = new Parse.Query(Index);
			ndxquery.equalTo('Ticker','^GSPC');
			ndxquery.lessThanOrEqualTo('LastPriceDate',submom);
			ndxquery.first({
				success: function(ndxres) {

					if (ndxres){
						var j = 0;
						console.log('Getting Index');
						console.log(ndxres.get('LastPriceDate'));
						indexftndev(ndxres,response);
					} else {

						var tickers = [];

						// Pull Active Tickers
						var Ticker = Parse.Object.extend('Ticker');
						var tickquery = new Parse.Query(Ticker);
						tickquery.equalTo('isActivated', true);
						tickquery.equalTo('isActive', true);
						//tickquery.equalTo('TickerCode', 'W');
						//tickquery.lessThan('RefreshAlertDate',momit);
						tickquery.lessThanOrEqualTo('LastPriceDate',submom);
						//tickquery.ascending('MarketCapitalization');
						tickquery.limit(1000);
						tickquery.find({
							success: function(tickers) {

								if (tickers.length > 0){

									console.log('TopAlert: ' + tickers.length);

									var j = 0;
									tickerftn(tickers,j,response);

								} else {

									var momit = moment.utc().startOf('day').subtract({ hours: 4 }).toDate();

									var tickers = [];

									// Pull Active Tickers
									var Ticker = Parse.Object.extend('Ticker');
									var etfquery = new Parse.Query(Ticker);
									etfquery.equalTo('isActivated', true);
									var compquery = new Parse.Query(Ticker);
									compquery.equalTo('isCompany', true);
									//compquery.greaterThan('MarketCapitalization', 200000000);
									var tickquery = Parse.Query.or(compquery,etfquery);
									tickquery.equalTo('isActive', true);
									tickquery.lessThan('RefreshAlertDate',momit);  // CHANGE THIS BACK TO LESSTHAN
									tickquery.each(function(res) {
										tickers.push(res);
									}).then(function() {

										if (tickers.length > 0){

											console.log('AllAlert: ' + tickers.length);

											var j = 0;
											tickerftn(tickers,j,response);

										} else {
											
											var dstart = moment.utc().startOf('day').toDate();

											var trytickers = [];
											var currtickers = [];

											var Ticker = Parse.Object.extend('Ticker');
											var etfquery = new Parse.Query(Ticker);
											etfquery.equalTo('isActivated', true);
											var compquery = new Parse.Query(Ticker);
											compquery.equalTo('isCompany', true);
											//compquery.greaterThan('MarketCapitalization', 250000000);
											var tickquery = Parse.Query.or(compquery,etfquery);
											tickquery.equalTo('isActive', true);
											tickquery.lessThan('RefreshedDate',dstart);
											tickquery.each(function(tres) {
												currtickers.push({parseticker: tres, tickerstr: tres.get('TickerCode')});
												trytickers.push(tres.get('TickerCode'));
												}).then(function() {

													// START QUERYING
													if (trytickers.length > 0) {

														console.log('DataUpdate: ' + currtickers.length);

														var n = 0;
														runYQLTests(trytickers, n, response, currtickers);

													} else {

														var tickers = [];

														var pmom = moment.utc().startOf('day').subtract({ days: 7 }).toDate();

														// Pull Active Tickers
														var Ticker = Parse.Object.extend('Ticker');
														var timequery = new Parse.Query(Ticker);
														timequery.lessThan('LevelRefreshDate', pmom);
														var trigquery = new Parse.Query(Ticker);
														trigquery.notEqualTo('LevelTrigger',false);
														var tickquery = Parse.Query.or(trigquery,timequery);
														tickquery.equalTo('isActive', true);
														tickquery.equalTo('isCompany', true);
														tickquery.greaterThan('MarketCapitalization', 200000000);
														tickquery.ascending('MarketCapitalization');
														tickquery.limit(1000);
														tickquery.find({
															success: function(tickers) {

																if (tickers.length > 0){

																	console.log('Levels: ' + tickers.length);

																	var j = 0;
																	levelsftn(tickers,j,response);

																} else {
																	response.success('No Updates');
																}

															},
															error: function(error) {
														    	response.error('Failed to Get Level Tickers');
														    }
														});

													}

											}, function(error) {
											    // Set the job's error status
											    response.error('Failed to Get Data Tickers');
											});

										}

									}, function(error) {
									    // Set the job's error status
									    response.error('Failed to Get All Alert Tickers');
									});

								}

							}, error: function(error) {
							    // Set the job's error status
							    response.error('Failed to Get Top Alert Tickers');
							}
						});

			}

				},
				error: function(err) {
					console.error(err);
					response.error(err);
				}
			});

		}

	} else {
		response.success('Not Today');
	}

});


// PROD CLOUD ALERT GENERATION
function tickerftn(theres,j,response) {

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
	var myear = pyear - 1;
	var oyear = myear - 1;
	
	if (mmonth == 13) {
		mmonth = 1;
		myear = pyear;
		oyear = myear - 1
	};

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

					runalertalgo(res1,res2,ticker,j,response,newres);
			    	
				},
				function(err) {
					console.error('YAHOO API 2 ERROR: ' + tickercode);
					runalertalgo(res1,null,ticker,j,response,newres);
					//response.error(err);
				});	
		},
		function(err) {
			console.error('YAHOO API ERROR: ' + tickercode);
			runalertalgo(null,null,ticker,j,response,newres);
		});

};

// COMMA GENERATION
function commaSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
    	val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}


// ALGO
function runalertalgo(res1,res2,ticker,j,response,newres) {

	if (res1 && res1.data.query.results) {

		if (res2 && res2.data.query.results) {
			var sh = res1.data.query.results.quote.concat(res2.data.query.results.quote);
		} else {
			var sh = res1.data.query.results.quote;
		};

		var adjclose = [];
		var volume = [];
		var dateray = [];
		var isETF = ticker.get('isETF');

		// ANALYSIS LOOP
		for (var i = sh.length-1; i >= 0; i--) {

			adjclose.push(Number(sh[i].Adj_Close).toFixed(2));
			volume.push(Number(sh[i].Volume));
			dateray.push(sh[i].Date);

			if (i == sh.length-1) {
				var high = adjclose[adjclose.length-1];
				var low = adjclose[adjclose.length-1];
				var rangehigh = adjclose[adjclose.length-1];
				var rangelow = adjclose[adjclose.length-1];
				var supp = [];
				var resist = [];
				var tp = 0;
				var tv = 0;
				var tsupp = null;
				var tresist = null;
				var twentySum = [adjclose[adjclose.length-1]/20];
				var fiftySum = [adjclose[adjclose.length-1]/50];
				var hundySum = [adjclose[adjclose.length-1]/100];
				var onefiftySum = [adjclose[adjclose.length-1]/150];
				var twoSum = [adjclose[adjclose.length-1]/200];
				var volSum = volume[volume.length-1] / 50;
				var istwentySum = false;
				var isfiftySum = false;
				var istwoSum = false;
				var ishundySum = false;
				var isonefiftySum = false;
				var isvolSum = false;
				var hasresist = false;
				var hassupport = false;
			} else if (i < sh.length-1) {

				if (i < sh.length-200) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150) - (adjclose[adjclose.length-151]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200) - (adjclose[adjclose.length-201]/200));
					istwoSum = true;
				} else if (i < sh.length-150) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150) - (adjclose[adjclose.length-151]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					isonefiftySum = true;
				} else if (i < sh.length-100) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					ishundySum = true;
				} else if (i < sh.length-50) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					isvolSum = true;
					isfiftySum = true;
				} else if (i < sh.length-20) {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
					istwentySum = true;
				} else {
					twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20));
					fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50));
					hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
					onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
					twoSum.push(twoSum[twoSum.length-1] + (adjclose[adjclose.length-1]/200));
				};

				if (i < 50) {
					volSum += volume[volume.length-1] / 50;
				};

				if (adjclose[adjclose.length-1] > high) {
					high = adjclose[adjclose.length-1];
				} else if (adjclose[adjclose.length-1] < low){
					low = adjclose[adjclose.length-1];
				} else if (adjclose[adjclose.length-1] < rangelow){
					rangelow = adjclose[adjclose.length-1];
				} else if (adjclose[adjclose.length-1] > rangehigh){
					rangehigh = adjclose[adjclose.length-1];
				};

				
				if (i == 0) { // STOCK NOTIFICATIONS

					twentySum[twentySum.length-1] = +(twentySum[twentySum.length-1].toFixed(2));
					fiftySum[fiftySum.length-1] = +(fiftySum[fiftySum.length-1].toFixed(2));
					hundySum[hundySum.length-1] = +(hundySum[hundySum.length-1].toFixed(2));
					onefiftySum[onefiftySum.length-1] = +(onefiftySum[onefiftySum.length-1].toFixed(2));
					twoSum[twoSum.length-1] = +(twoSum[twoSum.length-1].toFixed(2));

					var maalerts = [];

					if (isETF) {

						// PRICE OVER 50
						if (isfiftySum && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] < 1.02 && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
							// P/50 BEAR APP ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isfiftySum && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] < 1.02 && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
							// P/50 BULL APP ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isfiftySum && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] < 1 && fiftySum[fiftySum.length-2]/adjclose[sh.length-2] >= 1) {
							// P/50 BULL CROSS ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isfiftySum && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] < 1 && adjclose[sh.length-2]/fiftySum[fiftySum.length-2] >= 1) {
							// P/50 BEAR CROSS ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						};

						// PRICE OVER 100
						if (ishundySum && adjclose[sh.length-1]/hundySum[hundySum.length-1] < 1.02 && adjclose[sh.length-1]/hundySum[hundySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
							// P/100 BEAR APP ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (ishundySum && hundySum[hundySum.length-1]/adjclose[sh.length-1] < 1.02 && hundySum[hundySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
							// P/100 BULL APP ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (ishundySum && hundySum[hundySum.length-1]/adjclose[sh.length-1] < 1 && hundySum[hundySum.length-2]/adjclose[sh.length-2] >= 1) {
							// P/100 BULL CROSS ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (ishundySum && adjclose[sh.length-1]/hundySum[hundySum.length-1] < 1 && adjclose[sh.length-2]/hundySum[hundySum.length-2] >= 1) {
							// P/100 BEAR CROSS ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						};

						// PRICE OVER 150
						if (isonefiftySum && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] < 1.02 && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
							// P/150 BEAR APP ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isonefiftySum && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] < 1.02 && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
							// P/150 BULL APP ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isonefiftySum && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] < 1 && onefiftySum[onefiftySum.length-2]/adjclose[sh.length-2] >= 1) {
							// P/150 BULL CROSS ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						} else if (isonefiftySum && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] < 1 && adjclose[sh.length-2]/onefiftySum[onefiftySum.length-2] >= 1) {
							// P/150 BEAR CROSS ALERT
							maalerts.push({
								mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
								ticker: ticker.get('TickerCode'),
								price: adjclose[sh.length-1],
								date: dateray[sh.length-1],
								volume: volume[sh.length-1]
							});
						};

					};

					// PRICE OVER 200
					if (istwoSum && adjclose[sh.length-1]/twoSum[twoSum.length-1] < 1.02 && adjclose[sh.length-1]/twoSum[twoSum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
						// P/200 BEAR APP ALERT
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (istwoSum && twoSum[twoSum.length-1]/adjclose[sh.length-1] < 1.02 && twoSum[twoSum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
						// P/200 BULL APP ALERT
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (istwoSum && twoSum[twoSum.length-1]/adjclose[sh.length-1] < 1 && twoSum[twoSum.length-2]/adjclose[sh.length-2] >= 1) {
						// P/200 BULL CROSS ALERT
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (istwoSum && adjclose[sh.length-1]/twoSum[twoSum.length-1] < 1 && adjclose[sh.length-2]/twoSum[twoSum.length-2] >= 1) {
						// P/200 BEAR CROSS ALERT
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					};


					// 50 OVER 200
					if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 50/200 BEAR APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
						// 50/200 BULL APP ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 50/200 BEAR CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-2]/twoSum[twoSum.length-2] <= 1) {
						// 50/200 BULL CROSS ALERT
						maalerts.push({
							mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: twoSum[twoSum.length-1],
							lowmap: fiftySum[fiftySum.length-1],
							highmat: '200',
							lowmat: '50',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					};

					// 20 OVER 50
					if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
						// 20/50 BEAR APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twentySum[twentySum.length-5] > 1.01) {
						// 20/50 BULL APP ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-2]/twentySum[twentySum.length-2] <= 1) {
						// 20/50 BEAR CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && twentySum[twentySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
						// 20/50 BULL CROSS ALERT
						maalerts.push({
							mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
							ticker: ticker.get('TickerCode'),
							highmap: fiftySum[fiftySum.length-1],
							lowmap: twentySum[twentySum.length-1],
							highmat: '50',
							lowmat: '20',
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					};

					// SUPPORT / RESISTANCE
					var support = ticker.get('SupportVal');
					var resist = ticker.get('ResistVal');
					if (!isETF && support && support > 0 && adjclose[sh.length-1]/support < 1.03 && adjclose[sh.length-1]/support > 1) {
						// NEAR SUPPORT ALERT
						ticker.set('isBreakout',false);
						ticker.set('isBreakdown',false);
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is near support ($ ' + support + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (!isETF && support && support > 0 && adjclose[sh.length-1]/support < 1 && adjclose[sh.length-2]/support > 1) {
						// BROKE SUPPORT ALERT
						ticker.set('isBreakdown',true);
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') broke support ($ ' + support + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
						ticker.set('LevelTrigger', true);
					} else if (!isETF && resist && resist > 0 && resist/adjclose[sh.length-1] < 1.03 && resist/adjclose[sh.length-1] > 1) {
						// NEAR RESIST ALERT
						ticker.set('isBreakout',false);
						ticker.set('isBreakdown',false);
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') is near resistance ($ ' + resist + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
					} else if (!isETF && resist && resist > 0 && resist/adjclose[sh.length-1] < 1 && resist/adjclose[sh.length-2] > 1) {
						// BROKE RESIST ALERT
						ticker.set('isBreakout',true);
						maalerts.push({
							mess: ticker.get('TickerCode') + ' ($ ' + adjclose[sh.length-1] + ') broke resistance ($ ' + resist + ')',
							ticker: ticker.get('TickerCode'),
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						});
						ticker.set('LevelTrigger', true);
					} else {
						ticker.set('isBreakout',false);
						ticker.set('isBreakdown',false);
					};

					// Set Level Trigger True
					if (adjclose[sh.length-1] > adjclose[sh.length-2] && adjclose[sh.length-3] > adjclose[sh.length-2] && adjclose[sh.length-10] > adjclose[sh.length-2]) {
						ticker.set('LevelTrigger', true);
					} else if (adjclose[sh.length-1] < adjclose[sh.length-2] && adjclose[sh.length-3] < adjclose[sh.length-2] && adjclose[sh.length-10] < adjclose[sh.length-2]) {
						ticker.set('LevelTrigger', true);
					} else if (resist && adjclose[sh.length-1] > resist && support && adjclose[sh.length-1] < support) {
						ticker.set('LevelTrigger', true);
					};

					// Std. Dev
					if (sh.length > 49) {
						var sdlen = 50;
					} else {
						var sdlen = volume.length;
					};

					//volumeVariance
					var v = 0;
					for (var k = 0; k < sdlen; k++) {
						v = v + ((volume[sh.length-1-k] - volSum) * (volume[sh.length-1-k] - volSum) / 50);
					};

					//volatilityVariance
					var volivar = 0;
					for (var l = 0; l < sdlen; l++) {
						volivar = volivar + ((adjclose[sh.length-1-l] - fiftySum[fiftySum.length-1]) * (adjclose[sh.length-1-l] - fiftySum[fiftySum.length-1]) / 50);
					};

					//STDev
					var sd = Math.sqrt(v);
					var volisd = Math.sqrt(volivar);

					//Volume Alert

					if (!isETF && isvolSum && sd && (volume[sh.length-1] - volSum) > (sd)) {
						var volalert = {
							mess: 'High trading volume on ' + commaSeparateNumber(volume[sh.length-1]) + ' shares traded compared to an average of ' + commaSeparateNumber(Math.round(volSum)) + ' shares traded',
							ticker: ticker.get('TickerCode'),
							meanvol: volSum,
							price: adjclose[sh.length-1],
							date: dateray[sh.length-1],
							volume: volume[sh.length-1]
						};
						maalerts.push(volalert);
					} else {
						var volalert = null;
					};

					var mom = moment.utc().toDate();
					var momsub = moment().subtract({ days: 5 }).toDate();
					var pricedate = moment(dateray[sh.length-1]).toDate();

					if (momsub < pricedate) {
						ticker.set('isActive', true);
					} else {
						ticker.set('isActive', false);
					}

					ticker.set('maAlerts', maalerts);
					ticker.set('volAlert', volalert);
					ticker.set('Close', +(adjclose[sh.length-1]));
					ticker.set('Change', +(adjclose[sh.length-1] - adjclose[sh.length-2]).toFixed(2));
					ticker.set('pctChange', +((adjclose[sh.length-1] / adjclose[sh.length-2] - 1) * 100).toFixed(2));
					ticker.set('avgVolume', Math.round(volSum));
					ticker.set('Volume', +(volume[sh.length-1].toFixed(2)));
					ticker.set('twentyDay', +(twentySum[twentySum.length-1].toFixed(2)));
					ticker.set('fiftyDay', +(fiftySum[fiftySum.length-1].toFixed(2)));
					ticker.set('hundyDay', +(hundySum[hundySum.length-1].toFixed(2)));
					ticker.set('onefiftyDay', +(onefiftySum[onefiftySum.length-1].toFixed(2)));
					ticker.set('twoDay', +(twoSum[twoSum.length-1].toFixed(2)));
					ticker.set('RefreshAlertDate', mom);
					ticker.set('LastPriceDate', moment(dateray[sh.length-1]).toDate());

					if (j == newres.length-1) {
						ticker.save({
							success: function(result) {
								response.success('ALERT SUCCESS');
							},
							error: function(error) {
								response.error(error);
							}
						});
					} else {
						ticker.save({
							success: function(result) {
								tickerftn(newres,j+1,response);
							},
							error: function(error) {
								console.log(error);
								tickerftn(newres,j+1,response);
							}
						});
					};
				};
			};
		};

	} else {

		if (ticker.get('TickerCode')) {
			
			console.error('FAILED TICKER: ' + ticker.get('TickerCode'));

			var mom = moment.utc().toDate();

			if (ticker.get('isActivated') != true) {

				ticker.set('RefreshAlertDate', mom);

				ticker.save({
					success: function(result) {

					},
					error: function(error) {

					}
				});

			};

		};

		if (j == newres.length-1) {

			response.success('SUCCESS');

		} else {

			tickerftn(newres,j+1,response);

		};

	};
}

function runYQLTests(tickers, n, response, currtickers) {

	var trialtickers = tickers.slice(n,n+5);

	var escurl = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22';

	for (var i = 0; i < trialtickers.length; i++) {
		if (i == trialtickers.length-1) {
			
			escurl = escurl + trialtickers[i] + '%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

			Parse.Cloud.httpRequest(
				{
					url: escurl,
					datatype: 'jsonp',
					jsonp: "callback",
		    		jsonpCallback: "quote",
				})
				.then(function (res1) {

					parseTickers(res1,tickers,n,response,currtickers);
			    	
				},
				function(err) {
					console.error('YAHOO API QUOTE ERROR');
					response.error(n.toString());
				});	

		} else {
			escurl = escurl + trialtickers[i] + '%22%2C%22';
		};
		
	};

}

function parseTickers(res1,tickers,n,response,currtickers) {

	// Parse Results
	if (res1 && res1.data.query.results) {

		var tickerdata = res1.data.query.results.quote

		if (tickerdata.length > 1) {

			for (var m = 0; m < tickerdata.length; m++) {
				
				var tempdata = currtickers.filter(function(el){
					return el.tickerstr == tickerdata[m].Symbol;
				});

				var d = moment().utc().toDate();
				var dminus = moment().subtract({ days: 8 }).utc().toDate();

				if (tempdata[0]) {

					var targticker = tempdata[0].parseticker;

					if (tickerdata[m].Bid && tickerdata[m].Ask && tickerdata[m].Name && tickerdata[m].StockExchange && tickerdata[m].StockExchange != 'PNK') {

						targticker.set('isActive', true);

						targticker.set('RefreshedDate', d);

						targticker.set('PEGRatio', tickerdata[m].PEGRatio);
						targticker.set('PriceEPSEstimateCurrentYear', tickerdata[m].PriceEPSEstimateCurrentYear);
						targticker.set('PriceEPSEstimateNextYear', tickerdata[m].PriceEPSEstimateNextYear);
						targticker.set('ShortRatio', tickerdata[m].ShortRatio);
						targticker.set('OneyrTargetPrice', tickerdata[m].OneyrTargetPrice);
						targticker.set('DividendYield', Number(tickerdata[m].DividendYield));
						targticker.set('PERatio', tickerdata[m].PERatio);
						targticker.set('ExDividendDate', tickerdata[m].ExDividendDate);
						targticker.set('DividendPayDate', tickerdata[m].DividendPayDate);
						targticker.set('PriceBook', tickerdata[m].PriceBook);
						targticker.set('PriceSales', tickerdata[m].PriceSales);
						targticker.set('EBITDA', toFullNum(tickerdata[m].EBITDA));
						targticker.set('MarketCapitalization', toFullNum(tickerdata[m].MarketCapitalization));
						targticker.set('YearHigh', tickerdata[m].YearHigh);
						targticker.set('YearLow', tickerdata[m].YearLow);
						targticker.set('EPSEstimateCurrentYear', tickerdata[m].EPSEstimateCurrentYear);
						targticker.set('EPSEstimateNextYear', tickerdata[m].EPSEstimateNextYear);
						targticker.set('EPSEstimateNextQuarter', tickerdata[m].EPSEstimateNextQuarter);
						targticker.set('EarningsShare', tickerdata[m].EarningsShare);
						targticker.set('BookValue', Number(tickerdata[m].BookValue));
						targticker.set('AverageDailyVolume', Number(tickerdata[m].AverageDailyVolume));
						targticker.set('DividendShare', Number(tickerdata[m].DividendShare));
						targticker.set('DaysLow', Number(tickerdata[m].DaysLow));
						targticker.set('DaysHigh', Number(tickerdata[m].DaysHigh));
						targticker.set('StockExchange', tickerdata[m].StockExchange)

						targticker.save({
							success: function(res) {

							},
							error: function(res, error) {

								console.log(error);

							}
						});

					} else {

						targticker.set('RefreshedDate', d);

						targticker.save({
							success: function(res) {

							},
							error: function(res) {

								console.log('Failed To Deactivate Ticker');

							}
						});

					};

				} else if (tickerdata[m].MarketCapitalization && tickerdata[m].PriceSales && tickerdata[m].EBITDA && tickerdata[m].Name) {

					var Ticker = Parse.Object.extend('Ticker');
					var newticker = new Ticker();

					newticker.set('isActive', true);

					newticker.set('RefreshedDate', d);
					newticker.set('RefreshAlertDate', dminus);
					newticker.set('LevelRefreshDate', dminus);

					newticker.set('isCompany', true);
					newticker.set('isETF', false);

					newticker.set('TickerCode', tickerdata[m].Symbol);
					newticker.set('TickerName', tickerdata[m].Name);
					newticker.set('PEGRatio', tickerdata[m].PEGRatio);
					newticker.set('PriceEPSEstimateCurrentYear', tickerdata[m].PriceEPSEstimateCurrentYear);
					newticker.set('PriceEPSEstimateNextYear', tickerdata[m].PriceEPSEstimateNextYear);
					newticker.set('ShortRatio', tickerdata[m].ShortRatio);
					newticker.set('OneyrTargetPrice', tickerdata[m].OneyrTargetPrice);
					newticker.set('DividendYield', Number(tickerdata[m].DividendYield));
					newticker.set('PERatio', tickerdata[m].PERatio);
					newticker.set('ExDividendDate', tickerdata[m].ExDividendDate);
					newticker.set('DividendPayDate', tickerdata[m].DividendPayDate);
					newticker.set('PriceBook', tickerdata[m].PriceBook);
					newticker.set('PriceSales', tickerdata[m].PriceSales);
					newticker.set('EBITDA', toFullNum(tickerdata[m].EBITDA));
					newticker.set('MarketCapitalization', toFullNum(tickerdata[m].MarketCapitalization));
					newticker.set('YearHigh', tickerdata[m].YearHigh);
					newticker.set('YearLow', tickerdata[m].YearLow);
					newticker.set('EPSEstimateCurrentYear', tickerdata[m].EPSEstimateCurrentYear);
					newticker.set('EPSEstimateNextYear', tickerdata[m].EPSEstimateNextYear);
					newticker.set('EPSEstimateNextQuarter', tickerdata[m].EPSEstimateNextQuarter);
					newticker.set('EarningsShare', tickerdata[m].EarningsShare);
					newticker.set('BookValue', Number(tickerdata[m].BookValue));
					newticker.set('AverageDailyVolume', Number(tickerdata[m].AverageDailyVolume));
					newticker.set('DividendShare', Number(tickerdata[m].DividendShare));
					newticker.set('DaysLow', Number(tickerdata[m].DaysLow));
					newticker.set('DaysHigh', Number(tickerdata[m].DaysHigh));
					newticker.set('StockExchange', tickerdata[m].StockExchange);

					newticker.save({
						success: function(res) {

						},
						error: function(res,error) {

							console.log(error);

						}
					});

				} else if (tickerdata[m].Bid && tickerdata[m].Ask && tickerdata[m].Name) {

					var Ticker = Parse.Object.extend('Ticker');
					var newticker = new Ticker();

					newticker.set('isActive', true);

					newticker.set('RefreshedDate', d);
					newticker.set('RefreshAlertDate', dminus);
					newticker.set('LevelRefreshDate', dminus);

					newticker.set('isCompany', false);
					newticker.set('isETF', true);

					newticker.set('TickerCode', tickerdata[m].Symbol);
					newticker.set('TickerName', tickerdata[m].Name);
					newticker.set('PEGRatio', tickerdata[m].PEGRatio);
					newticker.set('PriceEPSEstimateCurrentYear', tickerdata[m].PriceEPSEstimateCurrentYear);
					newticker.set('PriceEPSEstimateNextYear', tickerdata[m].PriceEPSEstimateNextYear);
					newticker.set('ShortRatio', tickerdata[m].ShortRatio);
					newticker.set('OneyrTargetPrice', tickerdata[m].OneyrTargetPrice);
					newticker.set('DividendYield', Number(tickerdata[m].DividendYield));
					newticker.set('PERatio', tickerdata[m].PERatio);
					newticker.set('ExDividendDate', tickerdata[m].ExDividendDate);
					newticker.set('DividendPayDate', tickerdata[m].DividendPayDate);
					newticker.set('PriceBook', tickerdata[m].PriceBook);
					newticker.set('PriceSales', tickerdata[m].PriceSales);
					newticker.set('EBITDA', toFullNum(tickerdata[m].EBITDA));
					newticker.set('MarketCapitalization', toFullNum(tickerdata[m].MarketCapitalization));
					newticker.set('YearHigh', tickerdata[m].YearHigh);
					newticker.set('YearLow', tickerdata[m].YearLow);
					newticker.set('EPSEstimateCurrentYear', tickerdata[m].EPSEstimateCurrentYear);
					newticker.set('EPSEstimateNextYear', tickerdata[m].EPSEstimateNextYear);
					newticker.set('EPSEstimateNextQuarter', tickerdata[m].EPSEstimateNextQuarter);
					newticker.set('EarningsShare', tickerdata[m].EarningsShare);
					newticker.set('BookValue', Number(tickerdata[m].BookValue));
					newticker.set('AverageDailyVolume', Number(tickerdata[m].AverageDailyVolume));
					newticker.set('DividendShare', Number(tickerdata[m].DividendShare));
					newticker.set('DaysLow', Number(tickerdata[m].DaysLow));
					newticker.set('DaysHigh', Number(tickerdata[m].DaysHigh));
					newticker.set('StockExchange', tickerdata[m].StockExchange);

					newticker.save({
						success: function(res) {

						},
						error: function(res,error) {

							console.log(error);

						}
					});

				}

				if (m == tickerdata.length-1) {

					if (n >= 1000 || n >= tickers.length-6) {

						console.log(tickers.length);
						response.success('REFRESHED TICKERS');

					} else {

						runYQLTests(tickers, n+5, response, currtickers);

					};

				};

			};

		} else {

			var tempdata = currtickers.filter(function(el){
				return el.tickerstr == tickerdata.Symbol;
			});

			var d = moment().utc().toDate();
			var dminus = moment().subtract({ days: 8 }).utc().toDate();

			if (tempdata[0]) {

				var targticker = tempdata[0].parseticker;

				if (tickerdata.Bid && tickerdata.Ask && tickerdata.Name && tickerdata.StockExchange && tickerdata.StockExchange != 'PNK') {

					targticker.set('isActive', true);

					targticker.set('RefreshedDate', d);

					targticker.set('PEGRatio', tickerdata.PEGRatio);
					targticker.set('PriceEPSEstimateCurrentYear', tickerdata.PriceEPSEstimateCurrentYear);
					targticker.set('PriceEPSEstimateNextYear', tickerdata.PriceEPSEstimateNextYear);
					targticker.set('ShortRatio', tickerdata.ShortRatio);
					targticker.set('OneyrTargetPrice', tickerdata.OneyrTargetPrice);
					targticker.set('DividendYield', Number(tickerdata.DividendYield));
					targticker.set('PERatio', tickerdata.PERatio);
					targticker.set('ExDividendDate', tickerdata.ExDividendDate);
					targticker.set('DividendPayDate', tickerdata.DividendPayDate);
					targticker.set('PriceBook', tickerdata.PriceBook);
					targticker.set('PriceSales', tickerdata.PriceSales);
					targticker.set('EBITDA', toFullNum(tickerdata.EBITDA));
					targticker.set('MarketCapitalization', toFullNum(tickerdata.MarketCapitalization));
					targticker.set('YearHigh', tickerdata.YearHigh);
					targticker.set('YearLow', tickerdata.YearLow);
					targticker.set('EPSEstimateCurrentYear', tickerdata.EPSEstimateCurrentYear);
					targticker.set('EPSEstimateNextYear', tickerdata.EPSEstimateNextYear);
					targticker.set('EPSEstimateNextQuarter', tickerdata.EPSEstimateNextQuarter);
					targticker.set('EarningsShare', tickerdata.EarningsShare);
					targticker.set('BookValue', Number(tickerdata.BookValue));
					targticker.set('AverageDailyVolume', Number(tickerdata.AverageDailyVolume));
					targticker.set('DividendShare', Number(tickerdata.DividendShare));
					targticker.set('DaysLow', Number(tickerdata.DaysLow));
					targticker.set('DaysHigh', Number(tickerdata.DaysHigh));
					targticker.set('StockExchange', tickerdata.StockExchange)

					targticker.save({
						success: function(res) {

						},
						error: function(res, error) {

							console.log(error);

						}
					});

				} else {

					targticker.set('RefreshedDate', d);

					targticker.save({
						success: function(res) {

						},
						error: function(res) {

						}
					});

				};

			} else if (tickerdata.MarketCapitalization && tickerdata.PriceSales && tickerdata.EBITDA && tickerdata.Name) {

				var Ticker = Parse.Object.extend('Ticker');
				var newticker = new Ticker();

				newticker.set('isActive', true);

				newticker.set('RefreshedDate', d);
				newticker.set('RefreshAlertDate', dminus);
				newticker.set('LevelRefreshDate', dminus);

				newticker.set('isCompany', true);
				newticker.set('isETF', false);

				newticker.set('TickerCode', tickerdata.Symbol);
				newticker.set('TickerName', tickerdata.Name);
				newticker.set('PEGRatio', tickerdata.PEGRatio);
				newticker.set('PriceEPSEstimateCurrentYear', tickerdata.PriceEPSEstimateCurrentYear);
				newticker.set('PriceEPSEstimateNextYear', tickerdata.PriceEPSEstimateNextYear);
				newticker.set('ShortRatio', tickerdata.ShortRatio);
				newticker.set('OneyrTargetPrice', tickerdata.OneyrTargetPrice);
				newticker.set('DividendYield', Number(tickerdata.DividendYield));
				newticker.set('PERatio', tickerdata.PERatio);
				newticker.set('ExDividendDate', tickerdata.ExDividendDate);
				newticker.set('DividendPayDate', tickerdata.DividendPayDate);
				newticker.set('PriceBook', tickerdata.PriceBook);
				newticker.set('PriceSales', tickerdata.PriceSales);
				newticker.set('EBITDA', toFullNum(tickerdata.EBITDA));
				newticker.set('MarketCapitalization', toFullNum(tickerdata.MarketCapitalization));
				newticker.set('YearHigh', tickerdata.YearHigh);
				newticker.set('YearLow', tickerdata.YearLow);
				newticker.set('EPSEstimateCurrentYear', tickerdata.EPSEstimateCurrentYear);
				newticker.set('EPSEstimateNextYear', tickerdata.EPSEstimateNextYear);
				newticker.set('EPSEstimateNextQuarter', tickerdata.EPSEstimateNextQuarter);
				newticker.set('EarningsShare', tickerdata.EarningsShare);
				newticker.set('BookValue', Number(tickerdata.BookValue));
				newticker.set('AverageDailyVolume', Number(tickerdata.AverageDailyVolume));
				newticker.set('DividendShare', Number(tickerdata.DividendShare));
				newticker.set('DaysLow', Number(tickerdata.DaysLow));
				newticker.set('DaysHigh', Number(tickerdata.DaysHigh));
				newticker.set('StockExchange', tickerdata.StockExchange);

				newticker.save({
					success: function(res) {

					},
					error: function(res,error) {

						console.log(error);

					}
				});

			} else if (tickerdata.Bid && tickerdata.Ask && tickerdata.Name) {

				var Ticker = Parse.Object.extend('Ticker');
				var newticker = new Ticker();

				newticker.set('isActive', true);

				newticker.set('RefreshedDate', d);
				newticker.set('RefreshAlertDate', dminus);
				newticker.set('LevelRefreshDate', dminus);

				newticker.set('isCompany', false);
				newticker.set('isETF', true);

				newticker.set('TickerCode', tickerdata.Symbol);
				newticker.set('TickerName', tickerdata.Name);
				newticker.set('PEGRatio', tickerdata.PEGRatio);
				newticker.set('PriceEPSEstimateCurrentYear', tickerdata.PriceEPSEstimateCurrentYear);
				newticker.set('PriceEPSEstimateNextYear', tickerdata.PriceEPSEstimateNextYear);
				newticker.set('ShortRatio', tickerdata.ShortRatio);
				newticker.set('OneyrTargetPrice', tickerdata.OneyrTargetPrice);
				newticker.set('DividendYield', Number(tickerdata.DividendYield));
				newticker.set('PERatio', tickerdata.PERatio);
				newticker.set('ExDividendDate', tickerdata.ExDividendDate);
				newticker.set('DividendPayDate', tickerdata.DividendPayDate);
				newticker.set('PriceBook', tickerdata.PriceBook);
				newticker.set('PriceSales', tickerdata.PriceSales);
				newticker.set('EBITDA', toFullNum(tickerdata.EBITDA));
				newticker.set('MarketCapitalization', toFullNum(tickerdata.MarketCapitalization));
				newticker.set('YearHigh', tickerdata.YearHigh);
				newticker.set('YearLow', tickerdata.YearLow);
				newticker.set('EPSEstimateCurrentYear', tickerdata.EPSEstimateCurrentYear);
				newticker.set('EPSEstimateNextYear', tickerdata.EPSEstimateNextYear);
				newticker.set('EPSEstimateNextQuarter', tickerdata.EPSEstimateNextQuarter);
				newticker.set('EarningsShare', tickerdata.EarningsShare);
				newticker.set('BookValue', Number(tickerdata.BookValue));
				newticker.set('AverageDailyVolume', Number(tickerdata.AverageDailyVolume));
				newticker.set('DividendShare', Number(tickerdata.DividendShare));
				newticker.set('DaysLow', Number(tickerdata.DaysLow));
				newticker.set('DaysHigh', Number(tickerdata.DaysHigh));
				newticker.set('StockExchange', tickerdata.StockExchange);

				newticker.save({
					success: function(res) {

					},
					error: function(res,error) {

						console.log(error);

					}
				});

			}

			if (n >= tickers.length-6) {

				console.log(tickers.length);
				response.success('REFRESHED TICKERS');

			} else {

				runYQLTests(tickers, n+5, response, currtickers);

			};

		};

	} else {

		var d = moment().utc().toDate();

		if (n >= tickers.length-6) {

			//currtickers[n].parseticker.set('isActive', false);
			currtickers[n].parseticker.set('RefreshedDate', d);

			currtickers[n].save({
				success: function(res) {

					response.success('Refreshed tickers with failure');

				},
				error: function(res, error) {

					console.log(error);
					response.error('Refreshed tickers with critical error');

				}
			});

			console.log(tickers.length);
			response.success('REFRESHED TICKERS');

		} else {

			runYQLTests(tickers, n+5, response, currtickers);

		};

	};

}


function toFullNum(preNum) {

	if (preNum && preNum.indexOf('M') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum) * 1000000;

		return theNum

	} else if (preNum && preNum.indexOf('B') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum) * 1000000000;

		return theNum

	} else if (preNum && preNum.indexOf('K') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum) * 1000;

		return theNum

	} else if (preNum && preNum.indexOf('.') > 0) {

		var theNum = preNum.slice(0,preNum.length-1);

		theNum = Number(theNum);

		return theNum

	} else {
		
		return preNum
		
	};

};

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
	var myear = pyear - 1;
	var oyear = myear - 1;
	
	if (mmonth == 13) {
		mmonth = 1;
		myear = pyear;
		oyear = myear - 1
	};

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

	if (res1 && res1.data.query.results) {

		if (res2 && res2.data.query.results) {
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

				var suppjoins = [];
				var resjoins = [];
				var suppprices = [];
				var resprices = [];

				for (var k = 0; k < valleyray.length; k++) {

					var suppjoin = getsupptrendpoints(valleyray, valleyray[k]);

					if (suppjoin) {
						suppjoins.push(suppjoin);
						suppprices.push(suppjoin.price);
					};

					if (k == valleyray.length-1) {

						var suppresult = cleansuppjoins(suppjoins,0);

						for (var m = 0; m < peakray.length; m++) {

							var resjoin = getrestrendpoints(peakray, peakray[m]);

							if (resjoin) {
								resjoins.push(resjoin);
								resprices.push(resjoin.price);
							};

							if (m == peakray.length-1) {

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
											response.success('LEVELS SUCCESS');
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

					return minjoin;

				} else if (i == points.length-1) {

					return null;

				};

			} else {

				if (i == points.length-1 && joins.length > 1) {

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

		alljoins.splice(start, 1);
		cleansuppjoins(alljoins,start);
	
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

		alljoins.splice(start, 1);
		return cleanresjoins(alljoins,start);
	
	} else if (start >= alljoins.length-1) {

		return alljoins
	
	};

};

// INDEX ALGO
function runindexalgo(res1,res2,ticker,response) {

	if (res2.data.query.results) {
		var sh = res1.data.query.results.quote.concat(res2.data.query.results.quote);
	} else {
		var sh = res1.data.query.results.quote;
	};

	var adjclose = [];
	var volume = [];
	var dateray = [];

	// ANALYSIS LOOP
	for (var i = sh.length-1; i >= 0; i--) {

		adjclose.push(Number(sh[i].Adj_Close).toFixed(2));
		volume.push(Number(sh[i].Volume));
		dateray.push(sh[i].Date);

		if (i == sh.length-1) {
			var high = adjclose[adjclose.length-1];
			var low = adjclose[adjclose.length-1];
			var rangehigh = adjclose[adjclose.length-1];
			var rangelow = adjclose[adjclose.length-1];
			var supp = [];
			var resist = [];
			var tp = 0;
			var tv = 0;
			var tsupp = null;
			var tresist = null;
			var twentySum = [adjclose[adjclose.length-1]/20];
			var fiftySum = [adjclose[adjclose.length-1]/50];
			var hundySum = [adjclose[adjclose.length-1]/100];
			var onefiftySum = [adjclose[adjclose.length-1]/150];
			var twoSum = [Number(adjclose[adjclose.length-1])/200];
			var volSum = volume[volume.length-1] / 50;
			var istwentySum = false;
			var isfiftySum = false;
			var istwoSum = false;
			var ishundySum = false;
			var isonefiftySum = false;
			var isvolSum = false;
			var hasresist = false;
			var hassupport = false;
		} else if (i < sh.length-1) {

			if (i < sh.length-200) {
				twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
				fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
				hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
				onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150) - (adjclose[adjclose.length-151]/150));
				twoSum.push(Number(twoSum[twoSum.length-1]) + (Number(adjclose[adjclose.length-1])/200) - Number((adjclose[adjclose.length-201])/200));
				istwoSum = true;
			} else if (i < sh.length-150) {
				twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
				fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
				hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
				onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150) - (adjclose[adjclose.length-151]/150));
				twoSum.push(Number(twoSum[twoSum.length-1]) + Number((adjclose[adjclose.length-1])/200));
				isonefiftySum = true;
			} else if (i < sh.length-100) {
				twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
				fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
				hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100) - (adjclose[adjclose.length-101]/100));
				onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
				twoSum.push(Number(twoSum[twoSum.length-1]) + Number((adjclose[adjclose.length-1])/200));
				ishundySum = true;
			} else if (i < sh.length-50) {
				twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
				fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50) - (adjclose[adjclose.length-51]/50));
				hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
				onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
				twoSum.push(Number(twoSum[twoSum.length-1]) + Number((adjclose[adjclose.length-1])/200));
				isvolSum = true;
				isfiftySum = true;
			} else if (i < sh.length-20) {
				twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20) - (adjclose[adjclose.length-21]/20));
				fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50));
				hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
				onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
				twoSum.push(Number(twoSum[twoSum.length-1]) + Number((adjclose[adjclose.length-1])/200));
				istwentySum = true;
			} else {
				twentySum.push(twentySum[twentySum.length-1] + (adjclose[adjclose.length-1]/20));
				fiftySum.push(fiftySum[fiftySum.length-1] + (adjclose[adjclose.length-1]/50));
				hundySum.push(hundySum[hundySum.length-1] + (adjclose[adjclose.length-1]/100));
				onefiftySum.push(onefiftySum[onefiftySum.length-1] + (adjclose[adjclose.length-1]/150));
				twoSum.push(Number(twoSum[twoSum.length-1]) + Number((adjclose[adjclose.length-1])/200));
			};

			if (i < 50) {
				volSum += volume[volume.length-1] / 50;
			};

			if (adjclose[adjclose.length-1] > high) {
				high = adjclose[adjclose.length-1];
			} else if (adjclose[adjclose.length-1] < low){
				low = adjclose[adjclose.length-1];
			} else if (adjclose[adjclose.length-1] < rangelow){
				rangelow = adjclose[adjclose.length-1];
			} else if (adjclose[adjclose.length-1] > rangehigh){
				rangehigh = adjclose[adjclose.length-1];
			};

			
			if (i == 0) { // STOCK NOTIFICATIONS

				twentySum[twentySum.length-1] = +(twentySum[twentySum.length-1].toFixed(2));
				fiftySum[fiftySum.length-1] = +(fiftySum[fiftySum.length-1].toFixed(2));
				hundySum[hundySum.length-1] = +(hundySum[hundySum.length-1].toFixed(2));
				onefiftySum[onefiftySum.length-1] = +(onefiftySum[onefiftySum.length-1].toFixed(2));
				twoSum[twoSum.length-1] = +(twoSum[twoSum.length-1].toFixed(2));

				var maalerts = [];

				// PRICE OVER 50
				if (isfiftySum && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] < 1.02 && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
					// P/50 BEAR APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] < 1.02 && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
					// P/50 BULL APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && fiftySum[fiftySum.length-1]/adjclose[sh.length-1] < 1 && fiftySum[fiftySum.length-2]/adjclose[sh.length-2] >= 1) {
					// P/50 BULL CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && adjclose[sh.length-1]/fiftySum[fiftySum.length-1] < 1 && adjclose[sh.length-2]/fiftySum[fiftySum.length-2] >= 1) {
					// P/50 BEAR CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				};

				// PRICE OVER 100
				if (ishundySum && adjclose[sh.length-1]/hundySum[hundySum.length-1] < 1.02 && adjclose[sh.length-1]/hundySum[hundySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
					// P/100 BEAR APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (ishundySum && hundySum[hundySum.length-1]/adjclose[sh.length-1] < 1.02 && hundySum[hundySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
					// P/100 BULL APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (ishundySum && hundySum[hundySum.length-1]/adjclose[sh.length-1] < 1 && hundySum[hundySum.length-2]/adjclose[sh.length-2] >= 1) {
					// P/100 BULL CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (ishundySum && adjclose[sh.length-1]/hundySum[hundySum.length-1] < 1 && adjclose[sh.length-2]/hundySum[hundySum.length-2] >= 1) {
					// P/100 BEAR CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 100 Day Moving Average ($ ' + hundySum[hundySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				};

				// PRICE OVER 150
				if (isonefiftySum && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] < 1.02 && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
					// P/150 BEAR APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isonefiftySum && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] < 1.02 && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
					// P/150 BULL APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isonefiftySum && onefiftySum[onefiftySum.length-1]/adjclose[sh.length-1] < 1 && onefiftySum[onefiftySum.length-2]/adjclose[sh.length-2] >= 1) {
					// P/150 BULL CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isonefiftySum && adjclose[sh.length-1]/onefiftySum[onefiftySum.length-1] < 1 && adjclose[sh.length-2]/onefiftySum[onefiftySum.length-2] >= 1) {
					// P/150 BEAR CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 150 Day Moving Average ($ ' + onefiftySum[onefiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				};

				// PRICE OVER 200
				if (istwoSum && adjclose[sh.length-1]/twoSum[twoSum.length-1] < 1.02 && adjclose[sh.length-1]/twoSum[twoSum.length-1] > 1 && adjclose[sh.length-6] > adjclose[sh.length-1]) {
					// P/200 BEAR APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (istwoSum && twoSum[twoSum.length-1]/adjclose[sh.length-1] < 1.02 && twoSum[twoSum.length-1]/adjclose[sh.length-1] > 1 && adjclose[sh.length-6] < adjclose[sh.length-1]) {
					// P/200 BULL APP ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (istwoSum && twoSum[twoSum.length-1]/adjclose[sh.length-1] < 1 && twoSum[twoSum.length-2]/adjclose[sh.length-2] >= 1) {
					// P/200 BULL CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (istwoSum && adjclose[sh.length-1]/twoSum[twoSum.length-1] < 1 && adjclose[sh.length-2]/twoSum[twoSum.length-2] >= 1) {
					// P/200 BEAR CROSS ALERT
					maalerts.push({
						mess: ticker.get('TickerAlt') + ' ($ ' + adjclose[sh.length-1] + ') has crossed the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				};


				// 50 OVER 200
				if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
					// 50/200 BEAR APP ALERT
					maalerts.push({
						mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: twoSum[twoSum.length-1],
						lowmap: fiftySum[fiftySum.length-1],
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-5]/fiftySum[fiftySum.length-5] > 1.01) {
					// 50/200 BULL APP ALERT
					maalerts.push({
						mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') is approaching the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: twoSum[twoSum.length-1],
						lowmap: fiftySum[fiftySum.length-1],
						highmat: '200',
						lowmat: '50',
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && istwoSum && twoSum[twoSum.length-1]/fiftySum[fiftySum.length-1] > 1 && twoSum[twoSum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
					// 50/200 BEAR CROSS ALERT
					maalerts.push({
						mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed below the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: twoSum[twoSum.length-1],
						lowmap: fiftySum[fiftySum.length-1],
						highmat: '200',
						lowmat: '50',
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && istwoSum && fiftySum[fiftySum.length-1]/twoSum[twoSum.length-1] > 1 && fiftySum[fiftySum.length-2]/twoSum[twoSum.length-2] <= 1) {
					// 50/200 BULL CROSS ALERT
					maalerts.push({
						mess: '50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ') crossed above the 200 Day Moving Average ($ ' + twoSum[twoSum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: twoSum[twoSum.length-1],
						lowmap: fiftySum[fiftySum.length-1],
						highmat: '200',
						lowmat: '50',
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				};

				// 20 OVER 50
				if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] < 1.01 && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twoSum[twoSum.length-5] > 1.01) {
					// 20/50 BEAR APP ALERT
					maalerts.push({
						mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: fiftySum[fiftySum.length-1],
						lowmap: twentySum[twentySum.length-1],
						highmat: '50',
						lowmat: '20',
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] < 1.01 && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-5]/twentySum[twentySum.length-5] > 1.01) {
					// 20/50 BULL APP ALERT
					maalerts.push({
						mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') is approaching the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: fiftySum[fiftySum.length-1],
						lowmap: twentySum[twentySum.length-1],
						highmat: '50',
						lowmat: '20',
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && istwentySum && fiftySum[fiftySum.length-1]/twentySum[twentySum.length-1] > 1 && fiftySum[fiftySum.length-2]/twentySum[twentySum.length-2] <= 1) {
					// 20/50 BEAR CROSS ALERT
					maalerts.push({
						mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed below the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: fiftySum[fiftySum.length-1],
						lowmap: twentySum[twentySum.length-1],
						highmat: '50',
						lowmat: '20',
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				} else if (isfiftySum && istwentySum && twentySum[twentySum.length-1]/fiftySum[fiftySum.length-1] > 1 && twentySum[twentySum.length-2]/fiftySum[fiftySum.length-2] <= 1) {
					// 20/50 BULL CROSS ALERT
					maalerts.push({
						mess: '20 Day Moving Average ($ ' + twentySum[twentySum.length-1] + ') crossed above the 50 Day Moving Average ($ ' + fiftySum[fiftySum.length-1] + ')',
						ticker: ticker.get('Ticker'),
						highmap: fiftySum[fiftySum.length-1],
						lowmap: twentySum[twentySum.length-1],
						highmat: '50',
						lowmat: '20',
						price: adjclose[sh.length-1],
						date: dateray[sh.length-1],
						volume: volume[sh.length-1]
					});
				};

				ticker.set('maAlerts', maalerts);
				ticker.set('Close', +(adjclose[sh.length-1]));
				ticker.set('Change', +(adjclose[sh.length-1] - adjclose[sh.length-2]).toFixed(2));
				ticker.set('pctChange', +((adjclose[sh.length-1] / adjclose[sh.length-2] - 1) * 100).toFixed(2));
				ticker.set('avgVolume', Math.round(volSum));
				ticker.set('Volume', +(volume[sh.length-1].toFixed(2)));
				ticker.set('twentyDay', +(twentySum[twentySum.length-1].toFixed(2)));
				ticker.set('fiftyDay', +(fiftySum[fiftySum.length-1].toFixed(2)));
				ticker.set('hundyDay', +(hundySum[hundySum.length-1].toFixed(2)));
				ticker.set('onefiftyDay', +(onefiftySum[onefiftySum.length-1].toFixed(2)));
				ticker.set('twoDay', +(twoSum[twoSum.length-1].toFixed(2)));
				ticker.set('LastPriceDate', moment(dateray[sh.length-1]).toDate());

				ticker.save({
					success: function(result) {
						response.success('INDEX SUCCESS');
					},
					error: function(error) {
						response.error(error);
					}
				});
			};
		};
	};
}

// INDEX ALERT GENERATION
function indexftndev(theres,response) {

	var ticker = theres;

	// URL CREATION
	var tickercode = ticker.get('Ticker');
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
	var myear = pyear - 1;
	var oyear = myear - 1;
	
	if (mmonth == 13) {
		mmonth = 1;
		myear = pyear;
		oyear = myear - 1
	};

	if (pday < 10) {pday = '0' + pday};
	if (pmonth < 10) {pmonth = '0' + pmonth};
	if (mday < 10) {mday = '0' + mday};
	if (mmonth < 10) {mmonth = '0' + mmonth};
	if (oday < 10) {oday = '0' + oday};

	var tickurl1 = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22'+tickercode+'%22%20and%20startDate%20%3D%20%22'+myear+'-'+mmonth+'-'+mday+'%22%20and%20endDate%20%3D%20%22'+pyear+'-'+pmonth+'-'+pday+'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
	var tickurl2 = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22'+tickercode+'%22%20and%20startDate%20%3D%20%22'+oyear+'-'+mmonth+'-'+oday+'%22%20and%20endDate%20%3D%20%22'+myear+'-'+mmonth+'-'+oday+'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
	console.log(tickurl1); //https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.historicaldata%20where%20symbol%20%3D%20%22^GSPC%22%20and%20startDate%20%3D%20%222014-01-15%22%20and%20endDate%20%3D%20%222015-12-04%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys
	console.log(tickurl2); //
	Parse.Cloud.httpRequest(
		{
			url: tickurl1,
			datatype: 'jsonp',
			jsonp: "callback",
    		jsonpCallback: "quote",
		})
		.then(function (res1) {
			console.log(res1.data.query);
			Parse.Cloud.httpRequest(
				{
					url: tickurl2,
					datatype: 'jsonp',
					jsonp: "callback",
		    		jsonpCallback: "quote",
				})
				.then(function (res2) {

					runindexalgo(res1,res2,ticker,response);
			    	
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

// INDEX COMMA GENERATION
function commaIndexSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
    	val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}


// EMAILS
function matchTickers(userRay,tickerAlerts,lessons,theindex,thewhy,why,response) {

	var useremailRay = [];
	var userEmails = [];
	var userTags = [];

	var welcomecont = 'Welcome to Stock Joe! Below you will find a daily update on the market and your portfolio. If you chose to enroll in the lessons, you will also see a lesson a day to teach you the basics of the stock market. Do not worry if you do not understand everything to start. The lessons and market updates will cover everything you need to know. Focus on understanding why stock prices move the way they do. Feel free to ask Joe (askjoe@stockjoe.com) literally any question you might have. Enjoy!'

	for (var i = 0; i < userRay.length; i++) {

	//if (userRay[i].id == '5jHIxtFtJ9') {

		var usertickers = userRay[i].get('TickerArray');
		var useracctlink = 'http://www.stockjoe.com/#!/account/' + userRay[i].id
		var userenrolldate = userRay[i].get('enrollDate');
		var userwantslessons = userRay[i].get('wantsLessons');

		if (userenrolldate && userwantslessons) {

			var mom = new Date;

			var userenrolldateday = userenrolldate.getDay();

			var momenroll = moment(userenrolldate);
			var momnow = moment.utc();
			var dateday = moment().day();
			var origdaycount = momnow.diff(momenroll, 'days', true) // 1
			var daymod = 0;

			origdaycount = Math.ceil(origdaycount);

			var daycount = origdaycount

			if (userenrolldateday == 6) {

				daycount = daycount + 1;

			} else if (userenrolldateday == 0) {
				
				daycount = daycount + 2;

			}

			if (daycount - dateday > 6) {
				daymod = 4;
			} else if (daycount - dateday > 1) {
				daymod = 2;
			} else {
				daymod = 0;
			};

			daycount = daycount - daymod;

		} else {

			var daycount = null;

		};

		var userstockupdate = {};
		var usertickerRay = [];
		var usermaalerts = [];
		var uservolalert = {};

		for (var j = 0; j < usertickers.length; j++) {

			if (usertickers[j] && usertickers[j].tickercode) {

				var tempticker = tickerAlerts.filter(function (el) {
					return  el.tickercode == usertickers[j].tickercode;
				});

				if (tempticker[0]) {

					if (tempticker[0].close) {

						usertickerRay.push(tempticker[0]);

					};

				} else {
				
					console.log('Failed tempticker: ' + usertickers[j].tickercode);

				};

				if (j == usertickers.length-1) {

					if (usertickerRay.length > 0) {

						if (daycount && daycount == 0) {
							daycount = 1;
						};

						if (daycount && daycount == 1) {
							var welcont = welcomecont;
						} else {
							welcont = null;
						};

						if (daycount && lessons[daycount-1]) {
							var ltitle = lessons[daycount-1].get('LessonTitle');
							var lmess = lessons[daycount-1].get('LessonContent');
							var lnum = lessons[daycount-1].get('LessonNumber');
						} else {
							var ltitle = null;
							var lmess = null;
							var lnum = null;
						};

						useremailRay.push(
							{
								rcpt: userRay[i].get('email'),
								vars: [{
									name: 'tickers',
									content: usertickerRay
								},
								{
									name: 'acctlink',
									content: useracctlink
								},
								{
									name: 'lessontitle',
									content: ltitle
								},
								{
									name: 'lessonnum',
									content: lnum
								},
								{
									name: 'lessonmess',
									content: lmess
								},
								{
									name: 'welcome',
									content: welcont
								},
								{
									name: 'index',
									content: theindex
								},
								{
									name: 'why',
									content: thewhy
								}]
							}
						);

						if (userRay[i].get('email')) {
							var thetag = 'enrolled';
						} else {
							var thetag = 'unenrolled';
						}

						userEmails.push(
							{
								email: userRay[i].get('email'),
							}
						);

						userTags.push(thetag);

					};

					if (i == userRay.length-1) {
						sendEmail(userEmails,useremailRay,userTags,why,response);
					};

				};

			} else {

				if (i == userRay.length-1) {
					sendEmail(userEmails,useremailRay,userTags,why,response);
				};

			};
			
		};

	};

}


function sendEmail(userEmails,theVars,userTags,why,response) {

	Mandrill.sendTemplate({
		template_name: "production-alerts",
	    template_content: [],
		message: {
			subject: 'Stock Joe - ' + moment().format('dddd, MMMM Do, YYYY'),
			from_email: "alerts@stockjoe.com",
			from_name: "Stock Joe",
			to: userEmails,
			track_opens: true,
        	track_clicks: true,
        	view_content_link: true,
        	merge_language: 'handlebars',
        	merge_vars: theVars,
        	tags: userTags
		},
		async: true
		},{
		success: function(httpResponse) {

			if (why) {
				why.set('isUsed',true);
				why.save({
					success: function(res) {
						response.success('Emails sent!');
					}
				});
			} else {
				response.success('Emails sent and why not saved');
			};

		},
		error: function(httpResponse) {
			console.error(httpResponse);
			response.error("Uh oh, something went wrong");
		}
	});

};


