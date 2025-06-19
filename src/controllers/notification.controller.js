

import responseHandler from "utils/responseHandler.js";

const createNewNotification = async(req,res)=>{

    try{

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }
        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }
        const { title, message, recipientId } = req.body;

        if (!title || !message || !recipientId) {

            return responseHandler(res, 400, false, "Please fill all required fields", null);
            
        }

        const newNotification = await Notification.create({
            title,
            message,
            recipientId,
            createdBy: id
        });

        return responseHandler(res, 201, true, "Notification created successfully", newNotification);

    }catch(error){

        console.error("Error creating notification:", error);
        return responseHandler(res, 500, false, "Failed to create notification", null, error);

    }
}

