import mongoose from "mongoose";
import { ApiErrorResponse } from "../utils/ApiErrorResponse.js";
import jwt from 'jsonwebtoken';
const errorHandler = (err, req, res, next) => {
    
    let error = err;
    if (!(error instanceof ApiErrorResponse) && !(error instanceof jwt.JsonWebTokenError)) {
        const statusCode = 500;
        if (error.statusCode) {
            statusCode = 400;
        }
        const message = error.message || "something went wrong";
        error = new ApiErrorResponse(statusCode, message, error.errors || [], err.stack)
    }
    else if (error instanceof jwt.JsonWebTokenError) {
        const statusCode = 401;
        const message = "Token Expired please relogin";
        error = new ApiErrorResponse(statusCode, message, error || [], err.stack)
    }
    console.log(error.message);

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === 'developement' ? {
            stack: error.stack
        } : {})
    };
    return res.status(error.statusCode).json(response);
}

export { errorHandler }