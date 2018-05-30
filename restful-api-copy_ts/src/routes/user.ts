import * as express from 'express';
const router = express.Router();
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import checkAuth from '../middleware/check-auth';

import('dotenv');

import { default as User } from '../models/user';
import { default as ExpireToken } from '../models/expireToken';

router.post('/signup', async (req, res, next) => {
    User.find({ email: req.body.email })
        .exec()
        .then((user) => {
            if (user.length >= 1) {
                return res.status(409).json({
                    message: 'Mail exists',
                });
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                            error: err,
                        });
                    } else {
                        const newUser = new User({
                            _id: new mongoose.Types.ObjectId(),
                            email: req.body.email,
                            password: hash,
                        });
                        newUser.save()
                            .then((result) => {
                                console.log(result);
                                res.status(201).json({
                                    message: 'User created',
                                });
                            })
                            .catch((error) => {
                                console.log(error);
                                res.status(500).json({
                                    error,
                                });
                            });
                    }
                });
            }
        });
});

router.post('/login', async (req, res, next) => {
    User.findOneAndUpdate({ email: req.body.email }, { status: true })
        .exec()
        .then((user) => {
            if ((user as any).length < 1) {
                return res.status(401).json({
                    message: 'Auth failed',
                });
            } else {
                bcrypt.compare(req.body.password, (user as any).password, (err, result) => {
                    if (err) {
                        return res.status(401).json({
                            message: 'Auth failed',
                        });
                    }
                    if (result) {
                        const token = jwt.sign(
                            {
                                email: (user as any).email,
                                userId: (user as any)._id,
                            },
                            process.env.JWT_KEY,
                            {
                                expiresIn: '1h',
                            },
                        );
                        // console.log(user);
                        return res.status(200).json({
                            message: 'Auth successful',
                            token,
                        });
                    }
                    return res.status(401).json({
                        message: 'Auth failed',
                    });
                });
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                error,
            });
        });
});

router.post('/logout', checkAuth, async (req, res, next) => {
    const token: string = (req.headers.authorization as string).split(' ')[1]; // 'Bearer TOKEN'
    User.findOneAndUpdate({ email: req.body.email }, { status: false })
        .exec()
        .then((user) => {
            // Expire Tokens by storing them in DB
            const expireToken = new ExpireToken({
                _id: new mongoose.Types.ObjectId(),
                token,
            });
            expireToken.save()
                .then((result) => {
                    // console.log(result);
                    res.status(201).json({
                        message: 'Token expired and User logged out successfully!',
                    });
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).json({
                        error,
                    });
                });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                error,
            });
        });
});

router.delete('/:userEmail', checkAuth, async (req, res, next) => {
    User.remove({ email: req.params.userEmail })
        .exec()
        .then((result) => {
            res.status(200).json({
                message: 'User deleted',
            });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                error,
            });
        });
});

// Get all online users
router.get('/', checkAuth, async (req, res, next) => {
    User.find({ status: true })
        .sort({ updatedAt: 'desc' })
        .exec()
        .then((result) => {
            res.status(200).json({
                users: result.map((doc) => {
                    return {
                        email: (doc as any).email,
                        status: (doc as any).status,
                    };
                }),
            });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                error,
            });
        });
});

export default router;
