
import jwt from "jsonwebtoken";

import responseHandler from "../utils/responseHandler.js";

export const authMiddleware = async (req, res, next) => {

    try{



    }catch(error){

        console.log("error is ",error);
        return responseHandler(res, 500, false, "Something went wrong", null, error);
    }
}

