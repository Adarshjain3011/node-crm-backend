
import mongoose from "mongoose";

const dbConnnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database connected");
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
};

export default dbConnnect;


