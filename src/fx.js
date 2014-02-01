/**
 * Currency and exchange rate
 *
 * @constructor
 * @param {String}  Ticker The ticker of the currency
 * @param {Number}  The exchange rate with respect to bitcoin
 */
Verso.Currency = function (ticker, rate) {
    this.getTicker = function () {
        return ticker;
    };

    this.getRate = function () {
        return rate;
    };
};

/** Fetches the exchange rates
 * 
 * @param {Function}  onCurrencies Function called with the list of currencies in case of success
 * @param {Function}  onError      Function called in case of error
 */
Verso.Currency.fetch = function (onCurrencies, onError) {
    $.ajax({
        type: "GET",
        url: "https://blockchain.info/ticker",
        data: { cors: true },
        success: function (data) {

            if (data.USD) {
                var XBTUSD = parseFloat(data.USD.last);

                jQuery.ajax({
                    type: "GET",
                    url: "http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
                    data: { cors: true },
                    cache: false,
                    dataType: "xml",
                    success: function (xml) {

                        try {
                            var pairs = [];
                            $(xml).find('Cube').each(function () {
                                $(this).find('Cube').each(function () {
                                    $(this).find('Cube').each(function () {
                                        var ticker = $(this).attr('currency');
                                        var rate = $(this).attr('rate');

                                        pairs.push({ ticker: ticker, rate: rate });
                                    });
                                });
                            });

                            var EURUSD = pairs.filter(function (p) { return p.ticker == "USD"; });

                            if (EURUSD.length == 1) {
                                EURUSD = EURUSD[0];

                                var XBTEUR = XBTUSD / EURUSD;

                                pairs = pairs.filter(function (p) { return p.ticker != "USD"; })
                                             .map(function (p) {
                                                 return new Verso.Currency(p.ticker, p.rate * XBTEUR);
                                             });
                                pairs.unshift(new Verso.Currency("USD", XBTUSD));
                            }
                            else {
                                pairs = [new Verso.Currency("USD", XBTUSD)];
                            }

                            if (onCurrencies)
                                onCurrencies(pairs);
                        }
                        catch (e) {
                            if (onError)
                                onError(new Verso.ConnectionError("Parsing error!"));
                        }
                    },
                    error: function (xhr, opt, err) {
                        if (onError)
                            onError(new Verso.ConnectionError("Error connecting the server!"));
                    }
                });
            }
        },
        error: function (xhr, opt, err) {
            if (onError)
                onError(new Verso.ConnectionError("Error connecting the server!"));
        }
    });
};

// http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml