
import responseHandler from "../utils/responseHandler.js";

import { checkUserExists } from "../utils/helper.js";

import { user_role } from "../utils/data.js";
import { Notification,User } from "../config/models.js";

const getAllNotification = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const userExists = await checkUserExists(id);

        if (!userExists) {

            return responseHandler(res, 400, false, "User not found", null);

        }

        let notificationsData;

        if(userExists.role == user_role.admin){

            notificationsData = await Notification.find({}).populate("recipientId","name");

        }
        else{

            notificationsData = await Notification.find({

                recipientId:userExists._id,

            }).populate("recipientId","name");

        }

        return responseHandler(res,200,true,"all notifications fetched successfully",notificationsData);

        
    } catch (error) {

        console.log("error is : ", error);
        return responseHandler(res, 500, false, "error occur while creating the notification ", null, error);

    }
}

export {

    getAllNotification,

}


