function data($scope, $http) {
  // when the page loads for the first time
  if($scope.search == undefined) {
    $scope.search = "hi";
    fetch();
    //console.log($scope.bitcoinStats);
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

  function fetch() {
    $http.get("https://bitcoin.toshi.io/api/v0/blocks/latest")
     .success(function(response) {
         $scope.bitcoinStats = response;
         $scope.difficulty = response.difficulty.toFixed(0);
     });
    $http.get("https://api.bitcoinaverage.com/exchanges/USD")
     .success(function(response) {
         $scope.price = response.bitfinex.rates.last;
     });
  }

} // end of controller 'data'

function update(elem) {
  index = elem.id - 1;
}
