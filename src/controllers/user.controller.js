

import User from "../models/user.model.js";

import responseHandler from "../utils/responseHandler.js";

import { user_role, enquery_status } from "../utils/data.js";
import Client from "../models/clientEnquery.model.js";

import bcrypt from "bcryptjs";


// create new User 

const createUser = async (req, res) => {

    try {

        const { name, email, password, role, isActive,phoneNo } = req.body;

        if (!name || !email || !password || !role) {

            return responseHandler(res, 400, false, "Please fill all the fields");

        }

        // check user is already exists or not by checking email 

        const userExists = await User.findOne({ email });

        if (userExists) {

            return responseHandler(res, 400, false, "User already exists");

        }

        let hashedPassword = bcrypt.hashSync(password, 6);

        const newUser = await User.create({ name, email, password: hashedPassword, role,phoneNo:phoneNo });

        return responseHandler(res, 201, true, "User created successfully", newUser);


    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);
    }
}

// get All Sales person 


const getAllSalesPerson = async (req, res) => {

    try {

        const salesPerson = await User.find({ role: user_role.sales });
        return responseHandler(res, 200, true, "Sales person fetched successfully", salesPerson);


    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);

    }
}



// get all members data 

const getAllMembersData = async (req, res) => {

    try {


        const nonAdmins = await User.find({ role: { $ne: user_role.admin } });

        return responseHandler(res, 200, true, "Sales person fetched successfully", nonAdmins);


    } catch (error) {

        console.log("error is ", error);

    }
}




// assign a person to the query 

const assignPersonToEnquery = async (req, res) => {

    try {


        const adminId = "681f4ca937491ad52145d7da";

        const { enqueryId, salesPersonId } = req.body;

        if (!enqueryId || !salesPersonId) {

            return responseHandler(res, 400, false, "Please fill all the fields");

        }

        // check that enquery is exists or not 

        const isEnqueryExists = await Client.findById(enqueryId);

        if (!isEnqueryExists) {

            return responseHandler(res, 400, false, "Enquery does not exists");

        }

        // check that sales person is exists or not 

        const isSalesPersonExists = await User.findById(salesPersonId);

        if (!isSalesPersonExists) {

            return responseHandler(res, 400, false, "Sales person does not exists");

        }

        // assign the sales person to the enquery 

        const updatedQueryData = await Client.findByIdAndUpdate(enqueryId, {

            assignedTo: salesPersonId,
            assignedBy: adminId,
            status: enquery_status.Assigned,

        })

        return responseHandler(res, 200, true, "Sales person assigned successfully", updatedQueryData);

    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);

    }
}


// update the members data --> route -> update-members-data

const updateMembersData = async (req, res) => {

    try{

        const {name,email,phoneNo,passowrd,role,userId} = req.body;


        console.log("name : ",name,"email : ",email,"passowrd : ",passowrd,"role : ",role,"userId : ",userId);

        let dataToUpdate = {};

        if(name){
            
            dataToUpdate.name = name;
            
        }

        if(email){
            
            dataToUpdate.email = email;
            
        }

        if(role){
            
            dataToUpdate.role = role;
            
        }

        if(passowrd){
            
            let hashedPassword = bcrypt.hashSync(password, 6);
            dataToUpdate.password = hashedPassword;
            
        }

        if(phoneNo){

            dataToUpdate.phoneNo = phoneNo;
            
        }

        const updatedData = await User.findByIdAndUpdate(userId,dataToUpdate);

        return responseHandler(res,200,true,"data updated successfully",updatedData);

    }catch(error){

        console.log("error is : ",error);

        return responseHandler(res,500,false,"error occur while updating the data",null);
    }
}


export {

    createUser,
    getAllSalesPerson,
    assignPersonToEnquery,
    getAllMembersData,
    updateMembersData

}

