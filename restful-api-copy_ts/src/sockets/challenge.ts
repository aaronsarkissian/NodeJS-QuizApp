import * as fs from 'fs';
import * as io from 'socket.io';
import * as mongoose from 'mongoose';
import * as _ from 'lodash';
// import { default as Challenge } from '../models/challenge';
import { challengeUsers } from '../routes/challenge';
const socketIo = io();

// Assume that this is the Database of our questions
const quizDB = JSON.parse(fs.readFileSync('./quizzes.json', 'utf8'));

// Generates not repeatable random numbers from [0, 9]
let questionsLI = []; // Only usable during the creation of random numbers
let orderedList = [];
const questionNumHandler = (): number => {
    const rand = Math.floor(Math.random() * 10); // This number should match to the total of the questions in DB.
    if (questionsLI[rand] === undefined) {
        questionsLI[rand] = rand;
        orderedList.push(rand);
        return rand;
    } else {
        return questionNumHandler();
    }
};

// Gets {5} random questions
const questionGenerator = () => {
    const fiveQuestions = [];
    for (let i = 0; i < 5; i++) { // Change this number if you want to get more than {5} questions
        const rand = questionNumHandler();
        fiveQuestions[i] = quizDB[rand].fullQuestion; // .fullQuestion is for not sending the answers to the client
    }
    questionsLI = []; // Empty the array
    return fiveQuestions;
};

let userScores = {
    status1: false,
    status2: false,
    user1: 0,
    user2: 0,
};

const resetTheData = () => {
    orderedList = [];

    userScores = {
        status1: false,
        status2: false,
        user1: 0,
        user2: 0,
    };
};

let c = 1; // LOG
socketIo.on('connection', (socket) => {
    console.log(`User ${c++} connected`);

    // Get the challenge request from user1
    socket.on('CHALLENGE_REQ', (data) => {
        // Sends the challenge request to user2
        socket.broadcast.emit('CHALLENGE_REQ_BACK', {
            user: challengeUsers.user2,
            text: `User ${data} challenged you. Would you like to play?`, // I could handle the text part at client side
        });
    });

    // Get the user response of starting challenge
    socket.on('CHALLENGE_STATUS', (data) => {
        let statMsg;
        if (data.stat === 1) {
            statMsg = 'Quiz is starting!';
        } else {
            statMsg = 'Quiz declined!';
        }

        // Sends back a text message about the challenge status
        socketIo.emit('CHALLENGE_STATUS_BACK', {
            user1: challengeUsers.user1,
            user2: challengeUsers.user2,
            msg: statMsg,
            stat: data.stat,
        });
    });

    // Get quiz request
    socket.on('QUIZ_REQ', () => {
        const fullQuestions = questionGenerator();

        // Send the quizzes to the clients
        socketIo.emit('QUIZ_PUSH', {
            user1: challengeUsers.user1,
            user2: challengeUsers.user2,
            fullData: fullQuestions,
            timeLimit: 45,
        });
    });

    const quizChecker = (data) => {
        let tmpUser;
        tmpUser = data.user;
        delete data.user; // Removes the user from the obj to iterate only over answers
        if (challengeUsers.user1 === tmpUser) {
            userScores.status1 = true;
        }
        if (challengeUsers.user2 === tmpUser) {
            userScores.status2 = true;
        }
        let pos = 0;
        // tslint:disable-next-line:forin
        for (const key in data) {
            if (_.isEqual(quizDB[orderedList[pos]].correctAnswers, data[key])) {
                if (challengeUsers.user1 === tmpUser) {
                    userScores.user1++;
                } else if (challengeUsers.user2 === tmpUser) {
                    userScores.user2++;
                }
            }
            pos++;
        }
    };

    // Get quiz answers
    socket.on('QUIZ_ANS', (data) => {
        quizChecker(data);

        // Checks if both of them already answered
        if (userScores.status1 && userScores.status2) {
            // Send the results back to the both clients
            socketIo.emit('QUIZ_RESULTS', {
                user1: challengeUsers.user1,
                user2: challengeUsers.user2,
                user1Score: userScores.user1,
                user2Score: userScores.user2,
            });

            // Resetting the results
            resetTheData();
        }
    });

});

export default socketIo;
