/**
 
 Copyright 2016 Brian Donohue.
 
*/

var config = {};
config.IOT_BROKER_ENDPOINT      = "[YOUR ENDPOINT]".toLowerCase();
config.IOT_BROKER_REGION        = "us-east-1";
config.IOT_THING_NAME           = "[YOUR THING NAME]";
//Loading AWS SDK libraries
var AWS = require('aws-sdk');
AWS.config.region = config.IOT_BROKER_REGION;
//Initializing client for IoT
var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});

'use strict';

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
		 
     if (event.session.application.applicationId !== "[YOUR SKILL ID]") {
         context.fail("Invalid Application ID");
         }
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    var cardTitle = "Media C.T.L.";
    var speechOutput = "You can tell Media C.T.L. to watch T.V., watch a D.V.D. or watch Apple T.V.";
    callback(session.attributes,
        buildSpeechletResponse(cardTitle, speechOutput, "", true));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == 'WatchIntent') {
        console.log("Transaction start");
        /****/
        var repromptText = null;
        var sessionAttributes = {};
        var shouldEndSession = true;
        var speechOutput = "";
        var payloadObj="on"; //On
        console.log("Getting MediaSlotValue");
        var MediaSlotValue = intentRequest.intent.slots.MEDIA.value;
        //Prepare the parameters of the update call

        console.log("The Media type is " + MediaSlotValue);
        
        if (MediaSlotValue == "TV") {
            var MediaCTLstr = '{ "state": {"desired": { "MEDIA" : "TV", "RECEIVER" : "On", "TV" : "On", "SAT" : "On", "BLURAY" : "Off", "APPLETV" : "Off" } } }';
        }
        if (MediaSlotValue == "DIRECTTV") {
            var MediaCTLstr = '{ "state": {"desired": { "MEDIA" : "TV", "RECEIVER" : "On", "TV" : "On", "SAT" : "On", "BLURAY" : "Off", "APPLETV" : "Off" } } }';
        }
        if (MediaSlotValue == "APPLETV") {
            var MediaCTLstr = '{ "state": {"desired": { "MEDIA" : "APPLETV", "RECEIVER" : "On", "TV" : "On", "SAT" : "Off", "BLURAY" : "Off", "APPLETV" : "On" } } }';
        }
        if (MediaSlotValue == "BLURAY") {
            var MediaCTLstr = '{ "state": {"desired": { "MEDIA" : "BLURAY", "RECEIVER" : "On", "TV" : "On", "SAT" : "Off", "BLURAY" : "On", "APPLETV" : "Off" } } }';
        }
        if (MediaSlotValue == "DVD") {
            var MediaCTLstr = '{ "state": {"desired": { "MEDIA" : "BLURAY", "RECEIVER" : "On", "TV" : "On", "SAT" : "Off", "BLURAY" : "On", "APPLETV" : "Off" } } }';
        }
        console.log("Passing to JSON " + MediaCTLstr);
        var paramsUpdate = {
            topic:"$aws/things/MediaCTL/shadow/update",
           payload: (JSON.stringify(MediaCTLstr)),
            qos:0
        };
        iotData.publish(paramsUpdate, function(err, data) {
        if (err){
          //Handle the error here
          console.log("MQTT Error" + data);
         }  
        });
        console.log(paramsUpdate);
        handleMediaRequest(intent, session, callback);
        console.log("Transaction end");
    }
    else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

function handleMediaRequest(intent, session, callback) {
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("O.K.", "", "true"));
}

// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}