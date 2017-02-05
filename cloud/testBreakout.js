var moment = require('moment');

Parse.Cloud.define("testBreakout", function(request, response) {

	var momit = moment.utc().startOf('day').toDate();

	var Tickers = Parse.Object.extend('Ticker');
	var query = new Parse.Query(Tickers);
	query.equalTo('isActive', true);
	query.equalTo('isCompany', true);
	//query.notEqualTo('isETF', true);
	//query.greaterThan('Refreshed',momit);
	//query.greaterThan('RefreshAlertDate',momit);
	//query.greaterThan('Tweeted',momit);
	query.descending('MarketCapitalization');
	query.limit(200);
	//console.log(query);
	var trytickers = [];
	query.each(function(tres) {
		console.log(tres);
		currtickers.push({parseticker: tres, tickerstr: tres.get('TickerCode')});
		trytickers.push(tres.get('TickerCode'));
		}).then(function() {

			// START QUERYING
			if (trytickers.length > 0) {

				console.log("RUN YQL");

				var n = 0;
				runYQLGet(trytickers, n, response, currtickers);

			}

		});

});

function runYQLGet(tickers, n, response, currtickers) {

	console.log("IN RUN YQL");

	var trialtickers = tickers;  //.slice(n,n+5);

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

					console.log("RUN PARSE");

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

function parseBreakout(res1,tickers,n,response,currtickers) {

	console.log("IN PARSE");

	var breakouts = [];
	var breakdowns = [];

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

						var supp = targticker.get('Support');
						var resi = targticker.get('Resist');
						var close = targticker.get('Close');
						var pctchange = tickerdata[m].ChangeinPercent;
						var lastprice = tickerdata[m].LastTradePriceOnly;
						var pchange = tickerdata[m].Change;

						var tmpsupp = 0
						var tmpres = 10000

						for (var i = supp.length - 1; i >= 0; i--) {

							if (Number(supp[i].price) > Number(tmpsupp) && Number(supp[i].price) < Number(close)) {
								tmpsupp = supp[i].price;
							}
							if (i == 0) {

								if (tmpsupp > 0) {
									mySupport = Number(tmpsupp).toFixed(2);
								} else {
									mySupport = null;
								}

								for (var j = resi.length - 1; j >= 0; j--) {

									if (Number(resi[j].price) < Number(tmpres) && Number(resi[j].price) > Number(close)) {
										tmpres = resi[j].price;
									}

									if (j == 0) {

										if (tmpres < 10000) {
											myRes = Number(tmpres).toFixed(2);
										} else {
											myRes = null;
										}

										if (myRes && lastprice > 1.005*myRes) {

											// BREAKOUT
											breakouts.push({
												ticker: targticker,
												resist: myRes,
												support: null,
												close: close,
												pctchange: pctchange,
												lastprice: lastprice,
												pricechange: pchange
											})

										} else if (mySupport && lastprice < 0.995*mySupport) {

											// BREAKDOWN
											breakdowns.push({
												ticker: targticker,
												resist: null,
												support: mySupport,
												close: close,
												pctchange: pctchange,
												lastprice: lastprice,
												pricechange: pchange
											})

										};

									}

								};

							}

						};

					}

				}

				if (m == tickerdata.length - 1) {

					console.log("RUN SENDTWEETS");

					sendTweets(breakouts, breakdowns, response);

				};

			}

		}

	}

}

function sendTweets(breakouts, breakdowns, response) {

	console.log("IN SENDTWEETS");

	var outr = Math.floor(Math.random() * (breakouts.length-1));
	var downr = Math.floor(Math.random() * (breakdowns.length-1));

	var outticker = breakouts[outr];
	var downticker = breakdowns[downr];

	if (outticker && downticker) {
		// BREAKOUT
		var bodystr = "<p>Resistance breakout: $" + outticker.ticker.tickercode + " breaking through $" + outticker.resist + " resistance" + "</p>"

		Mandrill.sendEmail({
			message: {
		        html: bodystr,
		        to: [
		            {
		                email: "john@stockjoe.com", //"trigger@recipe.ifttt.com",
		                name: "IFTT",
		                type: "to"
		            }
		        ],
				subject: '#alerttweet',
				from_email: "alets@stockjoe.com", //"john@stockjoe.com",
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

				mnow = moment.utc().toDate();
				outticker.ticker.set('Tweeted', mnow)
				outticker.ticker.save({
					success: function(result) {
						// BREAKDOWN
						var bodystr = "<p>Support breakdown: $" + downticker.ticker.tickercode + " breaking through $" + downticker.support + " support" + "</p>"

						Mandrill.sendEmail({
							message: {
						        html: bodystr,
						        to: [
						            {
						                email: "john@stockjoe.com", //"trigger@recipe.ifttt.com",
						                name: "IFTT",
						                type: "to"
						            }
						        ],
								subject: '#alerttweet',
								from_email: "alerts@stockjoe.com", //"john@stockjoe.com",
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
								mnow = moment.utc().toDate();
								downticker.ticker.set('Tweeted', mnow)
								downticker.ticker.save({
									success: function(result) {
										response.success("IFTTT Email sent!");
									},
									error: function(error) {
										response.error(error);
									}
								});
							},
							error: function(httpResponse) {
								console.error(httpResponse);
								response.error("Uh oh, something went wrong");
							}
						});
					},
					error: function(error) {
						// BREAKDOWN
						var bodystr = "<p>Support breakdown: $" + downticker.ticker.tickercode + " breaking through $" + downticker.support + " support" + "</p>"

						Mandrill.sendEmail({
							message: {
						        html: bodystr,
						        to: [
						            {
						                email: "john@stockjoe.com", //"trigger@recipe.ifttt.com",
						                name: "IFTT",
						                type: "to"
						            }
						        ],
								subject: '#alerttweet',
								from_email: "alerts@stockjoe.com", //"john@stockjoe.com",
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
								mnow = moment.utc().toDate();
								downticker.ticker.set('Tweeted', mnow)
								downticker.ticker.save({
									success: function(result) {
										response.success("IFTTT Email sent!");
									},
									error: function(error) {
										response.error(error);
									}
								});
							},
							error: function(httpResponse) {
								console.error(httpResponse);
								response.error("Uh oh, something went wrong");
							}
						});
					}
				});

			},
			error: function(httpResponse) {
				
				// BREAKDOWN
				var bodystr = "<p>Support breakdown: $" + downticker.ticker + " breaking through $" + downticker.support + " support" + "</p>"

				Mandrill.sendEmail({
					message: {
				        html: bodystr,
				        to: [
				            {
				                email: "john@stockjoe.com", //"trigger@recipe.ifttt.com",
				                name: "IFTT",
				                type: "to"
				            }
				        ],
						subject: '#alerttweet',
						from_email: "alerts@stockjoe.com", //"john@stockjoe.com",
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
						mnow = moment.utc().toDate();
						downticker.ticker.set('Tweeted', mnow)
						downticker.ticker.save({
							success: function(result) {
								response.success("IFTTT Email sent!");
							},
							error: function(error) {
								response.error(error);
							}
						});
					},
					error: function(httpResponse) {
						console.error(httpResponse);
						response.error("Uh oh, something went wrong");
					}
				});

			}
		});

	} else if (outticker) {

		var bodystr = "<p>Resistance breakout: $" + outticker.ticker.tickercode + " breaking through $" + outticker.resist + " resistance" + "</p>"

		Mandrill.sendEmail({
			message: {
		        html: bodystr,
		        to: [
		            {
		                email: "john@stockjoe.com", //"trigger@recipe.ifttt.com",
		                name: "IFTT",
		                type: "to"
		            }
		        ],
				subject: '#alerttweet',
				from_email: "alerts@stockjoe.com", //"john@stockjoe.com",
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

				mnow = moment.utc().toDate();
				outticker.ticker.set('Tweeted', mnow)
				outticker.ticker.save({
					success: function(result) {
						response.success("IFTTT Email sent!");
					},
					error: function(error) {
						response.error(error);
					}
				});
			},
			error: function(httpResponse) {
				console.error(httpResponse);
				response.error("Uh oh, something went wrong");
			}
		});

	} else if (downticker) {

		// BREAKDOWN
		var bodystr = "<p>Support breakdown: $" + downticker.ticker.tickercode + " breaking through $" + downticker.support + " support" + "</p>"

		Mandrill.sendEmail({
			message: {
		        html: bodystr,
		        to: [
		            {
		                email: "john@stockjoe.com", //"trigger@recipe.ifttt.com",
		                name: "IFTT",
		                type: "to"
		            }
		        ],
				subject: '#alerttweet',
				from_email: "alerts@stockjoe.com", //"john@stockjoe.com",
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
				mnow = moment.utc().toDate();
				downticker.ticker.set('Tweeted', mnow)
				downticker.ticker.save({
					success: function(result) {
						response.success("IFTTT Email sent!");
					},
					error: function(error) {
						response.error(error);
					}
				});
			},
			error: function(httpResponse) {
				console.error(httpResponse);
				response.error("Uh oh, something went wrong");
			}
		});

	}

}

						
