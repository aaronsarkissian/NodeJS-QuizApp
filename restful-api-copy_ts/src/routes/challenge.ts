import * as express from 'express';
const router = express.Router();
import * as mongoose from 'mongoose';

import checkAuth from '../middleware/check-auth';

let challengeUsers;

router.get('/request/:user1&:user2/', checkAuth, async (req, res, next) => {

    challengeUsers = {
        user1: req.params.user1,
        user2: req.params.user2,
    };

    res.status(200).json({
        message: `Challenge request sent to ${req.params.user2} successfully!`,
    });
});

export { router, challengeUsers };

// The correct way is to store everything in DB.
