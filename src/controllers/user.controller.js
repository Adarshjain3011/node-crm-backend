

import bcrypt from "bcryptjs";
import responseHandler from "../utils/responseHandler.js";
import { user_role, enquery_status } from "../utils/data.js";

import { Vendor, Client, User } from "../config/models.js";

import { Notification } from "../config/models.js";

import uploadImage from "../utils/upload.js";

// Utility to check if a user exists
async function checkUserExists(userId) {
  try {
    return await User.findById(userId);
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw new Error("User does not exist with given ID");
  }
}

// Create a new user
const createUser = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const existingUser = await checkUserExists(id);
    if (!existingUser) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const { name, email, password, role, isActive, phoneNo } = req.body;
    if (!name || !email || !password || !role) {
      return responseHandler(res, 400, false, "Please fill all required fields");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return responseHandler(res, 400, false, "User already exists");
    }

    const hashedPassword = bcrypt.hashSync(password, 6);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phoneNo,
      isActive
    });

    return responseHandler(res, 201, true, "User created successfully", newUser);

  } catch (error) {
    console.error("Error creating user:", error);
    return responseHandler(res, 500, false, "Internal server error", null, error);
  }
};

// Get all non-admin users

const getAllMembersData = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    // const members = await User.find({ role: { $ne: user_role.admin } }, "-password");
    const members = await User.find({}, "-password");
    return responseHandler(res, 200, true, "Members fetched successfully", members);

  } catch (error) {
    console.error("Error fetching members:", error);
    return responseHandler(res, 500, false, "Something went wrong", null, error);
  }
};



// Update a member's data

const updateMembersData = async (req, res) => {
  try {
    const { name, email, phoneNo, password, role, specialization, userId } = req.body;

    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    if (!userId) {
      return responseHandler(res, 400, false, "User ID is required of the person who you want to update");
    }

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (role) dataToUpdate.role = role;
    if (phoneNo) dataToUpdate.phoneNo = phoneNo;
    if (password) dataToUpdate.password = bcrypt.hashSync(password, 6);
    if (specialization) dataToUpdate.specialization = specialization;

    const updatedUser = await User.findByIdAndUpdate(userId, dataToUpdate, { new: true });

    return responseHandler(res, 200, true, "User data updated successfully", updatedUser);

  } catch (error) {
    console.error("Error updating member data:", error);
    return responseHandler(res, 500, false, "Failed to update user data", null, error);
  }
};



const resetPassword = async (req, res) => {

  try {

    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);

    if (!userExists) {

      return responseHandler(res, 400, false, "User not found", null);

    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {

      return responseHandler(res, 500, false, "all fields are required", null);

    }

    // bcrypt the password 

    const hashedPassword = await bcrypt.hash(newPassword, 6);

    userExists.password = hashedPassword;

    await userExists.save();

    return responseHandler(res, 200, true, "user password updated successfully");


  } catch (error) {

    console.log("error is : ", error);

    return responseHandler(res, 500, false, "Something went wrong while reseting the password", null, error);

  }
}



const deleteUser = async (req, res) => {

  try {

    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const { userId } = req.body;

    if (!userId) {
      return responseHandler(res, 400, false, "User ID is required to delete a user");
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return responseHandler(res, 400, false, "User does not exist", null);
    }

    await User.findByIdAndDelete(userId);

    return responseHandler(res, 200, true, "User deleted successfully", null);

  } catch (error) {

    console.error("Error deleting user:", error);
    return responseHandler(res, 500, false, "Failed to delete user", null, error);

  }

}



const uploadUserList = async (req, res) => {
  try {
    const { userList } = req.body;

    if (!userList || userList.length === 0) {
      return responseHandler(res, 400, false, "User list is empty", null);
    }

    // Hash password "1234" once
    const defaultPasswordHash = await bcrypt.hash("1234", 10);

    // Prepare the list with passwords
    const userListWithPasswords = userList.map((user) => ({
      ...user,
      password: user.password
        ? user.password
        : defaultPasswordHash, // assign default encrypted password if not present
    }));

    // Insert users in bulk
    const allUsers = await User.insertMany(userListWithPasswords);

    return responseHandler(res, 201, true, "Users created successfully", allUsers);
  } catch (error) {
    console.log("Error is:", error);
    return responseHandler(res, 500, false, "Internal server error", null);
  }
};


const updateUserImage = async (req, res) => {

  try {

    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const userImageFile = req.files.imageFile;

    console.log("user image file : ", userImageFile);

    let uploadedImageUrl = "";

    try {

      const uploadedImage = await uploadImage(userImageFile.tempFilePath);

      console.log("uploadedImage is : ",uploadedImage);
      
      uploadedImageUrl = uploadedImage.secure_url;

    } catch (error) {

      console.log("error is : ", error);

      return responseHandler(res, 500, false, "error occur while uploading the image");

    }

    console.log("secure url is : ",uploadedImageUrl);

    userExists.userImage = uploadedImageUrl;

    await userExists.save();

    return responseHandler(res,200,true,"user image uploaded sucesssfully",userExists);

  } catch (error) {

    console.log("error is : ", error);

    return responseHandler(res, 500, false, "error occur while updating an user image ");

  }
}




export {
  createUser,
  getAllMembersData,
  updateMembersData,
  deleteUser,
  uploadUserList,
  resetPassword,
  updateUserImage

};



