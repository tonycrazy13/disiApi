'use strict';

var app = angular.module("myApp", ['ngCookies',
                                   'ngAnimate',
                                   'ngResource',
                                   'ngSanitize',
                                   'ngRoute',
                                   'ui.bootstrap',
                                   'ui.bootstrap.tabs',
                                   'ui.grid',
                                   'ui.grid.selection',
                                   'ui.grid.resizeColumns',
                                   'ui.grid.autoResize']);

app.config(function ($routeProvider) {
    $routeProvider
	    .when("/", {
	        controller: "ctrlGeneric",
	        templateUrl: "pages/home.html"
	    })
	    .when("/problema", {
	        controller: "ctrlGeneric",
	        templateUrl: "pages/problema.html"
	    })
	    .when("/solucion", {
	        controller: "ctrlGeneric",
	        templateUrl: "pages/solucion.html"
	    })
	    .when("/productos", {
	        controller: "ctrlGeneric",
	        templateUrl: "pages/productos.html"
	    })
	    .when("/nosotros", {
	        controller: "ctrlGeneric",
	        templateUrl: "pages/nosotros.html"
	    })
	    .when("/aquisolucion", {
	        controller: "ctrlGeneric",
	        templateUrl: "pages/aquisolucion.html"
	    })
        .when("/formulario", {
              controller: "ctrlGeneric",
              templateUrl: "pages/formulario.html"
        })
	    .otherwise({
	        redirectTo: '/'
	    });
})

app.controller("ctrlMain", function ($scope, $location, Engineers) {
    $scope.solutions = [];

    $scope.solution = { tasks: [], engineers: [{ id: "789674618" }] };

    $scope.request = { totalTasks: 0, totalEngineers: 0, queue: [] };

    Engineers.count(function (data) {
        $scope.request.totalEngineers = data;
    });

    $scope.alerts = [];

    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.running = false;

    /**
     * Process BAR
     * Option 1
     */
    $scope.statusProgress = false;
    $scope.type = '';
    $scope.showWarning = '';
    $scope.progressbar = '';

    $scope.loading = function () {
        if ($scope.running) {
            $scope.statusProgress = true;
            $scope.type = 'info';
            $scope.showWarning = 'L o a d i n g . . . .';
            $scope.progressbar = 'progress-striped active';
        }
    }

    $scope.completed = function () {
        if ($scope.running == false) {
            $scope.running = false;
            $scope.statusProgress = false;
            $scope.type = 'success';
            $scope.showWarning = '!! C O M P L E T E D !!';
            $scope.progressbar = 'progress-striped';
            $scope.alerts.push({ type: "success", text: "Solver finished!" });
        }
    }

    $scope.hidden = function () {
        $scope.statusProgress = false;
    }

    /**
  	 * SOLUTION
  	 */
    $scope.activeDetailSolution = false;
    $scope.engineerInvolved = 0;
    $scope.engineerActivities = 0;
    $scope.unassignedActivities = 0;
    $scope.programmingActivities = 0;
    $scope.processingTime = 0;
    $scope.score = 0;

});

app.controller("ctrlScheduler", function ($scope, $resource, $controller, $location) {
    $scope.schedule = function () {
        var api = $resource("application/scheduler/solve", {});
        api.save({ engineerList: $scope.solution.engineers, taskList: $scope.solution.tasks }, function (response) {
            if (response.type == "success") {
                $scope.loading();
                $scope.$parent.running = true;
                $scope.completed();
            }
            else {
                $scope.hidden();
                $scope.$parent.running = false;
            }
            $scope.alerts.push(response);
            $location.path('/solutions')
        });
    };
});

app.controller("ctrlSolutions", function ($scope, $resource, $interval, $log, Solutions) {
    $scope.loading();

    $scope.tblData = [{ id: 39890558, hardScore: 0, softScore: -15, feasible: true }];
    $scope.tblColumns = [{ name: 'id', displayName: 'Solution', maxWidth: 120 },
	                     { name: 'score.hardScore', displayName: 'Hard' },
	                     { name: 'score.softScore', displayName: 'Soft' },
	                     { name: 'score.feasible', displayName: 'Feasible' },
	                     { name: 'timestamp', displayName: 'Created On', cellFilter: 'date : \'yyyy-MM-dd HH:mm:ss.sss\'' }];

    $scope.gridOptionsSolutions = {
        data: $scope.tblData,
        columnDefs: $scope.tblColumns,
        showGridFooter: true,
        enableRowSelection: false,
        enableFullRowSelection: true,
        multiSelect: false
    };

    $scope.gridOptionsSolutions.onRegisterApi = function (gridApi) {
        //set gridApi on scope

        $scope.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope, function (row) {
            var msg = 'row selected ' + row.isSelected;
            $log.log(msg);
            $scope.solution = row.entity;
            $log.log($scope.solution);

            $scope.activeDetailSolution = true;
            $scope.engineerInvolved = $scope.solution.engineerList.length;
            $scope.engineerActivities = $scope.solution.engineerList.length;
            $scope.unassignedActivities = 0;//Fijo por el momento
            $scope.programmingActivities = $scope.solution.taskList.length;
            $scope.processingTime = 0;
            $scope.score = $scope.solution.score.softScore;
        });

        gridApi.selection.on.rowSelectionChangedBatch($scope, function (rows) {
            var msg = 'rows changed ' + rows.length;
            $log.log(msg);
        });
    };

    var stopInterval = $interval(function () {
        Solutions.list(function (data) {
            if (data.running == false) {
                $scope.stop();
            }
            $scope.solutions = data.solutions;
            $scope.gridOptionsSolutions.data = $scope.solutions;
        });
    }, 10000);

    $scope.$on('$destroy', function () {
        $scope.stop();
    });

    $scope.select = function (index) {
        Solutions.retrieve($scope.solutions[index].id, function (response) {
            $scope.solution = response;

            $scope.solution.constraintMatches = _.pairs($scope.solution.constraintMatches);

            $log.log($scope.solution);

            $scope.listEnginnerAsigned = [];
            $scope.listEnginnerUnasigned = [];
            for (var i = 0; i < $scope.solution.engineerList.length; i++) {
                $scope.engineerAct = $scope.solution.engineerList[i];
                if ($scope.engineerAct.nextTask != null) {
                    $scope.listEnginnerAsigned.push($scope.engineerAct);
                } else {
                    $scope.listEnginnerUnasigned.push($scope.engineerAct);
                }
            }

            $scope.activeDetailSolution = true;
            $scope.engineerInvolved = $scope.solution.engineerList.length;
            $scope.engineerActivities = $scope.listEnginnerAsigned.length;
            $scope.unassignedActivities = 0;//Fijo por el momento
            $scope.programmingActivities = 0;//$scope.solution.taskList.length;
            $scope.processingTime = $scope.solution.processingTime;
            $scope.score = $scope.solution.score.hardScore + 'hard/ ' + $scope.solution.score.softScore + 'soft';
        });
    };

    $scope.stop = function () {
        if (angular.isDefined(stopInterval)) {
            $interval.cancel(stopInterval);
            stopInterval = undefined;
            $scope.completed();
            $scope.$parent.running = false;
            $scope.$parent.statusProgress = false;
        }
    };

    $scope.terminate = function () {
        var api = $resource("application/scheduler/terminateEarly", {});

        api.save({}, function (response) {
            $scope.stop();
            $scope.alerts.push(response);
        });
    };

    $scope.nextTasks = function (next, tasks) {
        if (next === undefined || next === null) {
            return tasks;
        }
        tasks.push(next);
        return $scope.nextTasks(next.nextTask, tasks);
    }
});

app.controller("ctrlEngineers", function ($scope, $filter, Engineers) {
    $scope.tblData = [{ id: 39890558 }];
    $scope.tblSelections = [];
    $scope.tblColumns = [{ name: 'id', displayName: 'W6KEY', maxWidth: 100 },
	                     { name: 'gsc', displayName: 'GSC' },
	                     { name: 'unit', displayName: 'Unit' },
	                     { name: 'subunit', displayName: 'Subunit' },
	                     { name: 'region', displayName: 'Region' },
	                     { name: 'disctrict', displayName: 'District' }];

    $scope.gridOptionsEng = {
        data: $scope.tblData,
        columnDefs: $scope.tblColumns,
        selectedItems: $scope.tblSelections,
        showGridFooter: true,
        multiSelect: false
    };

    Engineers.list(function (data) {
        $scope.solution.engineers = data;
        $scope.gridOptionsEng.data = $scope.solution.engineers;
    });

    $scope.isViewDay = true;
    $scope.dateAuto = new Date();
    $scope.leyendaCalendar = $filter('date')(new Date($scope.dateAuto), 'fullDate');

    $scope.today = function () {
        $scope.dateAuto = new Date();
        if ($scope.isViewDay) {
            $scope.viewActivitieDay();
        } else {
            $scope.viewActivitieWeek();
        }
    }
    $scope.before = function () {
        if ($scope.isViewDay) {
            var previousDay = -1;
            $scope.dateAuto.setDate($scope.dateAuto.getDate() + previousDay);
            $scope.viewActivitieDay();
        } else {
            var previousDay = -7;
            $scope.dateAuto.setDate($scope.dateAuto.getDate() + previousDay);
            $scope.viewActivitieWeek();
        }

    }
    $scope.after = function () {
        if ($scope.isViewDay) {
            var nextDay = 1;
            $scope.dateAuto.setDate($scope.dateAuto.getDate() + nextDay);
            $scope.viewActivitieDay();
        } else {
            var nextDay = 7;
            $scope.dateAuto.setDate($scope.dateAuto.getDate() + nextDay);
            $scope.viewActivitieWeek();
        }
    }

    $scope.viewActivitieDay = function () {
        $scope.isViewDay = true;
        $scope.leyendaCalendar = $filter('date')(new Date($scope.dateAuto), 'fullDate');
        $scope.tblData = [{ id: 'id1', enginner: 'LUIS' + $scope.dateAuto, activitie: 'ACIVITIE_1', op1: "active", op2: "active", op3: "active", op4: "active", op5: "active", op6: "active", op7: "", op8: "", op9: "", op10: "" },
		     			{ id: 'id2', enginner: 'LUIS2', activitie: 'ACIVITIE_2', op1: "active", op2: "active", op3: "active", op4: "active", op5: "active", op6: "active", op7: "", op8: "", op9: "", op10: "" },
		     			{ id: 'id2', enginner: 'LUIS3', activitie: 'ACIVITIE_3', op1: "active", op2: "active", op3: "active", op4: "active", op5: "active", op6: "active", op7: "", op8: "", op9: "", op10: "" }];
        $scope.tblSelections = [];
        $scope.tblColumns = [{ name: 'id', displayName: 'W6KEY', maxWidth: 80 },
		                     { name: 'enginner', displayName: 'Name Enginnner', minWidth: 300 },
		                     { name: 'activitie', displayName: 'Task', maxWidth: 85 },
		                     { name: 'op1', displayName: '09:00' },
     			             { name: 'op2', displayName: '10:00' },
     			             { name: 'op3', displayName: '11:00' },
     			             { name: 'op4', displayName: '12:00' },
     			             { name: 'op5', displayName: '13:00' },
     			             { name: 'op6', displayName: '14:00' },
     			             { name: 'op7', displayName: '15:00' },
     			             { name: 'op8', displayName: '16:00' },
     			             { name: 'op9', displayName: '17:00' },
     			             { name: 'op10', displayName: '18:00' }];
        $scope.gridOptionsEng = {
            data: $scope.tblData,
            columnDefs: $scope.tblColumns,
            selectedItems: $scope.tblSelections,
            showGridFooter: true,
            multiSelect: false
        };
    }
    $scope.viewActivitieWeek = function () {
        {
            $scope.isViewDay = false;
            $scope.leyendaCalendar = "WEEK - " + $filter('date')(new Date($scope.dateAuto), 'ww');

            $scope.startWeek;
            $scope.startDay;

            $scope.dayWeek = $filter('date')(new Date($scope.dateAuto), 'EEEE');
            $scope.day = $filter('date')(new Date($scope.dateAuto), 'dd');

            if ($scope.dayWeek == 'Monday') {
                $scope.startDay = $scope.day;
            } else
                if ($scope.dayWeek == 'Tuesday') {
                    $scope.day--;//-1 day
                    $scope.startDay = $scope.day;
                }
                else
                    if ($scope.dayWeek == 'Wednesday') {
                        $scope.day--; $scope.day--;//-2 day
                        $scope.startDay = $scope.day;
                    }
                    else
                        if ($scope.dayWeek == 'Thursday') {
                            $scope.day--; $scope.day--; $scope.day--;//-3 day
                            $scope.startDay = $scope.day;
                        }
                        else
                            if ($scope.dayWeek == 'Friday') {
                                $scope.day--; $scope.day--; $scope.day--; $scope.day--;//-4 day
                                $scope.startDay = $scope.day;
                            }
                            else
                                if ($scope.dayWeek == 'Saturday') {
                                    $scope.day--; $scope.day--; $scope.day--; $scope.day--; $scope.day--;//-5 day
                                    $scope.startDay = $scope.day;
                                }
                                else
                                    if ($scope.dayWeek == 'Sunday') {
                                        $scope.day--; $scope.day--; $scope.day--; $scope.day--; $scope.day--; $scope.day--;//-6 day
                                        $scope.startDay = $scope.day;
                                    }

            $scope.mounth = $filter('date')(new Date($scope.dateAuto), 'MMM');
            $scope.year = $filter('date')(new Date($scope.dateAuto), 'yyyy');

            $scope.dayIncrement = $scope.startDay;
            $scope.dayIncrement++;
            $scope.twoMoreDay = $scope.dayIncrement;
            $scope.dayIncrement++;
            $scope.threeMoreDay = $scope.dayIncrement;
            $scope.dayIncrement++;
            $scope.fourMoreDay = $scope.dayIncrement;
            $scope.dayIncrement++;
            $scope.fiveMoreDay = $scope.dayIncrement;
            $scope.dayIncrement++;
            $scope.sixMoreDay = $scope.dayIncrement;
            $scope.dayIncrement++;
            $scope.sevenMoreDay = $scope.dayIncrement;

            $scope.tblData = [{ day1: "LUIS ACIVITIE_1", day2: $scope.dateAuto, day3: "", day4: "", day5: "", day6: "", day7: "" },
			     			{ day1: "", day2: "", day3: "LUIS2 ACIVITIE_2", day4: "", day5: "", day6: "", day7: "" },
			     			{ day1: "", day2: "", day3: "", day4: "", day5: "LUIS3 ACIVITIE_3", day6: "", day7: "" }];
            $scope.tblSelections = [];
            $scope.tblColumns = [{ name: 'day1', displayName: $scope.startDay + ", " + $scope.mounth + " " + $scope.year },
			                     { name: 'day2', displayName: $scope.twoMoreDay + ", " + $scope.mounth + " " + $scope.year },
			                     { name: 'day3', displayName: $scope.threeMoreDay + ", " + $scope.mounth + " " + $scope.year },
								 { name: 'day4', displayName: $scope.fourMoreDay + ", " + $scope.mounth + " " + $scope.year },
								 { name: 'day5', displayName: $scope.fiveMoreDay + ", " + $scope.mounth + " " + $scope.year },
								 { name: 'day6', displayName: $scope.sixMoreDay + ", " + $scope.mounth + " " + $scope.year },
								 { name: 'day7', displayName: $scope.sevenMoreDay + ", " + $scope.mounth + " " + $scope.year }];
            $scope.gridOptionsEng = {
                data: $scope.tblData,
                columnDefs: $scope.tblColumns,
                selectedItems: $scope.tblSelections,
                showGridFooter: true,
                multiSelect: false
            };

        }
    }
});

app.controller("ctrlTasks", function ($scope, $window, Tasks, Engineers) {
    $scope.wpg = { id: '', tasks: [] };

    $scope.search = '';

    $scope.tblData = [];
    $scope.tblSelections = [];
    $scope.tblColumns = [{ name: 'id', displayName: 'W6KEY', maxWidth: 80 },
	                     { name: 'actname', displayName: 'Name', minWidth: 300 },
	                     { name: 'duration', displayName: 'Duration', maxWidth: 85, cellFilter: 'date : \'HH:mm:ss\' : \'GMT\'' },
	                     //{ name: 'priority', displayName: 'Priority' },
	                     { name: 'earlyStart', displayName: 'Early Start', maxWidth: 90, cellFilter: 'date : \'yyyy-MM-dd\' : \'GMT\'' },
	                     { name: 'lateStart', displayName: 'Late Start', maxWidth: 90, cellFilter: 'date : \'yyyy-MM-dd\' : \'GMT\'' },
	                     { name: 'dueDate', displayName: 'Due Date', maxWidth: 90, cellFilter: 'date : \'yyyy-MM-dd\' : \'GMT\'' },
	                     { name: 'workpackagegroup', displayName: 'WPG' }];

    $scope.gridOptionsTasks = {
        data: $scope.tblData,
        columnDefs: $scope.tblColumns,
        selectedItems: $scope.tblSelections,
        showGridFooter: true,
        multiSelect: false
    };

    $scope.detailsEngineers = function () {
        $window.location.href = '#/engineers';
    }

    $scope.loadWPG = function () {
        if ($scope.search) {
            Tasks.listByWPG($scope.search, function (data) {
                $scope.wpg = {
                    id: $scope.search,
                    tasks: data
                };
                $scope.gridOptionsTasks.data = $scope.wpg.tasks;
            });
        }
        else {
            $scope.alerts.push({ type: "warning", text: "Need a WPG to search!" });
        }
    };


    $scope.show = function (index) {
        $scope.wpg = $scope.request.queue[index];
        $scope.gridOptionsTasks.data = $scope.wpg.tasks;
    };


    $scope.remove = function (index) {
        $scope.request.totalTasks -= $scope.request.queue[index].tasks.length;
        $scope.request.queue.splice(index, 1);
    };


    $scope.addToQueue = function () {
        if ($scope.search === '') {
            $scope.alerts.push({ type: "warning", text: "Need to select a WPG!" });
            return;
        }

        $scope.request.totalTasks += $scope.wpg.tasks.length;

        if (_.where($scope.request.queue, { 'id': $scope.search }).length == 0) {
            var wpg = angular.copy($scope.wpg);
            $scope.request.queue.push(wpg);
            var sTasks = $scope.solution.tasks;
            sTasks.push.apply(sTasks, wpg.tasks);
            $scope.search = '';
            $scope.wpg = { id: '', tasks: [] };
            $scope.gridOptionsTasks.data = $scope.wpg.tasks;
        }
        else {
            $scope.alerts.push({ type: "warning", text: "Item already in queue!" });
        }
    };
});

app.controller("ctrlRules", function ($scope) {
    $scope.sequence = 12355;
    $scope.listRules = [{ idRule: 12345, name: 'Base priority revenue', weight: '500' },
                        { idRule: 12346, name: 'Consider Preferred Engineers', weight: '400' },
                        { idRule: 12347, name: 'Minimize Resource Idle Time', weight: '25' },
                        { idRule: 12348, name: 'Prefer appointments', weight: '200' },
                        { idRule: 12349, name: 'Priority by appointment finish', weight: '400' },
                        { idRule: 12350, name: 'Priority by due date', weight: '400' },
                        { idRule: 12351, name: 'Same sites', weight: '75' },
                        { idRule: 12352, name: 'Schedule appointments ASAP', weight: '100' },
                        { idRule: 12353, name: 'Schedule non-appointments ASAP', weight: '100' },
                        { idRule: 12354, name: 'Task Priority', weight: '400' }];
    $scope.tblSelections = [];
    $scope.tblColumns = [{ name: 'idRule', displayName: 'Id Rule', maxWidth: 80 },
                         { name: 'name', displayName: 'Name Rule', minWidth: 300 },
                         { name: 'weight', displayName: 'Weight' }];

    $scope.gridRules = {
        data: $scope.listRules,
        columnDefs: $scope.tblColumns,
        selectedItems: $scope.tblSelections,
        showGridFooter: true,
        multiSelect: false
    };

    $scope.save = function () {
        $scope.listRules.push({ idRule: $scope.sequence, name: $scope.rule, weight: $scope.weight });
        $scope.rule = '';
        $scope.weight = '';
        $scope.sequence++;
    };
    $scope.edit = function () {
        console.info($scope.gridRules.selectedItems);
        //				$scope.listRules.push({idRule:$scope.sequence, name:$scope.rule, weight: $scope.weight});
        //				$scope.rule = '';
        //				$scope.weight = '';
        //				$scope.sequence++;
    };
});
app.controller("ctrlEngineersSolve", function ($scope, $resource, $window, Engineers) {
    $scope.w6key;

    $scope.tblData = [{ id: 39890558 }];
    $scope.tblSelections = [];
    $scope.tblColumns = [{ name: 'id', displayName: 'W6KEY', maxWidth: 100 },
	                     { name: 'gsc', displayName: 'GSC' },
	                     { name: 'unit', displayName: 'Unit' },
	                     { name: 'subunit', displayName: 'Subunit' },
	                     { name: 'region', displayName: 'Region' },
	                     { name: 'disctrict', displayName: 'District' }];

    $scope.gridCurrentEngineers = {
        data: $scope.tblData,
        columnDefs: $scope.tblColumns,
        selectedItems: $scope.tblSelections,
        showGridFooter: true,
        multiSelect: false
    };

    Engineers.list(function (data) {
        $scope.currentEngineers = data;
        $scope.gridCurrentEngineers.data = $scope.currentEngineers;
    });

    $scope.changeToCalendar = function () {
        $window.location.href = '#/engineersCalendar';
    }
});

app.controller("ctrlEngineersCalendar", function ($scope, $resource, $filter, Engineers) {

    $scope.options = [{ name: '09:00', value: '9' },
					   { name: '10:00', value: '10' },
					   { name: '11:00', value: '11' },
					   { name: '12:00', value: '12' },
					   { name: '13:00', value: '13' },
					   { name: '14:00', value: '14' },
					   { name: '15:00', value: '15' },
					   { name: '16:00', value: '16' },
					   { name: '17:00', value: '17' },
					   { name: '18:00', value: '18' }];

    $scope.dateAuto = new Date();
    $scope.leyendaCalendar = $filter('date')(new Date($scope.dateAuto), 'fullDate');

    $scope.leyendaCalendar = "WEEK - " + $filter('date')(new Date($scope.dateAuto), 'ww');

    $scope.startWeek;
    $scope.startDay;

    $scope.dayWeek = $filter('date')(new Date($scope.dateAuto), 'EEEE');
    $scope.day = $filter('date')(new Date($scope.dateAuto), 'dd');

    if ($scope.dayWeek == 'Monday') {
        $scope.startDay = $scope.day;
    } else
        if ($scope.dayWeek == 'Tuesday') {
            $scope.day--;//-1 day
            $scope.startDay = $scope.day;
        }
        else
            if ($scope.dayWeek == 'Wednesday') {
                $scope.day--; $scope.day--;//-2 day
                $scope.startDay = $scope.day;
            }
            else
                if ($scope.dayWeek == 'Thursday') {
                    $scope.day--; $scope.day--; $scope.day--;//-3 day
                    $scope.startDay = $scope.day;
                }
                else
                    if ($scope.dayWeek == 'Friday') {
                        $scope.day--; $scope.day--; $scope.day--; $scope.day--;//-4 day
                        $scope.startDay = $scope.day;
                    }
                    else
                        if ($scope.dayWeek == 'Saturday') {
                            $scope.day--; $scope.day--; $scope.day--; $scope.day--; $scope.day--;//-5 day
                            $scope.startDay = $scope.day;
                        }
                        else
                            if ($scope.dayWeek == 'Sunday') {
                                $scope.day--; $scope.day--; $scope.day--; $scope.day--; $scope.day--; $scope.day--;//-6 day
                                $scope.startDay = $scope.day;
                            }

    $scope.mounth = $filter('date')(new Date($scope.dateAuto), 'MMM');
    $scope.year = $filter('date')(new Date($scope.dateAuto), 'yyyy');

    $scope.dayIncrement = $scope.startDay;
    $scope.dayIncrement++;
    $scope.twoMoreDay = $scope.dayIncrement;
    $scope.dayIncrement++;
    $scope.threeMoreDay = $scope.dayIncrement;
    $scope.dayIncrement++;
    $scope.fourMoreDay = $scope.dayIncrement;
    $scope.dayIncrement++;
    $scope.fiveMoreDay = $scope.dayIncrement;
    $scope.dayIncrement++;
    $scope.sixMoreDay = $scope.dayIncrement;
    $scope.dayIncrement++;
    $scope.sevenMoreDay = $scope.dayIncrement;

    /**
	 * WEEK
	 */

    $scope.tblData = [{ hourDay: "09:00", day1: "LUIS1 ACTIVITIE_1", day2: $scope.dateAuto, day3: "", day4: "", day5: "", day6: "", day7: "" },
	     			{ hourDay: "10:00", day1: "LUIS1 ACTIVITIE_1", day2: "", day3: "LUIS2 ACIVITIE_2", day4: "", day5: "", day6: "", day7: "" },
	     			{ hourDay: "11:00", day1: "", day2: "", day3: "", day4: "", day5: "LUIS3 ACIVITIE_3", day6: "", day7: "" },
	     			{ hourDay: "12:00", day1: "", day2: "", day3: "LUIS3 ACIVITIE_3", day4: "", day5: "", day6: "", day7: "" },
	     			{ hourDay: "13:00", day1: "", day2: "", day3: "", day4: "", day5: "LUIS3 ACIVITIE_3", day6: "", day7: "" },
	     			{ hourDay: "14:00", day1: "", day2: "", day3: "", day4: "", day5: "LUIS3 ACIVITIE_3", day6: "", day7: "" },
	     			{ hourDay: "15:00", day1: "LUIS1 ACTIVITIE_1", day2: "", day3: "", day4: "", day5: "", day6: "LUIS3 ACIVITIE_3", day7: "" },
	     			{ hourDay: "16:00", day1: "LUIS1 ACTIVITIE_1", day2: "", day3: "", day4: "", day5: "LUIS3 ACIVITIE_3", day6: "", day7: "" },
	     			{ hourDay: "17:00", day1: "", day2: "", day3: "", day4: "", day5: "LUIS3 ACIVITIE_3", day6: "", day7: "" },
	     			{ hourDay: "18:00", day1: "LUIS1 ACTIVITIE_1", day2: "", day3: "", day4: "", day5: "LUIS3 ACIVITIE_3", day6: "", day7: "" }];
    $scope.tblSelections = [];
    $scope.tblColumns = [{ name: 'hourDay', displayName: "HOUR" },
	                     { name: 'day1', displayName: $scope.startDay + ", " + $scope.mounth + " " + $scope.year },
	                     { name: 'day2', displayName: $scope.twoMoreDay + ", " + $scope.mounth + " " + $scope.year },
	                     { name: 'day3', displayName: $scope.threeMoreDay + ", " + $scope.mounth + " " + $scope.year },
						 { name: 'day4', displayName: $scope.fourMoreDay + ", " + $scope.mounth + " " + $scope.year },
						 { name: 'day5', displayName: $scope.fiveMoreDay + ", " + $scope.mounth + " " + $scope.year },
						 { name: 'day6', displayName: $scope.sixMoreDay + ", " + $scope.mounth + " " + $scope.year },
						 { name: 'day7', displayName: $scope.sevenMoreDay + ", " + $scope.mounth + " " + $scope.year }];
    $scope.gridEngineersCalendar = {
        data: $scope.tblData,
        columnDefs: $scope.tblColumns,
        selectedItems: $scope.tblSelections,
        showGridFooter: true,
        multiSelect: false
    };
    $scope.addLunch = function () {
        $scope.startLaunch = $scope.cboStart.value;
        $scope.endLaunch = $scope.cboEnd.value;
    }

    /**
	 * HOLIDAYS
	 */
    $scope.tblDataHoliday = [{ holiday: "Add Holidays" }];
    $scope.tblColumnsHoliday = [{ name: 'holiday', displayName: "HOLIDAY", cellClass: "" }];

    $scope.gridHolidays = {
        data: $scope.tblDataHoliday,
        columnDefs: $scope.tblColumnsHoliday,
        showGridFooter: true,
        multiSelect: false
    };

    $scope.addHoliday = function () {
        $scope.addHolidayNew = $filter('date')(new Date($scope.holidaySelected), 'mediumDate');
        window.alert($scope.addHolidayNew);
        window.alert($scope.holidaySelected.value);
        $scope.tblDataHoliday.push({ name: $scope.addHolidayNew });
        $scope.holidaySelected = '';
    }
});
app.controller("ctrlGeneric", function ($scope) {
    $scope.alerts = [];

    $scope.addAlert = function () {
        $scope.alerts.push({ type: 'success', msg: '!!La petición ha sido enviada!! Gracias por contactar a DiSi..' });
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
});
