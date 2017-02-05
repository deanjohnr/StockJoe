var devmod = angular.module('devMod',[]);

devmod.controller('devCtrl', ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {

	/*
	var thecontent = "Every investment has a certain level of risk. Some investments are inherently more risky than others. But risk and profit are always connected. Riskier investments have the potential to make more money, but they also have the potential to lose money. Investors are always on the hunt to find investments that have the opportunity to make a lot more money than they could lose. Hedge funds (professional joe shmoe investors who make money by investing other people’s money) are masters of calculating and managing risk levels of investments to ensure larger profits than losses. This may  mean making less money and to avoid a certain level of risk."

	var esccontent = unescape(encodeURIComponent(thecontent));

	$scope.savecontent = function() {
		var Lesson = Parse.Object.extend('Lessons');
		var lquery = new Parse.Query(Lesson);
		lquery.equalTo('LessonNumber', 10);
		lquery.first({
			success: function(result) {
				result.set('LessonContent',esccontent);
				result.save({
					success: function () {
						console.log('saved');
						var mquery = new Parse.Query(Lesson);
						mquery.equalTo('LessonNumber', 10);
						mquery.first({
							success: function(res) {
								$scope.thelesson = res.get('LessonContent');
								console.log($scope.thelesson);
								$scope.$apply();
							}
						});
					}
				});
				
			}
		})
	}
	
	// YAHOO QUOTE
	https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22YHOO%22%2C%22AAPL%22%2C%22GOOG%22%2C%22MSFT%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=results

	*/

	var whycontent = "Markets finished lower yesterday due to nerves and lower oil prices. Today, crucial jobs numbers will be released that could dictate the actions of the Fed in December. Investors believe the low rates have gone on long enough. Some are arguing that the rise and fall of Valeant (VRX) stems from the low rates. Valeant has been an acquisition machine, buying up proven drug companies and raising prices to simulate growth. This strategy requires a lot of cash; cash that comes from massive piles of debt. Under normal circumstances, Valeant would not have been able to afford this strategy because the debt would have crippled them early on, but with low interest rates, they kept charging with the strategy. Wall Street has taken notice and the stock got crushed today. The term house of cards is spreading, and Philidor shook the table."
	var whytitle = "Not In The Cards"
	var whytickers = "$VRX"
	var escwhycontent = unescape(encodeURIComponent(whycontent));
	var escwhytitle = unescape(encodeURIComponent(whytitle));

	$scope.addwhy = function() {

		var d = moment().add(12, 'h').toDate();

		var Why = Parse.Object.extend('Whys');
		thewhy = new Why();
		thewhy.set('WhyTitle',escwhytitle);
		thewhy.set('WhyContent',escwhycontent);
		thewhy.set('unWhyTitle',whytitle);
		thewhy.set('unWhyContent',whycontent);
		thewhy.set('WhyTickers',whytickers);
		thewhy.set('WhyDate',d);
		thewhy.set('isUsed',false);
		thewhy.save({
			success: function(res) {
				console.log(res);
				$scope.thewhytitle = res.get('WhyTitle');
				$scope.thewhycontent = res.get('WhyContent');
			}
		})
	}

	$scope.updatewhy = function() {

		var d = moment().add(12, 'h').toDate();

		var Why = Parse.Object.extend('Whys');
		qwhy = new Parse.Query(Why);
		qwhy.descending('updatedAt');
		qwhy.first({
			success: function(why) {

				if (why) {
					why.set('WhyTitle',escwhytitle);
					why.set('WhyContent',escwhycontent);
					why.set('unWhyTitle',whytitle);
					why.set('unWhyContent',whycontent);
					why.set('WhyDate',d);
					why.set('isUsed',false);
					why.save({
						success: function(res) {
							console.log(res);
							$scope.thewhytitle = res.get('WhyTitle');
							$scope.thewhycontent = res.get('WhyContent');
						}
					});
				};

			},
			error: function(error) {
				console.log(error);
			}
		});
		
	}


	
	
	/*

	var origdaycount = 3
	var userenrolldateday = 4
	var daycount = origdaycount
	
	if (userenrolldateday != 6 && userenrolldateday != 5 && origdaycount < 7 && origdaycount > 6 - userenrolldateday) { daycount = origdaycount - 2 };
	//daycount = origdaycount;

	console.log(daycount);

	if (userenrolldateday == 6) {

		daycount = daycount - 1 - (2 * Math.floor(origdaycount/7));
		console.log(daycount);
	} else if (userenrolldateday == 5) {
		
		daycount = daycount - 2 - (2 * Math.floor(origdaycount/7));
		console.log(daycount);
	} else if (userenrolldateday < 5) {
		
		daycount = daycount - (2 * Math.floor(origdaycount/7));
		console.log(daycount);
	};

	console.log(daycount);*/

	$scope.testBreakout = function() {

		console.log('run breakout');

		Parse.Cloud.run("testBreakout",
			{},
			{
				success: function(message) {
					console.log('ran cloud function');
				},
				error: function(res,error) {
					console.log(res);
					console.log(error);
				}
			}
		);

	};

	$scope.testemail = function() {

		console.log('run testemail');

		Parse.Cloud.run("testemail",
			{},
			{
				success: function(message) {
					console.log('ran cloud function');
				},
				error: function(res,error) {
					console.log(res);
					console.log(error);
				}
			}
		);

	};

	$scope.getTickerData = function() {

		Parse.Cloud.run('getTickerData',
			{},
			{
				success: function(message) {
					console.log('ran cloud function');
				},
				error: function(res,error) {
					console.log(res);
					console.log(error);
				}
			}
		);

	}

	$scope.adhoctickeractivate = function() {

		Parse.Cloud.run('ADactivateTickers',
			{},
			{
				success: function(message) {
					console.log('ran cloud function');
				},
				error: function(res,error) {
					console.log(res);
					console.log(error);
				}
			}
		);

	}

	$scope.testalert = function() {

		// URL CREATION
		var tickercode = ticker.get('Ticker');
		var month = '1';
		var day = '1';
		var year = '2013';

		var mom = new Date();

		var pmonth = mom.getMonth();
		var pday = mom.getDate();
		var pyear = mom.getFullYear();

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

		$.ajax({
			url: tickurl1,
			dataType: "jsonp",
	        jsonp: "callback",
	        jsonpCallback: "quote"
	    });

	    quote = function(data) {

	    	var sh = data.query.results.quote
	    	//console.log(sh);

	    	var adjclose = [];

			// ANALYSIS LOOP
			//console.log(sh.length);
			for (var i = sh.length-1; i >= 0; i--) {

				adjclose.push(Number(sh[0].Adj_Close).toFixed(2));

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
					var twentySum = adjclose[adjclose.length-1]/20;
					var fiftySum = adjclose[adjclose.length-1]/50;
					var hundySum = adjclose[adjclose.length-1]/100;
					var onefiftySum = adjclose[adjclose.length-1]/150;
					var twoSum = adjclose[adjclose.length-1]/200;
					var istwentysum = false;
					var isfiftysum = false;
					var istwoSum = false;
					var ishundysum = false;
					var isonefiftySum = false;
					var hasresist = false;
					var hassupport = false;
				} else if (i < sh.length-3) {

					if (i < sh.length-201) {
						twentySum += (adjclose[adjclose.length-1]/20) - (sh[i+21][11]/20);
						fiftySum += (adjclose[adjclose.length-1]/50) - (sh[i+51][11]/50);
						hundySum += (adjclose[adjclose.length-1]/100) - (sh[i+101][11]/100);
						onefiftySum += (adjclose[adjclose.length-1]/150) - (sh[i+151][11]/150);
						twoSum += (adjclose[adjclose.length-1]/200) - (sh[i+201][11]/200);
						istwoSum = true;
					} else if (i < sh.length-151) {
						twentySum += (adjclose[adjclose.length-1]/20) - (sh[i+21][11]/20);
						fiftySum += (adjclose[adjclose.length-1]/50) - (sh[i+51][11]/50);
						hundySum += (adjclose[adjclose.length-1]/100) - (sh[i+101][11]/100);
						onefiftySum += (adjclose[adjclose.length-1]/150) - (sh[i+151][11]/150);
						twoSum += adjclose[adjclose.length-1]/200;
						isonefiftySum = true;
					} else if (i < sh.length-101) {
						twentySum += (adjclose[adjclose.length-1]/20) - (sh[i+21][11]/20);
						fiftySum += (adjclose[adjclose.length-1]/50) - (sh[i+51][11]/50);
						hundySum += (adjclose[adjclose.length-1]/100) - (sh[i+101][11]/100);
						onefiftySum += (adjclose[adjclose.length-1]/150);
						twoSum += (adjclose[adjclose.length-1]/200);
						ishundySum = true;
					} else if (i < sh.length-51) {
						twentySum += adjclose[adjclose.length-1]/20 - sh[i+21][11]/20;
						fiftySum += adjclose[adjclose.length-1]/50 - sh[i+51][11]/50;
						hundySum += (adjclose[adjclose.length-1]/100);
						onefiftySum += (adjclose[adjclose.length-1]/150);
						twoSum += adjclose[adjclose.length-1]/200;
						isfiftysum = true;
					} else if (i < sh.length-21) {
						twentySum += adjclose[adjclose.length-1]/20 - sh[i+21][11]/20;
						fiftySum += adjclose[adjclose.length-1]/50;
						hundySum += (adjclose[adjclose.length-1]/100);
						onefiftySum += (adjclose[adjclose.length-1]/150);
						twoSum += adjclose[adjclose.length-1]/200;
						istwentysum = true;
					} else {
						twentySum += adjclose[adjclose.length-1]/20;
						fiftySum += adjclose[adjclose.length-1]/50;
						hundySum += (adjclose[adjclose.length-1]/100);
						onefiftySum += (adjclose[adjclose.length-1]/150);
						twoSum += adjclose[adjclose.length-1]/200;
					};

					if (adjclose[adjclose.length-1] > high) {
						high = adjclose[adjclose.length-1];
						//resist.unshift({'price':adjclose[adjclose.length-1],'loc':i});
					} else if (adjclose[adjclose.length-1] < low){
						low = adjclose[adjclose.length-1];
					} else if (adjclose[adjclose.length-1] < rangelow){
						rangelow = adjclose[adjclose.length-1];
					} else if (adjclose[adjclose.length-1] > rangehigh){
						rangehigh = adjclose[adjclose.length-1];
					};

				} else if (i == 0) {

					for (var j = 0; j < adjclose.length; j++) {

						if (tsupp && adjclose[j+1] < tsupp.price && adjclose[j+1] > adjclose[adjclose.length-1]) {
							tsupp = null;
							console.log('tsupp to null');
						} else if (tresist && adjclose[j+1] > tresist.price && adjclose[j+1] < adjclose[adjclose.length-1]) {
							tresist = null;
							console.log('tresist to null');
						};

						// Valley
						if (i>0 && adjclose[j-1] > adjclose[j+1] && adjclose[j+1] < adjclose[j+3]) {
							tv = adjclose[j+1];
							//$scope.resultsRay.puadjclose({type:'Valley', price: tv, date: adjclose[j+1][0]});
							//if (tsupp) {console.log(tsupp.price / tv)};
							
							if (!tsupp && !supp[0]) { // First Down Valley Less Than Low SET TSUPPORT

								tsupp = {type:'tsupp',price:tv,loc:i+1,date:adjclose[j+1][0]};
								console.log('TSUPPORT:' + tsupp.date + '::' + tsupp.price);

								// Find Support with TSupp = TV
							} else if (tsupp && !hassupport && tsupp.price/tv > 1 && tsupp.price/tv < 1.005 && tsupp.loc-i <= 12) {

								tsupp = {type:'mess',price:tv,loc:i+1,date:adjclose[j+1][0]};
								console.log('tsupp:' + tsupp.date + '::' + tsupp.price);
								$scope.resultsRay.puadjclose(tsupp);

							} else if (tsupp && !hassupport && tsupp.price/tv >= 1.005 && tsupp.loc-i <= 12) {

								tsupp = {type:'tsupp',price:tv,loc:i+1,date:adjclose[j+1][0]};
								console.log('tsupp:' + tsupp.date + '::' + tsupp.price);
								$scope.resultsRay.puadjclose(tsupp);

							} else if (tsupp && !hassupport && tsupp.price/tv >= 1.01) {

								tsupp = {type:'tsupp',price:tv,loc:i+1,date:adjclose[j+1][0]};
								console.log('tsupp:' + tsupp.date + '::' + tsupp.price);
								$scope.resultsRay.puadjclose(tsupp);

							} else if (tsupp && !hassupport && tsupp.price / tv < 1.01 && tsupp.price / tv > .99 && tsupp.loc-i > 12) {
								console.log('IN SET SUPPORT');
								if (tsupp.price > tv) {
									supp[0] = {'type':'support','price':tv,'loc':i+1,'date':adjclose[j+1][0]};
									hassupport = true;
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(tsupp);
									console.log(supp[0]);
									// DESTROY TSUPP
									tsupp = null;
								} else {
									supp[0] = {'type':'support','price':tsupp.price,'loc':i+1,'date':adjclose[j+1][0]};
									hassupport = true;
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(tsupp);
									console.log(supp[0]);
									// DESTROY TSUPP
									tsupp = null;
								};
								// Modify tsupp
							} else if (tsupp && !hassupport && tsupp.price / tv >= 1.01) {
								tsupp = {'price':tv,'loc':i+1,'date':adjclose[j+1][0]};
								// Find New Support below old Support
							} else if (tsupp && hassupport && supp[0].price > tsupp.price && tsupp.price / tv < 1.01 && tsupp.price / tv > .99 && tsupp.loc-i > 12) {
								console.log('IN SET SUPPORT');
								if (tsupp.price > tv) {
									supp.unadjcloseift({'type':'support','price':tv,'loc':i+1,'date':adjclose[j+1][0]});
									hassupport = true;
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(tsupp);
									console.log(supp[0]);
									// DESTROY TSUPP
									tsupp = null;
								} else {
									supp.unadjcloseift({'type':'support','price':tsupp.price,'loc':i+1,'date':adjclose[j+1][0]});
									hassupport = true;
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(tsupp);
									console.log(supp[0]);
									// DESTROY TSUPP
									tsupp = null;
								};
								// No TSupp, Current Support breaks, revert to old support or set new TSupp
							} else if (!tsupp && hassupport && supp[0].price > tv && supp[0].price / tv > 1.01) {
								// Set Existing Support Loop
								console.log('revert to old support, set new tsupp');
								for (var j = 0; j < supp.length; j++) {
									console.log(j == supp.length-1 && supp[0].price <= supp[j].price);
									if (j == supp.length-1 && supp[0].price <= supp[j].price) {
										tsupp = {'price':tv,'loc':i+1,'date':adjclose[j+1][0]};
										//console.log(tsupp.date + '::' + tsupp.price);
									} else if (supp[j].price < supp[0].price) { // Check Existing Support
										supp.unadjcloseift({'type':'support','price':supp[j].price,'loc':i+1,'date':adjclose[j+1][0]});
										hassupport = true;
										$scope.resultsRay.puadjclose(supp[0]);
										console.log(supp[0]);
										j = supp.length;
										// DESTROY TSUPP
										tsupp = null;
									};
								};
								// No TSupp, modify current support
							} else if (!tsupp && hassupport && supp[0].price > tv && supp[0].price / tv <= 1.01) {
								// 
								if (i-3 >= 0 && tv <= (adjclose[j-3])) {
									console.log('IN MODIFY SUPPORT');
									supp.unadjcloseift({'type':'support','price':tv,'loc':i+1,'date':adjclose[j+1][0]});
									hassupport = true;
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(supp[0]);
								} else if (i < 3 && tv <= (adjclose[0])) {
									console.log('IN MODIFY SUPPORT');
									supp.unadjcloseift({'type':'support','price':tv,'loc':i+1,'date':adjclose[j+1][0]});
									hassupport = true;
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(supp[0]);
								};
							} else if (tsupp && !hassupport && tsupp.price/tv < 0.85) {

								tsupp = {type:'tsupp',price:tv,loc:i+1,date:adjclose[j+1][0]};
								console.log('tsupp:' + tsupp.date + '::' + tsupp.price);
								$scope.resultsRay.puadjclose(tsupp);

							};
						// Peak
						}  else if (i>0 && adjclose[j-1] < adjclose[j+1] && adjclose[j+1] > adjclose[j+3]) {
							tp = adjclose[j+1];
							//$scope.resultsRay.puadjclose({type:'Peak', price: tp, date: adjclose[j+1][0]});
							if (tresist) {};
							
							// no temp, no resist, set temp
							if (!tresist && !hasresist) {

								tresist = {'price':tp,'loc':i+1,'date':adjclose[j+1][0]};
								console.log('tRESIST:' + tresist.date + '::' + tresist.price);

								// bump in adjcloseort term price, set new temp
							} else if (tresist && !hasresist && tp/tresist.price > 1 && tp/tresist.price < 1.005 && tresist.loc-i <= 12) {

								tresist = {'price':tp,'loc':tresist.loc,'date':adjclose[j+1][0]};
								console.log('tRESIST:' + tresist.date + '::' + tresist.price);

								// bump in adjcloseort term price, set new temp
							} else if (tresist && !hasresist && tp/tresist.price >= 1.005 && tresist.loc-i <= 12) {

								tresist = {'price':tp,'loc':i+1,'date':adjclose[j+1][0]};
								console.log('tRESIST:' + tresist.date + '::' + tresist.price);

								// big bump in long term price, set new temp
							} else if (tresist && !hasresist && tp/tresist.price >= 1.01) {

								tresist = {'price':tp,'loc':i+1,'date':adjclose[j+1][0]};
								console.log('tRESIST:' + tresist.date + '::' + tresist.price);

								// no resist, resist trigger
							} else if (tresist && !hasresist && tresist.price / tp < 1.01 && tresist.price / tp > .99 && tresist.loc-i > 12) {
								console.log('IN SET RESIST');
								if (tresist.price < tp) {
									resist[0] = {'type':'resist','price':tp,'loc':i+1,'date':adjclose[j+1][0]};
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(tresist);
									console.log(resist[0]);
									// DESTROY Tresist
									tresist = null;
								} else {
									resist[0] = {'type':'resist','price':tresist.price,'loc':i+1,'date':adjclose[j+1][0]};
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(tresist);
									console.log(resist[0]);
									// DESTROY Tresist
									tresist = null;
								};

								// has resist, bump resist
							} else if (tresist && hasresist && resist[0].price < tresist.price && tresist.price / tp < 1.01 && tresist.price / tp > .99 && tresist.loc-i > 12) {
								console.log('IN SET RESIST');
								if (tresist.price < tp) {
									resist.unadjcloseift({'type':'resist','price':tp,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(tresist);
									console.log(resist[0]);
									// DESTROY Tresist
									tresist = null;
								} else {
									resist.unadjcloseift({'type':'resist','price':tresist.price,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(tresist);
									console.log(resist[0]);
									// DESTROY Tresist
									tresist = null;
								};
								// Modify Resist
							} else if (!tresist && hasresist && resist[0].price > tp && tp / resist[0].price <= 1.01) {
								if (i-3 >= 0 && tp >= (adjclose[j-3])) {
									console.log('IN SET RESIST');
									console.log(tresist);
									resist.unadjcloseift({'type':'resist','price':tv,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(resist[0]);
								} else if (i < 3 && tp >= (adjclose[0])) {
									console.log('IN SET RESIST');
									resist.unadjcloseift({'type':'resist','price':tv,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(resist[0]);
								};
							};

						// PRICE CAUSING BREAKOUTS
						// Break support, set tresist at support lvl
						} else if (hassupport && adjclose[adjclose.length-1]/supp[0].price < 0.975) {
							console.log('set resist at broken support');
							resist.unadjcloseift({'price':supp[0].price,'loc':i,'date':adjclose[j][0]});
							console.log('revert to old support, set new tsupp');
							for (var j = 0; j < supp.length; j++) {
								console.log(j == supp.length-1 && supp[0].price <= supp[j].price);
								if (j == supp.length-1 && supp[0].price <= supp[j].price) {
									hassupport = false;
									// tsupp = {'price':tv,'loc':i+1,'date':adjclose[j+1][0]};
									//console.log(tsupp.date + '::' + tsupp.price);
								} else if (supp[j].price < supp[0].price) { // Check Existing Support
									supp.unadjcloseift({'type':'support','price':supp[j].price,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(supp[0]);
									j = supp.length;
									// DESTROY TSUPP
									tsupp = null;
								};
							};
						} else if (hassupport && adjclose[adjclose.length-1]/supp[0].price < 0.99) {
							console.log('set tresist at broken support');
							tresist = {'price':supp[0].price,'loc':i,'date':adjclose[j][0]};
							hasresist = false;
							console.log('revert to old support, set new tsupp');
							for (var j = 0; j < supp.length; j++) {
								console.log(j == supp.length-1 && supp[0].price <= supp[j].price);
								if (j == supp.length-1 && supp[0].price <= supp[j].price) {
									hassupport = false;
									// tsupp = {'price':tv,'loc':i+1,'date':adjclose[j+1][0]};
									//console.log(tsupp.date + '::' + tsupp.price);
								} else if (supp[j].price < supp[0].price) { // Check Existing Support
									supp.unadjcloseift({'type':'support','price':supp[j].price,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(supp[0]);
									console.log(supp[0]);
									j = supp.length;
									// DESTROY TSUPP
									tsupp = null;
								};
							};
						} else if (hasresist && adjclose[adjclose.length-1]/resist[0].price > 1.025) {
							console.log('set support at broken resist');
							support.unadjcloseift({'type':'support','price':resist[0].price,'loc':i,'date':adjclose[j][0]});
							console.log('revert to old resist, set new tresist');
							for (var j = 0; j < resist.length; j++) {
								console.log(j == resist.length-1 && resist[0].price <= resist[j].price);
								if (j == resist.length-1 && resist[0].price <= resist[j].price) {
									hasresist = false;
									// tsupp = {'price':tv,'loc':i+1,'date':adjclose[j+1][0]};
									//console.log(tsupp.date + '::' + tsupp.price);
								} else if (resist[j].price < resist[0].price) { // Check Existing Support
									resist.unadjcloseift({'type':'resist','price':resist[j].price,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(resist[0]);
									j = supp.length;
									// DESTROY TSUPP
									tsupp = null;
								};
							};
						} else if (hasresist && adjclose[adjclose.length-1]/resist[0].price > 1.01) {
							console.log('set tsupport at broken resist');
							tsupp = {'price':resist[0].price,'loc':i,'date':adjclose[j][0]};
							hassupport = false;
							console.log('revert to old resist');
							for (var j = 0; j < resist.length; j++) {
								console.log(j == resist.length-1 && resist[0].price <= resist[j].price);
								if (j == resist.length-1 && resist[0].price <= resist[j].price) {
									hasresist = false;
									// tsupp = {'price':tv,'loc':i+1,'date':adjclose[j+1][0]};
									//console.log(tsupp.date + '::' + tsupp.price);
								} else if (resist[j].price < resist[0].price) { // Check Existing Support
									resist.unadjcloseift({'type':'resist','price':resist[j].price,'loc':i+1,'date':adjclose[j+1][0]});
									$scope.resultsRay.puadjclose(resist[0]);
									console.log(resist[0]);
									j = supp.length;
									// DESTROY TSUPP
									tsupp = null;
								};
							};
						}
						
						if (i == 0) { // NOTIFICATIONS
						// Support/Resitance Junctions
							if (supp && adjclose[0] < supp[0]) {
								// BELOW SUPPORT ALERT
							} else if (supp && adjclose[0] < (supp[0] * 1.05) ) {
								// NEAR SUPPORT ALERT
							} else if (supp && adjclose[0] > resist[0]) {
								// ABOVE RESISTANCE ALERT
							} else if (supp && adjclose[0] > (resist[0] * .97) ) {
								// NEAR RESISTANCE ALERT
							};

							// Tech Indicator Notifactions
							//console.log(twentySum);
							//console.log(fiftySum);
							//console.log(hundySum);
							// console.log(onefiftySum);
							//console.log(twoSum);
							console.log(resist);
							console.log(supp);

							//console.log($scope.resultsRay);
							$scope.$apply();

						};

					};
				
				};

			};

		};

	};

	$scope.testsupportalert = function() {

		$scope.joins = [];
		console.log('in ftn');

		// URL CREATION
		var tickercode = 'GOOG';
		var month = '1';
		var day = '1';
		var year = '2013';

		var mom = new Date();

		var pmonth = mom.getMonth();
		var pday = mom.getDate();
		var pyear = mom.getFullYear();

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

		$.ajax({
			url: tickurl1,
			dataType: "jsonp",
	        jsonp: "callback",
	        jsonpCallback: "quote"
	    });

	    quote = function(data) {

	    	var sh = data.query.results.quote

	    	var adjclose = [];

			// ANALYSIS LOOP
			for (var i = sh.length-1; i >= 0; i--) {

				adjclose.push(Number(sh[i].Adj_Close).toFixed(2));

				if (i == 0) {

					var valleyray = [];
					var peakray = [];

					for (var j = 0; j < adjclose.length; j++) {

						if (j > 0 && j < adjclose.length-1 && adjclose[j] < adjclose[j+1] && adjclose[j] < adjclose[j-1]) {
							valleyray.push({
								price: adjclose[j],
								ndx: j
							})
						} else if (j > 0 && j < adjclose.length-1 && adjclose[j] > adjclose[j+1] && adjclose[j] > adjclose[j-1]) {
							peakray.push({
								price: adjclose[j],
								ndx: j
							})
						};
						
						if (j == adjclose.length-1) {
							
							var suppjoins = [];
							var resjoins = [];

							for (var k = 0; k < valleyray.length; k++) {

								var suppjoin = getsupptrendpoints(valleyray, valleyray[k]);

								if (suppjoin) {
									//console.log(suppjoin);
									suppjoins.push(suppjoin);
									//console.log(suppjoins);
								};

								if (k == valleyray.length-1) {

									//console.log(suppjoins);
									var suppresult = cleansuppjoins(suppjoins,0);
									console.log(suppresult);

									for (var m = 0; m < peakray.length; m++) {

										var resjoin = getrestrendpoints(peakray, peakray[m]);

										if (resjoin) {
											//console.log(resjoin);
											resjoins.push(resjoin);
											//console.log(resjoins);
										};

										if (m == peakray.length-1) {

											//console.log(resjoins);
											var resresult = cleanresjoins(resjoins,0);
											console.log(resresult);

											

										};
										
									};

								};
								
							};

						};

					};
				
				};

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
			console.log('SUPPORT:');
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
			console.log('RESIST:');
			//console.log(alljoins);
			return alljoins
		
		};

	};

}]);





