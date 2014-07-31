practiceGame.controller('PracticeController',['$scope','practiceRequests','Utilities','breadcrumbs','VideoService','Alerts','$location','$q',function($scope,practiceRequests,Utilities,breadcrumbs,VideoService,Alerts,$location,$q) {

    $scope.activeTracks = Utilities.getActiveTrack();
    $scope.titleQuest = $scope.activeTracks.trackTitle;
    $scope.activeGroupId = Utilities.getActiveGroup();
    $scope.breadcrumbs = breadcrumbs;
    breadcrumbs.options = { 'practice': $scope.titleQuest };

    $scope.portalC = $scope;
    $scope.loading = true;
    $scope.optionList = "abcdefghijklmnopqrstuvwxyz";
    $scope.nextActionTitle = 'Confirm Choice';
    $scope.questionItems = [];
    $scope.items = [];
    $scope.answerStatus=null;
    $scope.showExplanation = false;
    $scope.showVideo = false;
    $scope.setPosition = 0;
    $scope.position = 0;
    $scope.lastAnswerLoaded = '';
    $scope.directives =
        [
            { id: '1', type: 'MultipleChoiceOneCorrect'},
            { id: '2', type: 'MultipleChoiceOneOrMoreCorrect'},
            { id: '3', type: 'MultipleChoiceMatrixTwoByThree'},
            { id: '4', type: 'MultipleChoiceMatrixThreeByThree'},
            { id: '5', type: 'NumericEntryFraction'},
            { id: '6', type: 'NumericEntry'},
            { id: '7', type: 'sat'},
            {id: '8', type: 'MultipleChoiceTwoCorrect'}
        ];


    var Practice = {
        setLayoutBasedOnQuestionInfo: function (setLayout) {
            var panel1 = angular.element('#Panel1'),
                panel2 = angular.element('#Panel2');

            if (setLayout) {
                panel1.removeClass('col-md-offset-3');
                panel2.removeClass('col-md-offset-3');
            }
            else {
                panel1.addClass('col-md-offset-3');
                panel2.addClass('col-md-offset-3');
            }
        },
        loadQuestion: function (questionToRequest) {

            var setLayoutType = false;


            /*Get question and Create Round Session by Question*/
            var getQuestion = practiceRequests.questions().getQuestionById(questionToRequest),
                questionPresentation = practiceRequests.roundSessions().createQuestionPresentation($scope.gameResponseId, questionToRequest);

            $q.all([getQuestion, questionPresentation]).then(function (result) {

                var questionResult = result[0].data.question;
                $scope.answerObject = result[1].data;
                $scope.roundSessionAnswer = $scope.answerObject.round_session;

                Practice.setCurrentQuestionId(questionResult.id);
                Practice.setMailToInformation(questionResult.id);

                angular.element('.choice.active').removeClass('active');

                if ($scope.lastAnswerLoaded == '' || $scope.lastAnswerLoaded != questionResult.kind) {
                    $scope.currentA = Utilities.findInArray(questionResult.kind, $scope.directives, 'type').id;
                    $scope.lastAnswerLoaded = questionResult.kind;
                }

                $scope.items = [];
                $scope.stimulus = "";
                $scope.template = $scope.actualView;
                $scope.questionItems = questionResult;

                $scope.questionInformation = questionResult.question_set.info;

                /*Find if there is a question info defined or retrieve it by the API*/
                setLayoutType = angular.isDefined($scope.questionInformation) && $scope.questionInformation != null && $scope.questionInformation != '' ? true : false;

                /*Set the layout based on the question info*/
                Practice.setLayoutBasedOnQuestionInfo(setLayoutType);
                $scope.stimulus = $scope.questionItems.stimulus;

                var options = $scope.optionList.toUpperCase().split(""),
                    answers = $scope.questionItems.answers;
                angular.forEach(answers, function (value, index) {

                    value["option"] = options[index];
                    $scope.items.push(value);
                });

                $scope.position++;
                Practice.removeBadImage();
                $scope.loading = false;
            }).catch(function error(error) {

                Alerts.showAlert(Alerts.setErrorApiMsg(error), 'danger');
            });
        },
        resetLayout: function () {
            $scope.titleQuest='';
            $scope.titleQuest = $scope.activeTracks.trackTitle + ' Explanation';
            this.setLayoutBasedOnQuestionInfo(true);
            angular.element('#skipAction').addClass('hide');
            angular.element('#nextAction').removeClass('btn-primary').addClass('btn-success');
            angular.element('.list-group *').addClass('no-hover');
            $scope.nextActionTitle = 'Next Question';


        },
        nextQuestion: function () {
            this.loadQuestionsSet();

            //Enable/disable answer section
            $scope.numerator = null;
            $scope.denominator = null;
            angular.element('#answercontent *').removeClass('btn-primary btn-danger btn-success').removeAttr('disabled');
            $scope.showVideo = false;
            $scope.showExplanation = false;
            $scope.answerStatus=null;
            $scope.nextActionTitle = 'Confirm Choice';
            $scope.messageConfirmation = '';
            angular.element('#nextAction').removeClass('btn-success');
            angular.element('#skipAction').removeClass('hide');
            angular.element('#answersPanels').removeClass().addClass('fadeIn animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                angular.element(this).removeClass();
            });

        },
        tagResourcesInfo: function(){
            var tags = [];

            angular.forEach($scope.questionItems.tags, function (value) {
                tags.push({
                    name:value.name,
                    tagResource: Utilities.getYoutubeVideosInfo(value.tag_resources)
                });
            });
            $scope.tags = tags;

        },
        seeAnswer: function () {
            this.resetLayout();

            /*Question Explanation*/
            $scope.questionExplanation = $scope.questionItems.explanation;

            if ($scope.questionExplanation != null)
                $scope.showExplanation = true;


            /*video validation*/
            if ($scope.questionItems.youtube_video_id !== null) {
                $scope.showVideo = true;
                $scope.videoId = $scope.questionItems.youtube_video_id;
                VideoService.setYouTubeTitle($scope.videoId).then(function (videoTime) {
                    $scope.videoText = 'Video Explanation (' + videoTime + ')';
                });
            }

            /*Get answers from the previous request and Explain*/
            var answers = $scope.questionItems.answers;

            /*Evaluate tag resources info, get video Ids and video time*/
            Practice.tagResourcesInfo();

            $scope.xpTag = $scope.questionItems.experience_points;


            /*   Work with the styles to shown result
             define is some answer is bad.*/
            angular.element('.choice button').removeClass('btn-primary');

            angular.forEach(answers, function (value, key) {
                var selectIdButton = '#' + value.id;
                if (value.correct) {
                    angular.element(selectIdButton).addClass('btn-success');
                }
            });

            angular.element("#answercontent *").prop('disabled', true);

        },
        displayGeneralConfirmInfo: function () {
            /* Question Explanation*/
            $scope.questionExplanation = $scope.questionItems.explanation;

            if ($scope.questionExplanation != null)
                $scope.showExplanation = true;


            /* video validation*/
            if ($scope.questionItems.youtube_video_id !== null) {
                $scope.showVideo = true;
                $scope.videoId = $scope.questionItems.youtube_video_id;
                VideoService.setYouTubeTitle($scope.videoId).then(function (videoTime) {
                    $scope.videoText = 'Video Explanation (' + videoTime + ')';
                });
            }

            /*Evaluate tag resources info, get video Ids and video time*/
            Practice.tagResourcesInfo();
            $scope.xpTag = $scope.questionItems.experience_points;

            /* Work with the styles to shown result
             define is some answer is bad.*/
            $scope.answerStatus = true;
        },
        confirmChoice: function () {
            this.resetLayout();

            var selectedPosition = '', selectedOptions = [], selectedOptionsCount, i = 0;

            /*Get selected answers*/
            angular.element('.choice input[value=true]').each(function () {
                selectedPosition = $(this).attr('id');
                selectedOptions.push(selectedPosition);
            });

            selectedOptionsCount = selectedOptions.length;
            if (selectedOptionsCount > 0) {

                this.displayGeneralConfirmInfo();
                var answers = $scope.questionItems.answers;

                angular.element('.choice button').removeClass('btn-primary');
                angular.forEach(answers, function (value) {

                    var selectIdButton = ('#' + value.id);

                    /*set the correct class on the button*/
                    if (value.correct) {
                        if (Utilities.existsInArray(value.id, selectedOptions)) {
                            /*Send answer response to server, important this line have to be inside this if
                             * since just the users answers get into this evaluation
                             * */
                            $scope.answerObject.one($scope.roundSessionAnswer.id).put({answer_id: value.id });
                        }
                        else {
                            $scope.answerStatus = false;
                        }
                        angular.element(selectIdButton).addClass('btn-success');

                    }
                    else {
                        if (Utilities.existsInArray(value.id, selectedOptions)) {
                            /*Send answer response to server, important this line have to be inside this if
                             * since just the users answers get into this evaluation
                             * */
                            $scope.answerObject.one($scope.roundSessionAnswer.id).put({answer_id: value.id });
                            angular.element(selectIdButton).addClass('btn-danger');
                            angular.element(selectIdButton).parents('#answer').addClass('incorrectAnswer');
                            $scope.answerStatus = false;
                        }

                    }

                });


                $scope.messageConfirmation = $scope.answerStatus ? 'Your answer was correct' : 'Your answer was incorrect';
                angular.element("#answercontent *").prop('disabled', true);
            }
            else {
                Alerts.showAlert('Please select an option!', 'warning');

            }
        },
        numericEntryConfirmChoice: function () {
            this.resetLayout();

            /*Get selected answers*/

            if ($scope.numerator || $scope.denominator) {

                this.displayGeneralConfirmInfo();

                if('NumericEntryFraction'==""){

                  /*  var f = new Fraction(0.3333);
                    f; //0.3333333333
                    f.toString(); // 6004799502560181/18014398509481984
                    f.approx //0.33333
                    f.approx.toString() //3333/10000

                    var g = new Fraction(2/3);
                    g; //0.6666666666666666
                    g.toString(); //6004799503160661/9007199254740992
                    g.approx //0.6666666666666666
                    g.approx.toString() //2/3*/


                }

                var answers = $scope.questionItems.answers;
                $scope.selectedAnswer = 0;

                angular.forEach(answers, function (value) {
                    /*evaluate just one time the quivalence between body and numerator*/
                    var answerEval = (value.body == $scope.numerator);

                    if (answerEval)
                        $scope.selectedAnswer = value.answer_id;

                    $scope.answerStatus = answerEval;

                });

                $scope.answerObject.one($scope.roundSessionAnswer.id).put({answer_id: $scope.selectedAnswer});


                $scope.messageConfirmation = $scope.answerStatus ? 'Your answer was correct' : 'Your answer was incorrect';
                angular.element("#answercontent *").prop('disabled', true);
            }
            else {
                Alerts.showAlert(Alerts.setErrorApiMsg(error), 'warning');

            }


        },
        evaluateConfirmMethod: function () {
            switch ($scope.lastAnswerLoaded) {
                case 'NumericEntry':
                    Practice.numericEntryConfirmChoice();
                    break;
                default:
                    Practice.confirmChoice();
            }
        },
        setCurrentQuestionId: function (questionId) {

            Utilities.setCurrentParam('questionId', questionId);
            $location.path(Utilities.getCurrentParam('subject') + '/dashboard/practice/' + questionId);
        },
        getQuestionSets: function () {
            var getQuestionSet = practiceRequests.practiceGames().getQuestionNewSetByPractice($scope.gameResponseId, $scope.activeTracks.tracks);

            getQuestionSet.then(function (result) {

                $scope.questionSetList = result.data.question_sets;
                Practice.loadQuestionsSet();

            }).catch(function error(error) {

                Alerts.showAlert(Alerts.setErrorApiMsg(error), 'danger');

            });

        },
        loadQuestionsSet: function () {

            if ($scope.questionSetList.length > 0) {

                /*if $scope.setPosition is bigger than $scope.questionSetList.length we already finish the list of question sets */
                if ($scope.setPosition < $scope.questionSetList.length) {
                    $scope.titleQuest='';
                    $scope.titleQuest = $scope.activeTracks.trackTitle;

                    var setPosition = $scope.setPosition,

                    /* Iterate between all the question sets retrieved it by the API */
                        questionSetResult = $scope.questionSetList[setPosition];

                    var position = $scope.position,
                        /* questionsCount Give us the number of questions by questionSet*/
                        questionsCount = questionSetResult.questions.length;

                    $scope.questByQSetTitle= questionsCount > 1 ? 'Question '+(position+1) +' of '+ (questionsCount)+' for this set': '';


                    /* Iterate between all the question retrieved it by the API which belong to a specific Question set */
                    var questionIdToRequest = questionSetResult.questions[position];
                    if (position < questionsCount) {

                        Practice.loadQuestion(questionIdToRequest)
                    }
                    else {
                        $scope.position = 0;
                        $scope.setPosition++;
                        Practice.loadQuestionsSet();
                    }
                }
                else {
                   /*If we finish with the first load of questions id/question sets que create a new game*/
                    $scope.CreateNewGame();
                }

            }
            else {

                var dialogOptions = {
                    message: "Sorry, we can't show you questions for this topic yet. We're still working on them and should have them ready soon. " +
                        "Please select a different topic for now or also you can answer" + '' +
                        " questions in the old Grockit.. Thanks.",
                    buttons: {
                        success: {
                            label: "Stay on New Grockit!",
                            className: "btn-success",
                            callback: function () {
                                Utilities.redirect('#/' + $scope.activeGroupId + '/dashboard');
                            }
                        },
                        main: {
                            label: "Continue to Original Grockit!",
                            className: "btn-primary",
                            callback: function () {
                                var url = Utilities.originalGrockit().url + '/' + $scope.activeGroupId;
                                Utilities.redirect(url);
                            }
                        }
                    }
                };

                Utilities.dialogService(dialogOptions);
            }


        },
        setMailToInformation: function (questionId) {

            $scope.subjectMail = 'Problem with ' + $scope.titleQuest + ' question #' + questionId;
        },
        removeBadImage: function () {
            /*This function was added to solve the problem with the img on LSAT, loaded from the content editor*/
            angular.element('img').error(function () {

                angular.element('img').attr('src', '');
            });
        }
    };

    $scope.CreateNewGame = function () {

        var createGame = practiceRequests.practiceGames().createNewPracticeGame($scope.activeGroupId);

        createGame.then(function (game) {
            $scope.gameResponseId = game.data.practice_game.id;

            if ($scope.activeTracks.tracks.length > 0) {
                Practice.getQuestionSets();
            }
            else if (angular.isDefined(Utilities.getCurrentParam('questionId'))) {

                var questionToRequest = Utilities.getCurrentParam('questionId');
                Practice.loadQuestion(questionToRequest);

            }
            else {
                bootbox.alert('You must select one track at least', function () {
                    Utilities.redirect('#/' + $scope.activeGroupId + '/dashboard');
                });
            }

        }).catch(function error(error) {

            Alerts.showAlert(Alerts.setErrorApiMsg(error), 'danger');

        });


    };

    $scope.answerHasExplanation = function (index) {
        var answer = $scope.questionItems.answers[index];
        return !(answer.explanation == null || angular.isUndefined(answer.explanation) || answer.explanation == '');

    };

    $scope.nextAction = function () {

        if ($scope.nextActionTitle == 'Confirm Choice') {
            Practice.evaluateConfirmMethod();
        }
        else {
            Practice.nextQuestion();
        }

    };

    $scope.revealExplanation = function () {
        Practice.seeAnswer();
    };

    $scope.CreateNewGame();
}]);




