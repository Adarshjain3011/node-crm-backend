
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

        // now we have to set the token in the cookie 

        res.cookie("token", token, {
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            httpOnly: true,
            sameSite: "lax", // 👈 This is better for localhost. Don't use "none" without secure.
            secure: false,   // 👈 false in localhost, true in production with HTTPS
        });


        return responseHandler(res, 200, true, "User logged in successfully", isUserExists);


    } catch (error) {

        console.log("error is :", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);

    }
}

