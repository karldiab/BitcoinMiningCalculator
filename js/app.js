
function data($scope, $http) {
  // when the page loads for the first time
  if($scope.search == undefined) {
    $scope.search = "hi";
    $scope.currency = "USD";
    fetch();
  }

  var pendingTask;

  // will load results when the string in search box changes
  $scope.change = function() {
    if(pendingTask) {
      clearTimeout(pendingTask);
    }
    pendingTask = setTimeout(fetch, 800);
  };

  $scope.update = function() {
    $scope.search = $scope.others.Search[index].Title;
  	$scope.change();
  };

  $scope.select = function() {
    this.setSelectionRange(0, this.value.length);
  }
  $scope.earnings = {};
  $scope.values = [];

  function fetch() {
    $http.get("https://bitcoin.toshi.io/api/v0/blocks/latest")
     .success(function(response) {
         $scope.bitcoinStats = response;
         $scope.difficulty = response.difficulty.toFixed(0);
         $scope.reward = response.reward/1E8;
     });
     //finding average price between 3 high volume exchanges.
    $http.get("https://api.bitcoinaverage.com/exchanges/USD")
     .success(function(response) {
         $scope.priceBitfinex = response.bitfinex.rates.last;
         $scope.priceBitStamp = response.bitstamp.rates.last;
         $scope.pricebtce = response.btce.rates.last;
         $scope.price = (($scope.priceBitfinex + $scope.priceBitStamp + $scope.pricebtce) /3).toFixed(2);
     });
  }
  $scope.fetchPriceOnly = function() {
     //finding average price between 3 high volume exchanges.
    $http.get("https://api.bitcoinaverage.com/exchanges/" + $scope.currency)
     .success(function(response) {
         if ($scope.currency == "USD") {
            $scope.priceBitfinex = response.bitfinex.rates.last;
            $scope.priceBitStamp = response.bitstamp.rates.last;
            $scope.pricebtce = response.btce.rates.last;
            $scope.price = (($scope.priceBitfinex + $scope.priceBitStamp + $scope.pricebtce) /3).toFixed(2);
            $scope.computeProfits();
         }
         if ($scope.currency == "CNY") {
            $scope.price = response.btc38.rates.last.toFixed(2);
            $scope.computeProfits();
         }
         if ($scope.currency == "CAD") {
            $scope.priceQuadrigacx = response.quadrigacx.rates.last;
            $scope.priceCavirtex = response.cavirtex.rates.last;
            $scope.priceCoinbase = response.coinbase.rates.last;
            $scope.price = (($scope.priceQuadrigacx + $scope.priceCavirtex + $scope.priceCoinbase) /3).toFixed(2);
            $scope.computeProfits();
         }
     });
  }
  /*Function that calculates the profits of the user in bitcoin.*/
  $scope.computeProfits = function() {  
        if ($scope.userHashSuffix == "GH") {
            $scope.userHashSuffixMult = 1e9;
        }
        if ($scope.userHashSuffix == "TH") {
            $scope.userHashSuffixMult = 1e12;
        }
        if ($scope.userHashSuffix == "PH") {
            $scope.userHashSuffixMult = 1e15;
        }
        if ($scope.powerSuffix == "W") {
            $scope.userPowerSuffixMult = 0.001;
        } else {
            $scope.userPowerSuffixMult = 1;
        }
        $scope.earnings.hourGrossBTC = ($scope.userHash/(65536*65536*$scope.difficulty))*$scope.reward*3600*$scope.userHashSuffixMult;
        $scope.values[0] = [$scope.earnings.hourGrossBTC];
        $scope.earnings.hourGrossUSD = $scope.earnings.hourGrossBTC*$scope.price;
        $scope.values[1] = [$scope.earnings.hourGrossUSD];
        $scope.earnings.powerCostHour = ($scope.wattage*$scope.userPowerSuffixMult*$scope.powerCost)
        $scope.values[2] = [$scope.earnings.powerCostHour];
        $scope.earnings.poolCostHour = ($scope.earnings.hourGrossUSD*($scope.poolFee/100));
        $scope.values[3] = [$scope.earnings.poolCostHour];
        $scope.earnings.profitHour = (($scope.earnings.hourGrossUSD - $scope.earnings.powerCostHour) - $scope.earnings.poolCostHour);
        $scope.values[4] = [$scope.earnings.profitHour];
        $scope.earnings.hourGrossBTCNext = $scope.earnings.hourGrossBTC*(1-($scope.nextDifficulty/100));
        $scope.values[5] = [$scope.earnings.hourGrossBTCNext];
        console.log($scope.values[5]);
        $scope.earnings.hourGrossUSDNext = $scope.earnings.hourGrossBTCNext*$scope.price;
        $scope.values[6] = [$scope.earnings.hourGrossUSDNext];
        $scope.earnings.poolCostHourNext = ($scope.earnings.hourGrossUSDNext*($scope.poolFee/100));
        $scope.values[7] = [$scope.earnings.poolCostHourNext];
        $scope.earnings.profitHourNext = (($scope.earnings.hourGrossUSDNext - $scope.earnings.powerCostHour) - $scope.earnings.poolCostHourNext);
        $scope.values[8] = [$scope.earnings.profitHourNext];
        console.log($scope.values[8]);
        //this loop is to create and store all of the profit values as hourly, daily, weekly and monthly
        for (var i = 0; i < $scope.values.length; i++) {
            //earnings/costs per day
            $scope.values[i][1] = $scope.values[i][0] * 24;
            //earnings/costs per week
            $scope.values[i][2] = $scope.values[i][1] * 7;
            //earnings/costs per month
            $scope.values[i][3] = $scope.values[i][1] * 30;
        }
        $scope.drawChart();
  }
  $scope.drawChart = function() {
    var labels = [];
    var profit = [0];
    var rollingDiffFactor = (1-($scope.nextDifficulty/100));
    for (var i = 0; i <= $scope.timeFrame; i++) {
        labels[i] = i;
        if (i > 0) {
            profit[i] = profit[i-1] + 2*(rollingDiffFactor*$scope.values[1][2] - $scope.values[2][2]);
            rollingDiffFactor *= rollingDiffFactor;
            profit[i] += + 2*(rollingDiffFactor*$scope.values[1][2] - $scope.values[2][2]);
        }
    }
    
    var data = {
    labels: labels,
    datasets: [
        {
            label: "Profit",
            fillColor: "rgba(255,0,0,0.2)",
            strokeColor: "rgba(255,0,0,0.2)",
            pointColor: "rgba(255,0,0,0.2)",
            pointStrokeColor: "#f00",
            pointHighlightFill: "#f00",
            pointHighlightStroke: "rgba(255,0,0,0.2)",
            data: profit
        }
    ]
};
var options = {
		xAxes: [{
			display: false
		}]
};

var ctx = $("#myChart").get(0).getContext("2d");
var myLineChart = new Chart(ctx, {
	type: 'line',
	data: data,
	options:  options
	
});
  }
}
