const {
    conversation,
    Simple
} = require('@assistant/conversation');

const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

const app = conversation();

const sentences = require('./sentences');

const sentenceArray = sentences.sentenceArray;

function similarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength == 0) return 1.0;
    else return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    let costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

const findMean = (arr) => {
    let sum = arr.reduce((partial_sum, a) => partial_sum + a, 0);
    return Math.floor(sum / arr.length);
}

function isNumeric(str) {
    if (typeof str != "string") return false;
    return !isNaN(str) && !isNaN(parseFloat(str))
}

function trim(s) {
    return (s || '').replace(/^\s+|\s+$/g, '');
}

function copyKeyAndValues(obj) {
    if (obj === null || typeof (obj) !== 'object') return obj;

    var copy = obj.constructor();

    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            copy[attr] = obj[attr];
        }
    }

    return copy;
}

function logSimple(jsonPayload, logType) {
    let jsonLog = copyKeyAndValues(jsonPayload);
    jsonLog.severity = 'INFO';
    jsonLog.logType = logType;
    console.log(JSON.stringify(jsonLog));
}

function logEnd(userParams, sessionParams, issueType, sceneName) {
    let jsonLog = {};
    jsonLog.severity = 'INFO';
    jsonLog.logType = 'END';
    jsonLog.sceneName = sceneName;

    if (issueType !== "")
        jsonLog.issueType = issueType;

    if (userParams.testMode)
        jsonLog.uid = userParams.uid;

    jsonLog.level = userParams.level;

    jsonLog.stepTimes = sessionParams.stepTimes;
    jsonLog.stepNames = sessionParams.stepNames;

    jsonLog.pracIterNo = sessionParams.pracIterNo;

    jsonLog.indices = sessionParams.indices;
    jsonLog.points = sessionParams.points;
    jsonLog.answers = sessionParams.answers;
    jsonLog.count = sessionParams.count;
    
    console.log(JSON.stringify(jsonLog));

}

function removeKeyAndValues(json) {
    let keys = Object.keys(json);
    for (let i = 0; i < keys.length; i++) json[keys[i]] = null;
    return json;
}

function logDebug(msg){
    console.log(msg);
    /*let jsonLog = {};
    jsonLog.logType = 'FULFILLMENT';
    jsonLog.msg = msg;
    console.log(JSON.stringify(jsonLog));*/
}

app.handle('clearUserParams', conv => {
    logDebug('clearUserParams');

    let uid = conv.user.params.uid;
    removeKeyAndValues(conv.user.params);
    conv.user.params.uid = uid;
    logSimple(conv.user.params, 'CLEAR_HISTORY');
    conv.add(new Simple({speech: `All information has been clear.`}));
});


app.handle('resetUserParams', conv => {
    logDebug('resetUserParams');

    removeKeyAndValues(conv.user.params);
    conv.user.params.uid = "";
    logSimple(conv.user.params, 'RESET_SETTING');
    conv.add(new Simple({speech: `All information has been reset.`}));
});

app.handle('saveUID', (conv) => {
    logDebug('saveUID');

    let uid = trim(conv.scene.slots.uid.value).toLowerCase();
    conv.user.params.uid = uid;
    logSimple(conv.user.params, 'UID_SETTING');

    conv.add(new Simple({speech: "Your UID is " + uid + "."}));
});

app.handle('getUID', (conv) => {
    logDebug('getUID');

    let uid = conv.user.params.uid;
    logSimple(conv.user.params, 'INFORM_UID');

    if (!uid || uid === "" || !isNumeric(uid)) conv.add(new Simple({speech: "You do not have UID."}));
    else conv.add(new Simple({speech: "Your UID is " + uid + "."}));
});

const minuteInMillisecond= 1000*60;

function setStepTimeAndName(conv, time, name){
    logDebug(`setStepTimeAndName(${time}, ${name})`);
    conv.session.params.stepTimes.push(time);
    conv.session.params.stepNames.push(name);
}

app.handle('handleTransition', (conv) => {
    logDebug('handleTransition');

    conv.session.params.stepTimes = [];
    conv.session.params.stepNames = [];
    
    const startTime = Date.now();
    setStepTimeAndName(conv, startTime, 'START');

    if (!conv.user.params.points || conv.user.params.testMode === undefined || conv.user.params.testMode === null)
        conv.user.params.points = [];
        
    if (!conv.user.params.indices || conv.user.params.testMode === undefined || conv.user.params.testMode === null)
        conv.user.params.indices = [];

    conv.session.params.points = [];
    conv.session.params.indices = [];
    conv.session.params.answers = [];

    conv.session.params.count = 0;
    conv.session.params.current = {};
    
    if (!conv.user.params.uid || conv.user.params.uid === "" || !isNumeric(conv.user.params.uid)) conv.user.params.testMode = false;
    else conv.user.params.testMode = true;
    

    if (!conv.user.params.testMode) conv.scene.next.name = "SpeechPractice";
    else conv.scene.next.name = "ActivityEnquiry";

    conv.session.params.pracIterNo = 0;

    conv.session.params.timeZone = conv.device.timeZone.id;
    conv.session.params.locale = conv.user.locale;
    conv.session.params.lastSeenTime = conv.user.lastSeenTime;

    if (!conv.user.params.testMode)
        conv.session.params.capabilities = numbersCopy = [...conv.device.capabilities];
    
    
    let jsonlog = {};
    jsonlog.uid = conv.user.params.uid;
    jsonlog.startTime = startTime;
    jsonlog.pracIterNo = conv.session.params.pracIterNo;
    logSimple(jsonlog, 'START');
});

app.handle('ErrorHandling', (conv) => {
    setStepTimeAndName(conv, Date.now(), 'ErrorHandling');
});

app.handle('setActivityEnquiryStartTime', (conv) => {
    logDebug('setActivityEnquiryTime');
    setStepTimeAndName(conv, Date.now(), 'ACTIVITY_ENQUIRY');
});

//TODO handler name needs to be changed: setActivityEnquiryStartTime -> setLearningEnquiryTime
app.handle('setLearningEnquiryTime', (conv) => {
    logDebug('setLearningEnquiryTime');

    setStepTimeAndName(conv, Date.now(), 'LEARNING_ENQUIRY');

    if (!conv.user.params.level) conv.user.params.level = 1;

    setLearningEnquiryQuestion(conv);
});

app.handle('learningEnquiryErrorHandling', (conv) => {
    setStepTimeAndName(conv, Date.now(), 'LEARNING_ENQUIRY_ERROR_HANDLING');
    setLearningEnquiryQuestion(conv);
});

function setLearningEnquiryQuestion(conv){
    if(conv.session.params.pracIterNo <= 0) conv.add("Would you like to practice your pronunciation? Please answer yes or no.");
    else conv.add("Would you like to continue? Please answer yes or no.");
}

app.handle('incrementPracIterNo', (conv) => {
    logDebug('incrementPracIterNo');
    if(conv.session.params.pracIterNo <= 0) conv.add("Great! Let's get started!");
    else conv.add("Great! Let's get continued!");

    conv.session.params.pracIterNo= conv.session.params.pracIterNo + 1;
});

const numberOfPoints = 20;
const levelUpPointThreshold = 90;

app.handle('giveSentence', (conv) => {
    logDebug('giveSentence');

    if (!conv.user.params.level) conv.user.params.level = 1;

    // check whether user needs to level up
    let levelUp = "";
    if (conv.user.params.level < sentenceArray[conv.user.params.level - 1].length &&
        numberOfPoints <= conv.user.params.points.length &&
        levelUpPointThreshold < findMean(conv.user.params.points.slice(-1 * numberOfPoints))) {
        conv.user.params.level += 1;
        conv.session.params.answers.push('NEXT LEVEL');
        conv.session.params.points.push('NEXT LEVEL');
        conv.session.params.indices.push('NEXT LEVEL');

        setStepTimeAndName(conv, Date.now(), 'NEXT_LEVEL');

        conv.user.params.indices = [];
        conv.user.params.points = [];
        levelUp = `Congratulations! You have reached the next level. Now you are on level ${conv.user.params.level}.`;
    }

    let sentences = sentenceArray[conv.user.params.level - 1];

    if (conv.user.params.indices.length == sentences.length)
        conv.user.params.indices = [];

    let index = Math.floor(Math.random() * sentences.length);
    while (conv.user.params.indices.includes(index)) {
        index = Math.floor(Math.random() * sentences.length);
    }

    conv.session.params.index = index;
    conv.session.params.current = sentences[index];

    let answer = conv.session.params.current;
    let greeting = conv.user.params.testMode ? "" : "Hi!";

    if (conv.session.params.count === 0) conv.add(`${greeting} ${levelUp} Repeat after me. ${answer}`);
    else conv.add(`${levelUp} Next sentence. Repeat after me. ${answer}`);

    setStepTimeAndName(conv, Date.now(), 'GIVE_SENTENCE');

});

app.handle('repeatSentence', (conv) => {
    logDebug('repeatSentence');
    setStepTimeAndName(conv, Date.now(), 'GIVE_SENTENCE_ERROR_HANDLING');
    
    let answer = conv.session.params.current;
    conv.add(new Simple({speech: `Repeat after me. ${answer}`}));
});


app.handle('checkAnswer', (conv) => {
    logDebug('checkAnswer');

    let answer = conv.session.params.current.replace(/[^a-zA-Z0-9\s]/g, '');
    let user_answer = conv.scene.slots.answer.value;
    let modified_user_answer = user_answer.replace(/[^a-zA-Z0-9\s]/g, '');

    let point = similarity(modified_user_answer.toLowerCase(), answer.toLowerCase());
    point = Math.round(point * 100);

    setStepTimeAndName(conv, Date.now(), 'CHECK_ANSWER');

    conv.user.params.points.push(point);

    if (conv.user.params.testMode) {
        conv.session.params.answers.push(user_answer);
        conv.session.params.points.push(point);
        conv.session.params.indices.push(conv.session.params.index);
    }
    conv.session.params.count += 1;
    conv.user.params.indices.push(conv.session.params.index);

    if (point == 100) conv.add(point + ' points! Excellent! You did a good job!');
    else if (90 < point) conv.add(point + ' points! Great! Your speech sounds like. ' + user_answer + '.');
    else if (80 < point) conv.add(point + ' points! Good! Your speech sounds like. ' + user_answer + '.');
    else if (70 < point) conv.add(point + ' points! Not Bad! Your speech sounds like. ' + user_answer + '.');
    else if (60 < point) conv.add(point + ' points! I know you can do better. Your speech sounds like. ' + user_answer + '.');
    else conv.add(point + ' points! Your speech sounds like. ' + user_answer + '.');

    if (conv.user.params.testMode){
        if(conv.user.params.uid <= 6 && 12 <= conv.session.params.count){
            conv.add('You have reached the maximum number of sentences for now. See you next time!');
            setStepTimeAndName(conv, Date.now(), 'END');
            logEnd(conv.user.params, conv.session.params, "", conv.scene.name);
            conv.scene.next.name = 'actions.scene.END_CONVERSATION';
        } else if(conv.user.params.uid > 6){
            const startTime = conv.session.params.stepTimes[0];
            if(startTime + 10*minuteInMillisecond <= Date.now()){
                conv.add('You have reached the maximum time for now. See you next time!');
                setStepTimeAndName(conv, Date.now(), 'END');
                logEnd(conv.user.params, conv.session.params, "", conv.scene.name);
                conv.scene.next.name = 'actions.scene.END_CONVERSATION';
            }else if(startTime + 3*minuteInMillisecond + (conv.session.params.pracIterNo-1)*2*minuteInMillisecond <= Date.now()) 
                conv.scene.next.name = "LearningEnquiry";
        }
    }
});
  
app.handle('setEndTime', (conv) => {
    logDebug('setEndTime');

    setStepTimeAndName(conv, Date.now(), 'END');

    if (!conv.user.params.testMode) conv.add("See you next time!");
    else {
        setStepTimeAndName(conv, Date.now(), 'REASON_INQUIRY');
        //TODO speechSentence = "<speak>Why do you want to stop?<break time = '7s'/>See you next time!</speak>";
        conv.add("Why do you want to stop?");
    }
    conv.prompt.override = true;
    
    logEnd(conv.user.params, conv.session.params, "", conv.scene.name);
});

app.handle('setEndTimeWithNoInput', (conv) => {
    logDebug('setEndTimeWithNoInput');
    setStepTimeAndName(conv, Date.now(), 'NO_INPUT_END');
    logEnd(conv.user.params, conv.session.params, 'NO_INPUT', conv.scene.name);
});

app.handle('setEndTimeWithNoMatch', (conv) => {
    logDebug('setEndTimeWithNoMatch');

    setStepTimeAndName(conv, Date.now(), 'NO_MATCH_END');
    logEnd(conv.user.params, conv.session.params, 'NO_MATCH', conv.scene.name);
});


exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);