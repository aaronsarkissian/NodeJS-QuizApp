import { Request, Response, Router, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

import { default as ExpireToken } from '../models/expireToken';

const checkAuth = (req, res, next) => {
    try {
        const token = (req.headers.authorization as string).split(' ')[1];
        ExpireToken.findOne({token})
        .exec()
        .then((result) => {
            if (result) {
                return res.status(401).json({
                    message: 'Auth failed - Expired Token',
                });
            } else {
                const decoded = jwt.verify(token, process.env.JWT_KEY);
                req.userData = decoded;
                next();
            }
        }).catch((error) => {
            res.status(500).json({
                error,
            });
        });
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed',
        });
    }
};

export default checkAuth;
