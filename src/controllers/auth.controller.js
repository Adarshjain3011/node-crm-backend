import responseHandler from "../utils/responseHandler.js";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import { User } from "../config/models.js";


export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return responseHandler(res, 400, false, "Please fill all the fields")

        }

        // check user  exists or not 

        const isUserExists = await User.findOne({

            email: email,
        });

        if (!isUserExists) {

            return responseHandler(res, 400, false, "User does not exists");

        }

        // then compare the password 

        let isPasswordMatch = await bcrypt.compare(password, isUserExists.password);

        if (!isPasswordMatch) {

            return responseHandler(res, 400, false, "Password does not match");

        }

        // create an token data

        const tokenData = {

            id: isUserExists._id,
            name: isUserExists.name,
            email: isUserExists.email,
            role: isUserExists.role
        }

        // create an token 

        const token = jwt.sign(tokenData, process.env.JWT_SECRET, {

            expiresIn: "1d"

        })

        // Set cookie options based on environment
        const cookieOptions = {
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-domain in production
            secure: process.env.NODE_ENV === 'production', // must be true if sameSite is 'none'
            path: '/', // cookie available across all paths
            // domain: process.env.COOKIE_DOMAIN || undefined // uncomment and set if needed
        };

        // Set the token in cookie
        res.cookie("token", token, cookieOptions);

        // Remove sensitive data before sending response
        const userResponse = {
            _id: isUserExists._id,
            name: isUserExists.name,
            email: isUserExists.email,
            role: isUserExists.role,
            phoneNo:isUserExists.phoneNo,
            createdAt: isUserExists.createdAt,
            updatedAt: isUserExists.updatedAt
        };

        return responseHandler(res, 200, true, "User logged in successfully", userResponse);


    } catch (error) {

        console.log("error is :", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);

    }
}


export const logout = async (req, res) => {
    try {

        // Clear the token cookie
        
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
        });

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Something went wrong during logout" });
    }
};



