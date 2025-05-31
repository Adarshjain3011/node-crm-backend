
const responseHandler = (res, status, success, message, data = null, error = null) => {
    return res.status(status).json({
        success,
        message,
        data,
        error,
    });
};


export default responseHandler;

